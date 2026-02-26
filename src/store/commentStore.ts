import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
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
    addComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => Promise<void>;
    removeComment: (id: string) => Promise<void>;
    clearComments: () => void;
    getCommentsForFile: (path: string) => Comment[];
    loadComments: (path: string) => Promise<void>;
}

const getFilePathFromTarget = (target: Target): string | undefined => {
    if (target.type === 'file') return target.path;
    if (target.type === 'selection') return target.start.path;
    return undefined;
};

export const useCommentStore = create<CommentState>((set, get) => ({
    comments: [],
    addComment: async (commentData) => {
        const id = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        const newComment: Comment = { ...commentData, id, timestamp };

        // Optimistic Update
        set((state) => ({
            comments: [...state.comments, newComment]
        }));

        const filePath = getFilePathFromTarget(commentData.target);
        if (filePath) {
            try {
                await invoke('save_comment', { filePath, comment: newComment });
            } catch (error) {
                console.error('Failed to save comment:', error);
                // Revert optimistic update
                set((state) => ({
                    comments: state.comments.filter((c) => c.id !== id)
                }));
            }
        }
    },
    removeComment: async (id) => {
        const comment = get().comments.find((c) => c.id === id);
        if (!comment) return;

        // Optimistic Update
        set((state) => ({
            comments: state.comments.filter((c) => c.id !== id)
        }));

        const filePath = getFilePathFromTarget(comment.target);
        if (filePath) {
            try {
                await invoke('delete_comment', { filePath, commentId: id });
            } catch (error) {
                console.error('Failed to delete comment:', error);
                // Revert optimistic update
                set((state) => ({
                    comments: [...state.comments, comment]
                }));
            }
        }
    },
    clearComments: () => set({ comments: [] }),
    getCommentsForFile: (path) => {
        return get().comments.filter((c) => {
            if (c.target.type === 'file') return c.target.path === path;
            if (c.target.type === 'selection') return c.target.start.path === path;
            return false;
        });
    },
    loadComments: async (path) => {
        try {
            const comments = await invoke<Comment[]>('load_comments', { filePath: path });
            set({ comments }); // Replace comments for current file
        } catch (error) {
            console.error('Failed to load comments:', error);
            set({ comments: [] });
        }
    }
}));
