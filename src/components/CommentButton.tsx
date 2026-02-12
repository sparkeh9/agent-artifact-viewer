import React from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { cn } from '../utils/cn';

interface CommentButtonProps {
    top: number;
    left: number;
    onClick: () => void;
    visible: boolean;
}

export const CommentButton: React.FC<CommentButtonProps> = ({ top, left, onClick, visible }) => {
    if (!visible) return null;

    return (
        <button
            className={cn(
                "absolute z-50 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-transform active:scale-95",
                "animate-in fade-in zoom-in duration-200"
            )}
            style={{ top, left }}
            onClick={(e) => {
                e.stopPropagation(); // Prevent clearing selection
                onClick();
            }}
            aria-label="Add Comment"
        >
            <MessageSquarePlus size={20} />
        </button>
    );
};
