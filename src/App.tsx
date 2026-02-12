import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown, Zap, MessageSquare } from "lucide-react";
import { MarkdownViewer } from "./components/MarkdownViewer";
import { CommentSidebar } from "./components/CommentSidebar";

const DUMMY_MD = `# Demo Artifact

This is a demo file to test the comment system.

## Features
- Selection
- Comments
- Persistence
`;

import { TooltipProvider } from "./components/TooltipContext";

import { useCommentStore } from "./store/commentStore";

function App() {
    const [content, setContent] = useState(DUMMY_MD);
    const [path] = useState("d:\\code\\oss\\agent-artifact-viewer\\demo.md");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { loadComments } = useCommentStore();

    useEffect(() => {
        loadComments(path);
    }, [path, loadComments]);

    return (
        <TooltipProvider>
            <div className="w-full h-screen flex flex-col overflow-hidden relative">
                {/* Background Elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#0a0a0c]">
                    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-brand-cyan/10 blur-[120px]" />
                    <div className="absolute top-[40%] -right-[5%] w-[35%] h-[35%] rounded-full bg-purple-500/10 blur-[100px]" />
                    <div className="absolute -bottom-[5%] left-[20%] w-[30%] h-[30%] rounded-full bg-blue-500/10 blur-[100px]" />
                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
                </div>

                {/* App Content Area */}
                <div className="flex flex-1 overflow-hidden p-6 gap-6 relative">
                    <main className="flex-1 flex flex-col gap-4 relative">
                        <header className="glass-panel rounded-custom px-6 py-3 flex items-center justify-between neon-glow">
                            <div className="flex items-center gap-4">
                                <Zap className="w-5 h-5 text-brand-cyan animate-pulse" />
                                <span className="text-slate-400 text-sm font-mono tracking-wider">path: {path}</span>
                                <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                    LIVE
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm font-medium text-slate-400 transition-all hover:text-white"
                                >
                                    <MessageSquare size={16} />
                                    Comments
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm font-medium text-slate-400 transition-all hover:text-white">
                                    Review
                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                </button>
                                <button className="px-6 py-2 bg-[#0070d2] hover:bg-[#005fb2] rounded-lg text-sm font-bold text-white shadow-[0_4px_20px_rgba(0,112,210,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                                    Proceed
                                </button>
                            </div>
                        </header>

                        <div className="flex flex-1 overflow-hidden gap-6">
                            <section className="glass-panel rounded-custom flex-1 overflow-y-auto custom-scrollbar p-8">
                                <div className="max-w-4xl mx-auto">
                                    <MarkdownViewer content={content} filePath={path} />
                                </div>
                            </section>

                            <CommentSidebar
                                filePath={path}
                                visible={sidebarOpen}
                                onClose={() => setSidebarOpen(false)}
                            />
                        </div>
                    </main>
                </div>

                {/* Status Bar */}
                <footer className="px-6 py-2 bg-black/40 border-t border-white/5 text-[10px] font-mono text-slate-500 flex justify-between items-center backdrop-blur-md">
                    <div className="flex gap-4">
                        <span>STATUS: INITIALIZED</span>
                        <span>CORE: v2.0.0-RUST</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-brand-cyan/50 hover:text-brand-cyan cursor-help transition-colors">HELP</span>
                        <span className="text-slate-600">AGENT SECURE CONNECTION: ACTIVE</span>
                    </div>
                </footer>
            </div>
        </TooltipProvider>
    );
}

export default App;
