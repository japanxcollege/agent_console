import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    // In build time or if env not set, this might crash if used.
    // We'll allow it specifically for build but warn.
    if (process.env.NODE_ENV !== 'production') {
        console.warn('Missing UPSTASH_REDIS env vars');
    }
}

export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || 'https://example.upstash.io',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || 'example',
});

// Duplicate keys config for now to keep them separate/safe
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
