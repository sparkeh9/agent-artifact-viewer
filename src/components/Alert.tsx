import React from 'react';
import { Info, Lightbulb, AlertTriangle, Flame, Octagon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const ALERT_TYPES = {
    NOTE: { icon: Info, color: 'text-blue-400', border: 'border-blue-400', bg: 'bg-blue-400/5' },
    TIP: { icon: Lightbulb, color: 'text-green-400', border: 'border-green-400', bg: 'bg-green-400/5' },
    WARNING: { icon: AlertTriangle, color: 'text-yellow-400', border: 'border-yellow-400', bg: 'bg-yellow-400/5' },
    IMPORTANT: { icon: Flame, color: 'text-purple-400', border: 'border-purple-400', bg: 'bg-purple-400/5' },
    CAUTION: { icon: Octagon, color: 'text-red-400', border: 'border-red-400', bg: 'bg-red-400/5' },
} as const;

interface AlertProps {
    type: keyof typeof ALERT_TYPES;
    children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ type, children }) => {
    const config = ALERT_TYPES[type] || ALERT_TYPES.NOTE;
    const Icon = config.icon;

    return (
        <div className={cn(
            "border-l-4 glass-panel p-4 rounded-r-custom my-4 transition-all hover:bg-white/[0.05]",
            config.border,
            config.bg
        )}>
            <div className={cn("text-[10px] font-mono font-bold mb-1 flex items-center gap-2", config.color)}>
                <Icon className="w-3 h-3" />
                {type}
            </div>
            <div className="text-sm text-slate-300">
                {children}
            </div>
        </div>
    );
};
