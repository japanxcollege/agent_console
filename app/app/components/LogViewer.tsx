import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, Terminal, User, Bot, CheckCircle, AlertCircle, Cpu } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface LogEntryProps {
    log: any;
}

export function LogViewer({ logs }: { logs: any[] }) {
    return (
        <div className="space-y-2 p-2">
            {logs.map((log, i) => (
                <LogEntry key={i} log={log} />
            ))}
        </div>
    );
}

function LogEntry({ log }: LogEntryProps) {
    const [expanded, setExpanded] = useState(false);

    // Handle raw text/message logs
    if (typeof log.content === 'string') {
        return (
            <div className={cn("font-mono text-sm break-words", log.type === 'error' ? "text-red-400" : "text-slate-300")}>
                {log.content}
            </div>
        );
    }

    // Handle structured content (Claude Code internal events)
    const content = log.content;
    if (!content || typeof content !== 'object') {
        return <div className="text-slate-500 font-mono text-xs opacity-50">{JSON.stringify(log)}</div>;
    }

    // 1. Result (Final Answer)
    if (content.type === 'result') {
        return (
            <div className="my-4 rounded-lg bg-emerald-950/30 border border-emerald-500/30 p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold">
                    <CheckCircle className="w-5 h-5" />
                    <span>Task Completed</span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content.result}
                    </ReactMarkdown>
                </div>
            </div>
        );
    }

    // 2. Assistant Message (Tool Use or Text)
    if (content.type === 'assistant' && content.message?.content) {
        return (
            <div className="space-y-2">
                {content.message.content.map((block: any, i: number) => {
                    if (block.type === 'text') {
                        return (
                            <div key={i} className="text-slate-300 whitespace-pre-wrap font-sans text-sm pl-8 border-l-2 border-slate-700 ml-1 py-1">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.text}</ReactMarkdown>
                            </div>
                        );
                    }
                    if (block.type === 'tool_use') {
                        return (
                            <div key={i} className="rounded-md bg-slate-900 border border-slate-800 overflow-hidden">
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="w-full flex items-center gap-2 p-2 px-3 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
                                >
                                    {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                    <Cpu className="w-4 h-4 text-amber-500" />
                                    <span className="text-amber-400 font-mono text-sm font-semibold">{block.name}</span>
                                    <span className="text-slate-500 text-xs font-mono truncate max-w-md">
                                        {JSON.stringify(block.input)}
                                    </span>
                                </button>
                                {expanded && (
                                    <div className="p-3 bg-black/50 font-mono text-xs text-slate-400 whitespace-pre-wrap overflow-x-auto">
                                        {JSON.stringify(block.input, null, 2)}
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        );
    }

    // 3. User Message (Tool Result)
    if (content.type === 'user' && content.message?.content) {
        return (
            <div className="space-y-1">
                {content.message.content.map((block: any, i: number) => {
                    if (block.type === 'tool_result') {
                        const isError = block.is_error;
                        const output = block.content;
                        const isLong = output?.length > 200;

                        return (
                            <div key={i} className={cn("rounded-md border text-sm overflow-hidden", isError ? "bg-red-950/10 border-red-900/50" : "bg-slate-950/30 border-slate-800")}>
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="w-full flex items-center gap-2 p-1.5 px-3 hover:bg-white/5 transition-colors text-left"
                                >
                                    {expanded ? <ChevronDown className="w-3 h-3 text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-500" />}
                                    <Terminal className={cn("w-3 h-3", isError ? "text-red-500" : "text-slate-500")} />
                                    <span className={cn("font-mono text-xs", isError ? "text-red-400" : "text-slate-500")}>
                                        Tool Output {isError && "(Error)"}
                                    </span>
                                </button>
                                {expanded && (
                                    <div className="p-2 px-3 border-t border-white/5 font-mono text-xs whitespace-pre-wrap overflow-x-auto text-slate-400 max-h-96 overflow-y-auto custom-scrollbar">
                                        {output}
                                    </div>
                                )}
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        );
    }

    // 4. System / Other
    if (content.type === 'system') {
        // Hide spammy system events mostly, or show very subtle
        if (content.subtype === 'init') return null; // Hide init
        return (
            <div className="text-[10px] text-slate-700 font-mono pl-2 border-l-2 border-slate-800">
                System: {content.subtype || content.type}
            </div>
        );
    }

    // Fallback for unknown object logs
    return (
        <div className="text-slate-600 font-mono text-xs opacity-50 overflow-hidden">
            {JSON.stringify(log)}
        </div>
    );
}
