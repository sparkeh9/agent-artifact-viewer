import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCommentStore } from './commentStore';

describe('useCommentStore', () => {
    beforeEach(() => {
        const { result } = renderHook(() => useCommentStore());
        act(() => {
            result.current.clearComments();
        });
    });

    it('should start with empty comments', () => {
        const { result } = renderHook(() => useCommentStore());
        expect(result.current.comments).toEqual([]);
    });

    it('should add a comment', () => {
        const { result } = renderHook(() => useCommentStore());

        act(() => {
            result.current.addComment({
                target: { type: 'global' },
                content: 'Test Comment',
                author: 'TestUser'
            });
        });

        expect(result.current.comments).toHaveLength(1);
        expect(result.current.comments[0].content).toBe('Test Comment');
        expect(result.current.comments[0].id).toBeDefined();
        expect(result.current.comments[0].timestamp).toBeDefined();
    });

    it('should remove a comment', () => {
        const { result } = renderHook(() => useCommentStore());
        let commentId = '';

        act(() => {
            result.current.addComment({
                target: { type: 'file', path: 'test.ts' },
                content: 'To Delete',
                author: 'TestUser'
            });
        });

        commentId = result.current.comments[0].id;

        act(() => {
            result.current.removeComment(commentId);
        });

        expect(result.current.comments).toHaveLength(0);
    });

    it('should get comments for a specific file', () => {
        const { result } = renderHook(() => useCommentStore());

        act(() => {
            result.current.addComment({ target: { type: 'file', path: 'a.ts' }, content: 'A', author: 'U' });
            result.current.addComment({ target: { type: 'file', path: 'b.ts' }, content: 'B', author: 'U' });
            result.current.addComment({ target: { type: 'global' }, content: 'G', author: 'U' });
        });

        const commentsA = result.current.getCommentsForFile('a.ts');
        expect(commentsA).toHaveLength(1);
        expect(commentsA[0].content).toBe('A');

        const commentsB = result.current.getCommentsForFile('b.ts');
        expect(commentsB).toHaveLength(1);
        expect(commentsB[0].content).toBe('B');
    });
});
