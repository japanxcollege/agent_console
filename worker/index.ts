import { redis, KEYS } from './redis.js';
import { scanRepos } from './scanner.js';
import { indexBrain } from './brain_indexer.js';
import { executeJob } from './executor.js';
import dotenv from 'dotenv';

dotenv.config();

const SCAN_INTERVAL = 1000 * 60 * 30; // 30 minutes
const POLL_INTERVAL = 2000; // 2 seconds (using BRPOP usually blocks, but via HTTP we might poll)

async function main() {
    console.log('Worker started. connecting to Upstash...');

    // Initial scan
    await Promise.all([scanRepos(), indexBrain()]);
    setInterval(scanRepos, SCAN_INTERVAL);
    setInterval(indexBrain, SCAN_INTERVAL); // Sync brain every 30 mins too

    console.log('Waiting for jobs...');

    while (true) {
        try {
            // Using BRPOP is strictly TCP but @upstash/redis REST client supports it?
            // "The REST API does not support blocking commands."
            // We must use plain RPOP/LPOP loop.

            const jobId = await redis.rpop(KEYS.JOBS_QUEUE) as string | null;

            if (jobId) {
                console.log(`Received job ${jobId}`);
                const meta = await redis.hgetall(KEYS.JOB_META(jobId));

                if (meta) {
                    await executeJob(jobId, meta);
                } else {
                    console.error(`Job meta not found for ${jobId}`);
                }
            } else {
                // Sleep if no job
                await new Promise(r => setTimeout(r, POLL_INTERVAL));
            }
        } catch (e) {
            console.error('Error in main loop:', e);
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

main().catch(console.error);
