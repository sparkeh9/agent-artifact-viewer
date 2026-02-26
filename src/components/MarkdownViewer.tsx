import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isTauri } from '../utils/isTauri';
// import { open } from '@tauri-apps/plugin-shell'; // Commented out as broken

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import remarkDirective from 'remark-directive';
import remarkGithub from 'remark-github-blockquote-alert';
import { remarkDirectiveRehype, remarkCarousel } from '../lib/remark-plugins';
import { Alert } from './Alert';
import { Carousel } from './Carousel';
import { Mermaid } from './Mermaid';
import { getFileIconUrl } from '../utils/vscode-icons';
import { FileViewerModal } from './FileViewerModal';
import { TooltipProvider, useTooltip } from './TooltipContext';
import { useCommentStore } from '../store/commentStore';
import { createSelectorFromRange, createSelectorFromSelection } from '../utils/selectors';
import { CommentButton } from './CommentButton';
import { CommentInput } from './CommentInput';

// Context to stabilize handlers and prevent re-renders of valid links
interface LinkContextType {
    openModal: (path: string) => void;
}

const LinkContext = React.createContext<LinkContextType>({
    openModal: () => { },
});

// Standalone Link Component to prevent re-creation
const FileLink = React.memo(({ href, children }: any) => {
    // ... rest of FileLink implementation ...
    const { openModal } = React.useContext(LinkContext);
    const { openTooltip, closeTooltip } = useTooltip();
    const filename = href?.split('/').pop() || '';
    const iconUrl = getFileIconUrl(filename);
    const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleClick = React.useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!href) return;
        e.preventDefault();

        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        closeTooltip();

        let path = href;
        if (href.startsWith('file://')) {
            try {
                const url = new URL(href);
                path = decodeURIComponent(url.pathname);
                if (/^\/[a-zA-Z]:/.test(path)) {
                    path = path.substring(1);
                }
            } catch (e) {
                path = decodeURIComponent(href.replace(/^file:\/\/\/?/, ''));
            }
        }


        if (isTauri()) {
            invoke('open_file', { path }).catch(console.error);
        } else {
            openModal(path);
        }
    }, [href, openModal, closeTooltip]);

    const handleMouseEnter = React.useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!href) return;

        if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

        let path = href;
        if (href.startsWith('file://')) {
            try {
                const url = new URL(href);
                path = decodeURIComponent(url.pathname);
                if (/^\/[a-zA-Z]:/.test(path)) {
                    path = path.substring(1);
                }
            } catch (e) {
                path = decodeURIComponent(href.replace(/^file:\/\/\/?/, ''));
            }
        }

        const rect = e.currentTarget.getBoundingClientRect();

        hoverTimerRef.current = setTimeout(() => {
            openTooltip(path, rect);
        }, 500);
    }, [href, openTooltip]);

    const handleMouseLeave = React.useCallback(() => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current);
            hoverTimerRef.current = null;
        }
        closeTooltip(false); // Enable delayed close
    }, [closeTooltip]);

    if (!href) return <a>{children}</a>;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded text-brand-cyan hover:text-white transition-colors no-underline border border-white/10 hover:border-brand-cyan/30 cursor-pointer"
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {iconUrl && <img src={iconUrl} alt="" className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.border = '2px solid red'; }} />}
            <span>{children}</span>
        </a>
    );
});

interface MarkdownViewerProps {
    content: string;
    filePath?: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, filePath }) => {
    // Modal State
    const [previewModalOpen, setPreviewModalOpen] = React.useState(false);
    const [previewContent, setPreviewContent] = React.useState<string | null>(null);
    const [previewPath, setPreviewPath] = React.useState<string | null>(null);
    const [previewError, setPreviewError] = React.useState<string | null>(null);

    const openModal = React.useCallback(async (path: string) => {
        setPreviewPath(path);
        setPreviewModalOpen(true);
        setPreviewError(null);
        setPreviewContent(null);

        try {
            console.log(`Reading file for modal: ${path}`);
            const content = await invoke<string>('read_file', { path });
            setPreviewContent(content);
        } catch (err) {
            console.error('Failed to read file:', err);
            setPreviewError(String(err));
        }
    }, []);

    const contextValue = React.useMemo(() => ({
        openModal,
    }), [openModal]);

    // Memoize components to prevent re-mounting on every render
    const components = React.useMemo(() => ({
        h1: ({ children }: any) => <h1 className="text-4xl font-bold text-white mb-6 border-b border-white/10 pb-4">{children}</h1>,
        h2: ({ children }: any) => <h2 className="text-2xl font-bold text-white mt-8 mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-brand-cyan" />
            {children}
        </h2>,
        h3: ({ children }: any) => <h3 className="text-xl font-bold text-slate-200 mt-6 mb-3">{children}</h3>,
        p: ({ children }: any) => <p className="text-slate-400 mb-4 leading-relaxed">{children}</p>,
        ul: ({ children }: any) => <ul className="list-disc list-outside ml-6 space-y-2 mb-4 text-slate-400">{children}</ul>,
        ol: ({ children }: any) => <ol className="list-decimal list-outside ml-6 space-y-2 mb-4 text-slate-400">{children}</ol>,
        li: ({ children }: any) => <li>{children}</li>,
        code: ({ className, children }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match;
            const language = match ? match[1] : '';

            if (!isInline && language === 'mermaid') {
                return <Mermaid chart={String(children).replace(/\n$/, '')} />;
            }

            return isInline ? (
                <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-brand-cyan text-sm">{children}</code>
            ) : (
                <div className="rounded-custom overflow-hidden border border-white/10 bg-black/40 font-mono text-sm my-6">
                    <div className="bg-white/5 px-4 py-2 flex justify-between border-b border-white/10">
                        <span className="text-xs text-slate-500">{language || 'text'}</span>
                    </div>
                    <pre className="p-0 m-0 overflow-x-auto custom-scrollbar">
                        <code className={`${className} !bg-transparent !p-4 block`}>{children}</code>
                    </pre>
                </div>
            );
        },
        a: FileLink, // Use stable component
        blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-slate-700 pl-4 py-1 my-4 italic text-slate-400 bg-white/5 rounded-r">
                {children}
            </blockquote>
        ),
        div: ({ className, children, ...props }: any) => {
            const directive = (props as any)['data-directive'];

            if (directive === 'carousel') {
                return <Carousel>{children}</Carousel>;
            }

            if (className?.includes('markdown-alert')) {
                let type = 'NOTE';
                if (className.includes('markdown-alert-note')) type = 'NOTE';
                if (className.includes('markdown-alert-tip')) type = 'TIP';
                if (className.includes('markdown-alert-important')) type = 'IMPORTANT';
                if (className.includes('markdown-alert-warning')) type = 'WARNING';
                if (className.includes('markdown-alert-caution')) type = 'CAUTION';

                const content = React.Children.toArray(children).filter((child: any) => {
                    return !child?.props?.className?.includes('markdown-alert-title');
                });

                return <Alert type={type as any}>{content}</Alert>;
            }

            return <div className={className} {...props}>{children}</div>;
        },
        hr: () => <hr className="border-white/10 my-8" />,
    }), []); // Dependencies empty as FileLink uses context

    const { addComment } = useCommentStore();

    // Comment State
    const [selectionState, setSelectionState] = React.useState<{
        range: Range;
        rect: DOMRect;
        isCommenting: boolean;
    } | null>(null);

    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (!containerRef.current || !selection || selection.isCollapsed) {
                // Only clear if not currently commenting
                if (selectionState && !selectionState.isCommenting) {
                    setSelectionState(null);
                }
                return;
            }

            const range = selection.getRangeAt(0);

            // Check if selection is inside our container
            if (!containerRef.current.contains(range.commonAncestorContainer)) {
                return;
            }

            // If we are already commenting, don't update selection state to avoid jumping UI
            if (selectionState?.isCommenting) return;

            const rect = range.getBoundingClientRect();
            // Don't show if empty rect (sometimes happens with empty selection)
            if (rect.width === 0 && rect.height === 0) return;

            setSelectionState({
                range: range.cloneRange(),
                rect,
                isCommenting: false
            });
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        // Also listen for mouseup to handle end of selection more reliably
        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('keyup', handleSelectionChange);

        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('mouseup', handleSelectionChange);
            document.removeEventListener('keyup', handleSelectionChange);
        };
    }, [selectionState?.isCommenting]);

    const handleAddComment = () => {
        if (selectionState) {
            setSelectionState({ ...selectionState, isCommenting: true });
        }
    };

    const handleSaveComment = (content: string) => {
        if (selectionState && filePath) {
            const selector = createSelectorFromRange(containerRef.current!, selectionState.range, filePath);
            if (selector) {
                addComment({
                    target: selector,
                    content: content,
                    author: 'User', // TODO: Get actual user
                });
            }
            setSelectionState(null);
            window.getSelection()?.removeAllRanges();
        }
    };

    const handleCancelComment = () => {
        setSelectionState(null);
        window.getSelection()?.removeAllRanges();
    };


    return (
        <LinkContext.Provider value={contextValue}>
            <div ref={containerRef} className="relative">
                <ReactMarkdown
                    className="prose prose-invert max-w-none font-sans"
                    remarkPlugins={[remarkGfm, remarkDirective, remarkDirectiveRehype, remarkCarousel, remarkGithub]}
                    rehypePlugins={[rehypeHighlight]}
                    components={components}
                    urlTransform={(url) => url}
                >
                    {content}
                </ReactMarkdown>

                {selectionState && !selectionState.isCommenting && (
                    <CommentButton
                        top={selectionState.rect.top + window.scrollY - 40} // Position above selection
                        left={selectionState.rect.left + selectionState.rect.width / 2 - 20} // Center horizontally
                        onClick={handleAddComment}
                        visible={true}
                    />
                )}

                {selectionState && selectionState.isCommenting && (
                    <CommentInput
                        top={selectionState.rect.bottom + window.scrollY + 10} // Position below selection
                        left={selectionState.rect.left /*+ window.scrollX*/}
                        onSave={handleSaveComment}
                        onCancel={handleCancelComment}
                        visible={true}
                    />
                )}
            </div>

            <FileViewerModal
                isOpen={previewModalOpen}
                content={previewContent}
                filePath={previewPath}
                error={previewError}
                onClose={() => setPreviewModalOpen(false)}
            />
        </LinkContext.Provider>
    );
};
