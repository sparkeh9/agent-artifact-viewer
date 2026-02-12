import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { getFileIconUrl } from '../utils/vscode-icons';

interface FileTooltipProps {
    isOpen: boolean;
    content: string | null;
    filePath: string | null;
    position: { x: number; y: number } | null;
    error: string | null;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export const FileTooltip: React.FC<FileTooltipProps> = ({
    isOpen, content, filePath, position, error,
    onMouseEnter, onMouseLeave
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) setMounted(true);
        else {
            const timer = setTimeout(() => setMounted(false), 200); // Wait for fade out
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted && !isOpen) return null;

    const filename = filePath?.split('/').pop()?.split('\\').pop() || 'Unknown File';
    const iconUrl = getFileIconUrl(filename);
    const language = filename.split('.').pop() || 'text';

    // Construct markdown content for syntax highlighting
    // Increased limit for scrolling
    const previewContent = content
        ? `\`\`\`${language}\n${content.split('\n').slice(0, 300).join('\n')}${content.split('\n').length > 300 ? '\n...' : ''}\n\`\`\``
        : '';

    // Calculate position
    const style: React.CSSProperties = {
        top: (position?.y || 0) + 10, // Closer to cursor
        left: (position?.x || 0),
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
    };

    return (
        <div
            className="fixed z-[100] transition-all duration-200 ease-out"
            style={style}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl w-[600px] max-w-[90vw] max-h-[500px] flex flex-col backdrop-blur-md">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#252526] flex-shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        {iconUrl && <img src={iconUrl} className="w-4 h-4 flex-shrink-0" alt="" />}
                        <span className="font-medium text-gray-200 text-sm whitespace-nowrap">{filename}</span>
                        <span className="text-[10px] text-gray-500 font-mono truncate max-w-[400px]">{filePath}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1e1e1e] relative p-0 min-h-[100px]">
                    {error ? (
                        <div className="flex items-center justify-center p-4 text-red-400 text-center">
                            <span className="text-xs">{error}</span>
                        </div>
                    ) : content === null ? (
                        <div className="flex items-center justify-center p-8 text-gray-400">
                            <span className="animate-pulse text-xs">Loading preview...</span>
                        </div>
                    ) : (
                        <div className="text-xs font-mono leading-tight">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                    code({ className, children, ...props }) {
                                        return (
                                            <code className={`${className} !bg-transparent !p-3 block whitespace-pre`} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    pre({ children }) {
                                        return <pre className="m-0 p-0 !bg-transparent overflow-hidden">{children}</pre>
                                    }
                                }}
                            >
                                {previewContent}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {content && (
                    <div className="px-3 py-1 bg-[#252526] border-t border-white/10 text-[10px] text-gray-500 text-right flex-shrink-0">
                        Scroll to view more • Click link to open in default editor
                    </div>
                )}
            </div>
        </div>
    );
};
