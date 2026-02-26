import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../utils/cn';

interface CommentInputProps {
    top: number;
    left: number;
    onSave: (content: string) => void;
    onCancel: () => void;
    initialContent?: string;
    visible: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({ top, left, onSave, onCancel, initialContent = '', visible }) => {
    const [content, setContent] = useState(initialContent);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (visible && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [visible]);

    if (!visible) return null;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSave(content);
        }
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div
            className={cn(
                "absolute z-50 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl p-4 flex flex-col gap-2",
                "animate-in fade-in zoom-in duration-200"
            )}
            style={{ top, left }}
            onClick={(e) => e.stopPropagation()}
        >
            <textarea
                ref={textareaRef}
                className="w-full bg-slate-800 text-slate-200 p-2 rounded border border-slate-700 focus:border-brand-cyan focus:outline-none resize-none text-sm"
                rows={3}
                placeholder="Add a comment..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <div className="flex justify-end gap-2">
                <button
                    className="px-3 py-1 text-xs text-slate-400 hover:text-white transition-colors"
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button
                    className="px-3 py-1 text-xs bg-brand-cyan text-black font-bold rounded hover:bg-cyan-400 transition-colors"
                    onClick={() => onSave(content)}
                    disabled={!content.trim()}
                >
                    Save
                </button>
            </div>
        </div>
    );
};
