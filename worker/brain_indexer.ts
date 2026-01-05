import { glob } from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { redis, KEYS } from './redis.js';

const BRAIN_DIR = path.join(process.env.HOME || '', '.gemini/antigravity/brain');

export async function indexBrain() {
    if (!fs.existsSync(BRAIN_DIR)) {
        console.warn(`Brain directory not found: ${BRAIN_DIR}`);
        return;
    }

    console.log('Indexing Brain artifacts...');
    try {
        const files = await glob('**/*.{md,resolved}', { cwd: BRAIN_DIR });

        const index = [];
        const pipeline = redis.pipeline();

        for (const file of files) {
            const absPath = path.join(BRAIN_DIR, file);
            const stats = fs.statSync(absPath);
            const content = fs.readFileSync(absPath, 'utf-8');

            const meta = {
                path: file, // relative path as ID
                absPath,
                modified: stats.mtimeMs,
                size: stats.size
            };
            index.push(meta);

            // Store content in a separate key to avoid bloating the index
            pipeline.set(`brain:content:${file}`, content);
        }

        pipeline.set(KEYS.BRAIN_INDEX, JSON.stringify(index));
        await pipeline.exec();
        console.log(`Indexed ${files.length} brain artifacts.`);
    } catch (e) {
        console.error('Error indexing brain:', e);
    }
}
