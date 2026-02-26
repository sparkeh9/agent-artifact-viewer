import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface MermaidProps {
    chart: string;
}

// Initialize mermaid with dark theme
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'monospace',
});

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

    useEffect(() => {
        const renderChart = async () => {
            try {
                const { svg } = await mermaid.render(id, chart);
                setSvgContent(svg);
                setError(null);
            } catch (err) {
                console.error("Mermaid rendering failed:", err);
                setError("Failed to render diagram. Check syntax.");
            }
        };

        if (chart) {
            renderChart();
        }
    }, [chart, id]);

    if (error) {
        return (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 font-mono text-sm">
                {error}
                <pre className="mt-2 text-xs opacity-50 overflow-x-auto">{chart}</pre>
            </div>
        );
    }

    if (!svgContent) {
        return <div className="animate-pulse h-32 bg-white/5 rounded"></div>;
    }

    return (
        <div className="my-6 border border-white/10 rounded-custom overflow-hidden bg-black/40 shadow-lg relative group">
            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit={true}
            >
                {({ zoomIn, zoomOut, resetTransform, centerView }) => (
                    <>
                        <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur rounded p-1 border border-white/10">
                            <button
                                onClick={() => zoomIn()}
                                className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => zoomOut()}
                                className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => { resetTransform(); centerView(); }}
                                className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                                title="Reset View"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>

                        <TransformComponent
                            wrapperClass="w-full h-full min-h-[300px] cursor-grab active:cursor-grabbing"
                            contentClass="w-full h-full flex items-center justify-center p-4"
                        >
                            <div
                                className="mermaid-container w-full h-full flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: svgContent }}
                            />
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
};
