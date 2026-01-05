'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createJob, getRepos } from '../actions';

export default function NewJobPage() {
    const router = useRouter();
    const [repos, setRepos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        repoPath: '',
        prompt: '',
        mode: 'plan' as 'plan' | 'fix' | 'diagnose'
    });

    useEffect(() => {
        getRepos().then(setRepos);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const id = await createJob(formData.repoPath, formData.prompt, formData.mode);
            router.push(`/jobs/${id}`);
        } catch (error) {
            console.error(error);
            alert('Failed to create job');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 text-white">Start New Job</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Target Repository</label>
                    <div className="relative">
                        <input
                            list="repos-list"
                            required
                            type="text"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                            placeholder="/Users/username/projects/my-app"
                            value={formData.repoPath}
                            onChange={e => setFormData({ ...formData, repoPath: e.target.value })}
                        />
                        <datalist id="repos-list">
                            {repos.map(repo => <option key={repo} value={repo} />)}
                        </datalist>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Enter the absolute path to the local repository.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Mode</label>
                        <select
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.mode}
                            onChange={e => setFormData({ ...formData, mode: e.target.value as any })}
                        >
                            <option value="plan">Plan (Read-Only)</option>
                            <option value="fix">Fix (Write Access)</option>
                            <option value="diagnose">Diagnose (Read + Run Tests)</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Prompt</label>
                    <textarea
                        required
                        rows={6}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-slate-600 font-mono text-sm leading-relaxed"
                        placeholder="Describe what you want Claude to do..."
                        value={formData.prompt}
                        onChange={e => setFormData({ ...formData, prompt: e.target.value })}
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-medium py-3 rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Starting...
                            </>
                        ) : 'Run Job'}
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-4">
                        This command will run locally on your Mac.
                    </p>
                </div>
            </form>
        </div>
    );
}
