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

    const handleSendInput = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        await sendJobInput(id, input.trim());
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
                    <LogViewer logs={logs} />
                    <div ref={logEndRef} />
                </div>
                {job.status === 'running' && (
                    <div className="absolute bottom-20 right-4 text-xs bg-indigo-500 text-white px-2 py-1 rounded animate-pulse shadow-lg shadow-indigo-500/20">
                        Live
                    </div>
                )}
                {job.status === 'running' && (
                    <div className="p-4 bg-slate-900/50 border-t border-white/5">
                        <form onSubmit={handleSendInput} className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Send message to Claude..."
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                Send
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
