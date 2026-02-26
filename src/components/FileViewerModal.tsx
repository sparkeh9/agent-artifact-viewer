import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { getFileIconUrl } from '../utils/vscode-icons';
import { X, ExternalLink } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

interface FileViewerModalProps {
    isOpen: boolean;
    content: string | null;
    filePath: string | null;
    onClose: () => void;
    error: string | null;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({ isOpen, content, filePath, onClose, error }) => {
    if (!isOpen) return null;

    const filename = filePath?.split('/').pop()?.split('\\').pop() || 'Unknown File';
    const iconUrl = getFileIconUrl(filename);
    const language = filename.split('.').pop() || 'text';

    // Construct markdown content for syntax highlighting
    const markdownContent = content ? `\`\`\`${language}\n${content}\n\`\`\`` : '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8" onClick={onClose}>
            <div
                className="bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#252526]">
                    <div className="flex items-center gap-3">
                        {iconUrl && <img src={iconUrl} className="w-5 h-5" alt="" />}
                        <span className="font-medium text-gray-200">{filename}</span>
                        <span className="text-xs text-gray-500 font-mono">{filePath}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={async () => {
                                if (filePath) {
                                    try {
                                        await invoke('open_file', { path: filePath });
                                        onClose();
                                    } catch (err) {
                                        console.error(err);
                                        alert('Failed to open externally');
                                    }
                                }
                            }}
                            className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                            title="Open in default app"
                        >
                            <ExternalLink size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto custom-scrollbar bg-[#1e1e1e] relative">
                    {error ? (
                        <div className="flex items-center justify-center h-full text-red-400 p-8 text-center">
                            <div>
                                <h3 className="text-lg font-medium mb-2">Error loading file</h3>
                                <p className="text-sm opacity-80">{error}</p>
                            </div>
                        </div>
                    ) : content === null ? (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            <span className="animate-pulse">Loading content...</span>
                        </div>
                    ) : (
                        <div className="p-0 text-sm font-mono leading-relaxed">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeHighlight]}
                                components={{
                                    code({ className, children, ...props }) {
                                        // Override the default code block styling to be full-width and cleaner
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !match ? (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        ) : (
                                            <code className={`${className} !bg-transparent !p-4 block`} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    pre({ children }) {
                                        return <pre className="m-0 p-0 !bg-transparent">{children}</pre>
                                    }
                                }}
                            >
                                {markdownContent}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
