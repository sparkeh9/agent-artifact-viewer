import { describe, it, expect } from 'vitest';
import { calculateLineColumn, getOffsetInElement, createSelectorFromSelection } from './selectors';

describe('createSelectorFromSelection', () => {
    it('should create valid Target from cross-element selection', () => {
        const root = document.createElement('div');
        // "line1\nline2" (length 11)
        // <span>line1\n</span> <span>line2</span>
        // Text node 1: "line1\n" (length 6)
        // Text node 2: "line2" (length 5)
        root.innerHTML = '<span>line1\n</span><span>line2</span>';

        // Mock Selection
        const selection = {
            rangeCount: 1,
            getRangeAt: () => ({
                startContainer: root.children[0].firstChild!,
                startOffset: 0, // Start of "line1"
                endContainer: root.children[1].firstChild!,
                endOffset: 5,   // End of "line2"
                commonAncestorContainer: root
            })
        } as unknown as Selection;

        const target = createSelectorFromSelection(root, selection, 'test.ts');

        expect(target).toEqual({
            type: 'selection',
            start: { path: 'test.ts', line: 1, column: 1, offset: 0 },
            end: { path: 'test.ts', line: 2, column: 6, offset: 11 }, // "line2" is 5 chars. new line is 1. total 6 + 5 = 11.
            // Wait. "line1\n" is line 1.
            // "line2" starts at line 2, col 1.
            // endOffset 5 means after 5 chars of "line2".
            // So line 2, col 6.
            textQuote: 'line1\nline2'
        });
    });
});

describe('getOffsetInElement', () => {
    it('should return correct offset in simple text', () => {
        const div = document.createElement('div');
        div.textContent = 'hello world';
        const textNode = div.firstChild!;
        expect(getOffsetInElement(div, textNode, 6)).toBe(6);
    });

    it('should handle nested elements', () => {
        const div = document.createElement('div');
        div.innerHTML = '<span>hello</span> <span>world</span>';
        // content: "hello world" (length 11)
        // 'w' is at index 6.
        const span2 = div.children[1];
        const textNode = span2.firstChild!;
        expect(getOffsetInElement(div, textNode, 0)).toBe(6);
    });

    it('should return -1 if node not found', () => {
        const div = document.createElement('div');
        const p = document.createElement('p');
        expect(getOffsetInElement(div, p, 0)).toBe(-1);
    });
});

describe('calculateLineColumn', () => {
    it('should return 1,1 for empty string', () => {
        expect(calculateLineColumn('', 0)).toEqual({ line: 1, column: 1 });
    });

    it('should return 1,1 for start of string', () => {
        expect(calculateLineColumn('hello', 0)).toEqual({ line: 1, column: 1 });
    });

    it('should return 1,4 for offset 3', () => {
        expect(calculateLineColumn('hello', 3)).toEqual({ line: 1, column: 4 });
    });

    it('should handle newlines (LF)', () => {
        const text = "hello\nworld";
        // 'w' is at index 6 (hello + \n + w)
        expect(calculateLineColumn(text, 6)).toEqual({ line: 2, column: 1 });
    });

    it('should handle newlines (CRLF)', () => {
        const text = "hello\r\nworld";
        // 'w' is at index 7 (hello + \r\n + w)
        expect(calculateLineColumn(text, 7)).toEqual({ line: 2, column: 1 });
    });

    it('should handle offset out of bounds (clamped to end)', () => {
        expect(calculateLineColumn('abc', 10)).toEqual({ line: 1, column: 4 });
    });

    it('should handle multiple lines', () => {
        const text = "line1\nline2\nline3";
        // Start of line 3
        const offset = text.indexOf('line3');
        expect(calculateLineColumn(text, offset)).toEqual({ line: 3, column: 1 });
    });
});
