import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FileTooltip } from './FileTooltip';
import { isTauri } from '../utils/isTauri';

interface TooltipContextType {
    openTooltip: (path: string, rect: DOMRect) => void;
    closeTooltip: (immediate?: boolean) => void;
    cancelClose: () => void;
}

const TooltipContext = createContext<TooltipContextType>({
    openTooltip: () => { },
    closeTooltip: () => { },
    cancelClose: () => { },
});

export const useTooltip = () => useContext(TooltipContext);

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const [tooltipContent, setTooltipContent] = useState<string | null>(null);
    const [tooltipPath, setTooltipPath] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number, y: number } | null>(null);
    const [tooltipError, setTooltipError] = useState<string | null>(null);

    // Use a ref to track active tooltip to avoid re-creating the openTooltip function on every state change
    const activeTooltipRef = useRef<{ path: string | null, content: string | null }>({ path: null, content: null });
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const openTooltip = useCallback(async (path: string, rect: DOMRect) => {
        // Clear any pending close timer when opening/re-opening
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        setTooltipPath(path);
        setTooltipPosition({
            x: rect.left + (rect.width / 2),
            y: rect.bottom
        });
        setTooltipOpen(true);
        setTooltipError(null);

        // Check against Ref to avoid dependency on state
        if (activeTooltipRef.current.path !== path || !activeTooltipRef.current.content) {
            // Only clear content if path changed
            if (activeTooltipRef.current.path !== path) setTooltipContent(null);

            try {
                // Update ref immediately to prevent double fetches 
                activeTooltipRef.current = { path, content: null };

                if (!isTauri()) {
                    // Mock content for browser or just show a message
                    // But since FileTooltip handles error, we can throw or just set content
                    // Throwing makes it red error message which is what user reported as "error"
                    // Let's set a friendly message as content or error.
                    throw new Error("Preview unavailable in browser environment");
                }

                const content = await invoke<string>('read_file', { path });

                // Only update state if this is still the active path
                if (activeTooltipRef.current.path === path) {
                    activeTooltipRef.current.content = content;
                    setTooltipContent(content);
                }
            } catch (err) {
                // If checking isTauri inside try block, it will be caught here.
                // console.error('Failed to read file:', err); 
                // Don't log error for browser fallback to keep console clean
                if (isTauri()) {
                    console.error('Failed to read file:', err);
                }
                setTooltipError(err instanceof Error ? err.message : String(err));
            }
        } else {
            // Restore from ref if available (e.g. re-hovering same file)
            setTooltipContent(activeTooltipRef.current.content);
        }
    }, []);

    const closeTooltip = useCallback((immediate = true) => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        if (immediate) {
            setTooltipOpen(false);
        } else {
            // Grace period to allow moving to tooltip
            closeTimerRef.current = setTimeout(() => {
                setTooltipOpen(false);
            }, 300);
        }
    }, []);

    const cancelClose = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    const value = useMemo(() => ({
        openTooltip,
        closeTooltip,
        cancelClose
    }), [openTooltip, closeTooltip, cancelClose]);

    return (
        <TooltipContext.Provider value={value}>
            {children}
            <FileTooltip
                isOpen={tooltipOpen}
                content={tooltipContent}
                filePath={tooltipPath}
                position={tooltipPosition}
                error={tooltipError}
                onMouseEnter={cancelClose}
                onMouseLeave={() => closeTooltip(false)}
            />
        </TooltipContext.Provider>
    );
};
