import { glob } from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import { redis, KEYS } from './redis.js';

export async function scanRepos() {
    const allowedRootsStr = process.env.ALLOWED_ROOTS || '';
    const allowedRoots = allowedRootsStr.split(',').map(r => r.trim()).filter(Boolean);

    if (allowedRoots.length === 0) {
        console.warn('No ALLOWED_ROOTS configured.');
        return;
    }

    console.log(`Scanning for repositories in: ${allowedRoots.join(', ')}...`);
    const repos: string[] = [];

    for (const root of allowedRoots) {
        if (!fs.existsSync(root)) {
            console.warn(`Root path does not exist: ${root}`);
            continue;
        }

        // Search for .git directories to identify repos
        // Limit depth to avoid deep scans
        try {
            const gitDirs = await glob('**/.git', {
                cwd: root,
                maxDepth: 4,
                ignore: ['**/node_modules/**', '**/dist/**']
            });

            for (const gitDir of gitDirs) {
                const repoPath = path.resolve(root, path.dirname(gitDir));
                repos.push(repoPath);
            }
        } catch (e) {
            console.error(`Error scanning ${root}:`, e);
        }
    }

    console.log(`Found ${repos.length} repositories.`);
    await redis.set(KEYS.REPOS, JSON.stringify(repos));
}
