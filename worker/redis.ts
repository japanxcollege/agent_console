import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN');
}

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const KEYS = {
    SETTINGS: 'config:settings',
    REPOS: 'global:repos',
    JOBS_QUEUE: 'jobs:queue',
    JOB_META: (id: string) => `job:${id}:meta`,
    JOB_LOGS: (id: string) => `job:${id}:events`,
    JOB_ARTIFACTS: (id: string) => `job:${id}:artifacts`,
    JOB_CONTROL: (id: string) => `job:${id}:control`,
    BRAIN_INDEX: 'antigravity:brain:index',
};
