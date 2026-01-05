'use client';

import { useState, useEffect, useRef } from 'react';
import { getJobDetails, getJobLogs, stopJob, sendJobInput } from '../../actions';
import { useParams } from 'next/navigation';
import { LogViewer } from '../../components/LogViewer';

export default function JobPage() {
    const params = useParams();
    const id = params.id as string;

    const [job, setJob] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const logEndRef = useRef<HTMLDivElement>(null);

    const handleSendInput = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;
        await sendJobInput(id, input.trim());
        setInput('');
    };

    const handleInterruptAndSend = async () => {
        if (!input.trim()) return;
        await sendJobInput(id, '!!INTERRUPT!!' + input.trim());
        setInput('');
    };

    const fetchData = async () => {
        const [meta, newLogs] = await Promise.all([
            getJobDetails(id),
            getJobLogs(id)
        ]);
        setJob(meta);
        setLogs(newLogs);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs.length]);

    if (loading && !job) {
        return <div className="text-center py-20 text-slate-500">Loading job details...</div>;
    }

    if (!job) {
        return <div className="text-center py-20 text-red-500">Job not found</div>;
    }

    const [showInterrupt, setShowInterrupt] = useState(false);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            <div className="bg-slate-900/50 border border-white/5 rounded-xl p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider
                                ${job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                    job.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                                        job.status === 'running' ? 'bg-sky-500/10 text-sky-400 animate-pulse' :
                                            'bg-slate-700 text-slate-400'}`}>
                                {job.status}
                            </span>
                            <span className="text-slate-500 text-sm font-mono">{id.slice(0, 8)}</span>
                        </div>
                        <h1 className="text-lg font-mono text-white mb-1">{job.repoPath}</h1>
                    </div>
                    {job.status === 'running' && (
                        <button
                            onClick={() => stopJob(id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                        >
                            Stop
                        </button>
                    )}
                </div>
                <div className="text-slate-400 text-sm bg-black/20 p-3 rounded-lg font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                    {job.prompt}
                </div>
            </div>

            <div className="flex-1 bg-black rounded-xl border border-white/10 overflow-hidden flex flex-col font-mono text-sm relative">
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
                            <p>Waiting for logs...</p>
                        </div>
                    ) : (
                        <>
                            <LogViewer logs={logs} />
                            <div ref={logEndRef} />
                        </>
                    )}
                </div>
                {job.status === 'running' && (
                    <div className="absolute bottom-20 right-4 text-xs bg-indigo-500 text-white px-2 py-1 rounded animate-pulse shadow-lg shadow-indigo-500/20">
                        Live
                    </div>
                )}
                {job.status === 'running' && (
                    <div className="p-4 bg-slate-900/50 border-t border-white/5">
                        <form onSubmit={handleSendInput} className="flex gap-2 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Send message to Claude..."
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />

                            <div className="flex items-center bg-indigo-600 rounded-lg overflow-hidden">
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 font-medium transition-colors flex items-center gap-2"
                                >
                                    Send
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowInterrupt(!showInterrupt)}
                                    className="h-full px-2 hover:bg-indigo-700 transition-colors border-l border-indigo-700 text-white"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${showInterrupt ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </button>
                            </div>

                            {showInterrupt && (
                                <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-20">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleInterruptAndSend();
                                            setShowInterrupt(false);
                                        }}
                                        disabled={!input.trim()}
                                        className="w-full text-left px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 text-sm font-medium"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                                        Interrupt & Send
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
