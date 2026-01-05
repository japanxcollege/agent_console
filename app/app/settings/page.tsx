'use client';

import { useState } from 'react';

export default function SettingsPage() {
    // Ideally this would fetch from server actions/Redis.
    // For now, it's a mock UI as requested for "Settings Page" in the plan.
    // We would need to implement `getSettings` and `saveSettings` actions.

    const [settings, setSettings] = useState({
        allowedTools: "Read,Bash(git:*),Bash(npm run test:e2e),Bash(pnpm -v),Bash(node -v)",
        permissionMode: "plan",
        logLimit: 1000,
        scanDepth: 4
    });

    const handleChange = (key: string, value: any) => {
        setSettings({ ...settings, [key]: value });
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Settings saved (Mock)');
        // Implement save logic via Server Action
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 text-white">Settings</h2>
            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Default Allowed Tools</label>
                    <input
                        type="text"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={settings.allowedTools}
                        onChange={e => handleChange('allowedTools', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Default Permission Mode</label>
                    <select
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={settings.permissionMode}
                        onChange={e => handleChange('permissionMode', e.target.value)}
                    >
                        <option value="plan">Plan</option>
                        <option value="acceptEdits">Accept Edits (Fix)</option>
                    </select>
                </div>
                <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                    Save Changes
                </button>
            </form>
        </div>
    );
}
