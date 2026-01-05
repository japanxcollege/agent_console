'use client';

import { useState, useEffect } from 'react';
import { getBrainIndex, getBrainFileContent } from '../actions';

// Note: ReactMarkdown needs to be installed, or we just render text. 
// I'll skip installing extra deps for now and just render pre.
// If I want markdown rendering, I should add 'react-markdown'.

export default function BrainPage() {
    const [index, setIndex] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBrainIndex().then(data => {
            setIndex(data);
            setLoading(false);
        });
    }, []);

    const handleSelect = async (file: string) => {
        if (selectedFile === file) return;
        setSelectedFile(file);
        setContent('Loading...');
        const text = await getBrainFileContent(file);
        setContent(text);
    };

    return (
        <div className="flex bg-slate-900 border border-slate-700 rounded-lg overflow-hidden h-[calc(100vh-140px)]">
            <div className="w-1/3 border-r border-slate-700 p-4 overflow-y-auto">
                <h3 className="font-semibold text-slate-300 mb-4 px-2">Brain Artifacts</h3>
                <div className="space-y-1">
                    {index.map((item: any) => (
                        <button
                            key={item.path}
                            onClick={() => handleSelect(item.path)}
                            className={`w-full text-left px-3 py-2 rounded text-sm transition-colors truncate
                                ${selectedFile === item.path ? 'bg-indigo-600/20 text-indigo-400' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                            {/* Strip UUID prefix from folder names for display if needed, but path is safer */}
                            {item.path}
                        </button>
                    ))}
                    {index.length === 0 && !loading && (
                        <div className="text-slate-500 text-sm px-2">No artifacts found.</div>
                    )}
                </div>
            </div>
            <div className="flex-1 bg-slate-950 overflow-y-auto p-6">
                {selectedFile ? (
                    <div>
                        <div className="text-xs text-slate-500 mb-4 font-mono">{selectedFile}</div>
                        <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                            {content}
                        </pre>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-600">
                        Select a file to view content
                    </div>
                )}
            </div>
        </div>
    );
}
