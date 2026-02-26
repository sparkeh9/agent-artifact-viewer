export interface Anchor {
    path: string;
    blockIndex?: number;
    offset?: number;
    line?: number;
    column?: number;
    context?: string;
}

export type Target =
    | { type: 'global' }
    | { type: 'file'; path: string }
    | { type: 'block'; blockId: string }
    | { type: 'selection'; start: Anchor; end: Anchor; textQuote: string };

/**
 * Calculates the line and column number (1-indexed) for a given character offset in a text.
 * @param text The full text content
 * @param offset The character offset (0-indexed)
 */
export function calculateLineColumn(text: string, offset: number): { line: number; column: number } {
    const safeOffset = Math.max(0, Math.min(offset, text.length));
    let line = 1;
    let lastNewLineIndex = -1;

    for (let i = 0; i < safeOffset; i++) {
        if (text[i] === '\n') {
            line++;
            lastNewLineIndex = i;
        } else if (text[i] === '\r') {
            // Handle CRLF
            if (i + 1 < text.length && text[i + 1] === '\n') {
                continue; // Skip \r of \r\n
            }
            // Handle CR (old Mac)
            line++;
            lastNewLineIndex = i;
        }
    }

    // Column is 1-indexed, so offset - lastNewLineIndex
    const column = safeOffset - lastNewLineIndex;

    return { line, column };
}

/**
 * Calculates the absolute text offset of a (node, offset) pair within a root element.
 * Useful for mapping DOM Range Selection to source text offset.
 */
export function getOffsetInElement(root: Node, targetNode: Node, targetOffset: number): number {
    let offset = 0;

    function traverse(node: Node): boolean {
        if (node === targetNode) {
            if (node.nodeType === Node.TEXT_NODE) {
                offset += targetOffset;
            } else {
                // Element: add length of preceding children
                const children = node.childNodes;
                for (let i = 0; i < targetOffset && i < children.length; i++) {
                    offset += (children[i].textContent || '').length;
                }
            }
            return true;
        }

        if (node.nodeType === Node.TEXT_NODE) {
            offset += (node.textContent || '').length;
        } else {
            for (let i = 0; i < node.childNodes.length; i++) {
                if (traverse(node.childNodes[i])) {
                    return true;
                }
            }
        }
        return false;
    }

    if (traverse(root)) return offset;
    return -1;
}

/**
 * Creates a Target from a DOM Range and root element.
 * This is preferred over Selection as it handles cases where selection is lost (e.g. clicking Save).
 */
export function createSelectorFromRange(root: HTMLElement, range: Range, path: string): Target | null {
    // Ensure range is within root (or involves root)
    if (!root.contains(range.commonAncestorContainer) && range.commonAncestorContainer !== root) return null;

    const startOffset = getOffsetInElement(root, range.startContainer, range.startOffset);
    const endOffset = getOffsetInElement(root, range.endContainer, range.endOffset);

    if (startOffset === -1 || endOffset === -1) return null;

    const fullText = root.textContent || '';
    const start = calculateLineColumn(fullText, startOffset);
    const end = calculateLineColumn(fullText, endOffset);
    const textQuote = fullText.slice(startOffset, endOffset);

    return {
        type: 'selection',
        start: { path, ...start, offset: startOffset },
        end: { path, ...end, offset: endOffset },
        textQuote
    };
}

/**
 * Creates a Target from a DOM Selection and root element.
 */
export function createSelectorFromSelection(root: HTMLElement, selection: Selection, path: string): Target | null {
    if (selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    return createSelectorFromRange(root, range, path);
}
