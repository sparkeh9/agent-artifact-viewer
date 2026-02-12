import { create } from 'zustand';
import { Target } from '../utils/selectors';

export interface Comment {
    id: string;
    target: Target;
    content: string;
    author: string;
    timestamp: string;
}

interface CommentState {
    comments: Comment[];
    addComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
    removeComment: (id: string) => void;
    clearComments: () => void;
    getCommentsForFile: (path: string) => Comment[];
}

export const useCommentStore = create<CommentState>((set, get) => ({
    comments: [],
    addComment: (comment) => set((state) => ({
        comments: [...state.comments, {
            ...comment,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString()
        }]
    })),
    removeComment: (id) => set((state) => ({
        comments: state.comments.filter((c) => c.id !== id)
    })),
    clearComments: () => set({ comments: [] }),
    getCommentsForFile: (path) => {
        return get().comments.filter((c) => {
            if (c.target.type === 'file') return c.target.path === path;
            if (c.target.type === 'selection') return c.target.start.path === path;
            return false;
        });
    }
}));
