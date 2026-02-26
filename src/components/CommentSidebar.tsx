import React from 'react';
import { X, Trash2, MessageSquare } from 'lucide-react';
import { useCommentStore } from '../store/commentStore';
import { cn } from '../utils/cn';

interface CommentSidebarProps {
    filePath: string;
    onClose: () => void;
    visible: boolean;
}

export const CommentSidebar: React.FC<CommentSidebarProps> = ({ filePath, onClose, visible }) => {
    const { getCommentsForFile, removeComment } = useCommentStore();
    const comments = getCommentsForFile(filePath);

    if (!visible) return null;

    return (
        <div className="w-80 h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <MessageSquare size={16} className="text-brand-cyan" />
                    Comments
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-400">
                        {comments.length}
                    </span>
                </h2>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {comments.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm py-8">
                        No comments yet. <br /> Select text to add one.
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 group hover:border-brand-cyan/30 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-brand-cyan">
                                    {comment.author}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                    {new Date(comment.timestamp).toLocaleTimeString()}
                                </span>
                            </div>

                            {comment.target.type === 'selection' && comment.target.textQuote && (
                                <div className="mb-2 p-2 bg-black/20 rounded border-l-2 border-slate-600 text-xs text-slate-400 italic font-mono truncate">
                                    "{comment.target.textQuote}"
                                </div>
                            )}

                            <p className="text-sm text-slate-300 whitespace-pre-wrap">
                                {comment.content}
                            </p>

                            <div className="mt-3 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => removeComment(comment.id)}
                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                    title="Delete comment"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
