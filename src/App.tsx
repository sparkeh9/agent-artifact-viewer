import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ChevronDown, Zap } from "lucide-react";
import { MarkdownViewer } from "./components/MarkdownViewer";

const DUMMY_MD = `
- Lists and blockquotes

> [!NOTE]
> This is a standard GitHub-style **Note** alert, useful for background context.

---

## 2. Structural Elements

### Tables
| Feature | Supported | Description |
| :--- | :---: | :--- |
| Mermaid | ✅ | High-quality diagrams |
| Alerts | ✅ | Colorful status blocks |
| Carousels | ✅ | Interactive slide shows |

### Mermaid Diagrams
Visualize workflows and architectures directly:

\`\`\`mermaid
graph TD
    A[Start] --> B{Process?}
    B -- Yes --> C[Display Success]
    B -- No --> D[Error Alert]
    C --> E[End]
    D --> E
\`\`\`

---

## 3. GitHub Status Alerts

The viewer renders 5 distinct alert types:

> [!TIP]
> Use tips for helpful suggestions or best practices.

> [!IMPORTANT]
> Use important for essential requirements or critical steps.

> [!WARNING]
> Use warnings to signal potential problems or breaking changes.

> [!CAUTION]
> Use caution for high-risk actions that could cause data loss.

---

## 4. Interactive Carousels

Carousels allow you to cycle through multiple related pieces of content.

:::carousel
\`\`\`python
# Slide 1: Python Code
def hello_world():
    print("Welcome to the Artifact Viewer!")
\`\`\`
<!-- slide -->
\`\`\`javascript
// Slide 2: Javascript Code
console.log("Interactive carousels are powerful!");
\`\`\`
<!-- slide -->
| Slide 3 | Table Content |
| :--- | :--- |
| Item | Definition |
| Carousel | A rotating sequence of slides |
:::

---

## 5. Mermaid Diagrams

Visualize workflows and architectures directly with pan & zoom support:

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D --> B
    C --> E[End]
    
    style A fill:#00ff41,stroke:#000,stroke-width:2px,color:#000
    style B fill:#f2a900,stroke:#000,stroke-width:2px,color:#000
    style D fill:#ff003c,stroke:#000,stroke-width:2px,color:#fff
\`\`\`

---

## 6. Code Diffs & File Links

You can link directly to files and highlight changes using diff blocks:

[App.tsx](file:///d:/code/oss/agent-artifact-viewer/src/App.tsx)
[Cargo.toml](file:///d:/code/oss/agent-artifact-viewer/src-tauri/Cargo.toml)

\`\`\`diff
- Old feature documentation
+ New interactive showcase feature
  Stable base reference
\`\`\`

---

## 7. Embedded Media

While we couldn't generate a custom image this time, you can embed any local media:

![Showcase Placeholder](https://via.placeholder.com/800x400?text=Premium+Design+Showcase)

`;

import { TooltipProvider } from "./components/TooltipContext";

function App() {
    const [content, setContent] = useState(DUMMY_MD);
    const [path] = useState("/artifacts/docs/v2.md");

    useEffect(() => {
        // Initial sync with backend
        invoke("set_artifact_content", { content: DUMMY_MD })
            .catch(console.error);
    }, []);

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
                                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-sm font-medium text-slate-400 transition-all hover:text-white">
                                    Review
                                    <ChevronDown className="w-4 h-4 text-slate-500" />
                                </button>
                                <button className="px-6 py-2 bg-[#0070d2] hover:bg-[#005fb2] rounded-lg text-sm font-bold text-white shadow-[0_4px_20px_rgba(0,112,210,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98]">
                                    Proceed
                                </button>
                            </div>
                        </header>

                        <section className="glass-panel rounded-custom flex-1 overflow-y-auto custom-scrollbar p-8">
                            <div className="max-w-4xl mx-auto">
                                <MarkdownViewer content={content} />
                            </div>
                        </section>
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
