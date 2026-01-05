'use server'

import { redis, KEYS } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function getRepos() {
    const reposStr = await redis.get<string[]>(KEYS.REPOS);
    return reposStr || [];
}

export async function createJob(prefix: string, prompt: string, mode: 'plan' | 'fix' | 'diagnose' = 'plan') {
    const id = uuidv4();
    const jobMeta = {
        id,
        repoPath: prefix,
        prompt,
        mode,
        status: 'pending',
        createdAt: Date.now(),
    };

    await redis.hset(KEYS.JOB_META(id), jobMeta);
    await redis.lpush(KEYS.JOBS_QUEUE, id);
    // Maintain a list of recent jobs
    await redis.lpush('jobs:list', id);
    await redis.ltrim('jobs:list', 0, 99); // Keep last 100

    revalidatePath('/');
    return id;
}

export async function getRecentJobs() {
    const jobIds = await redis.lrange('jobs:list', 0, 19); // Last 20
    if (!jobIds.length) return [];

    // Pipelined fetch
    const pipeline = redis.pipeline();
    for (const id of jobIds) {
        pipeline.hgetall(KEYS.JOB_META(id));
    }
    const results = await pipeline.exec();
    return results.map((meta, i) => ({ ...meta as any, id: jobIds[i] })); // Type cast
}

export async function getJobDetails(id: string) {
    const meta = await redis.hgetall(KEYS.JOB_META(id));
    if (!meta) return null;
    return meta;
}

export async function getJobLogs(id: string) {
    const logs = await redis.lrange(KEYS.JOB_LOGS(id), 0, -1);
    return logs.map(line => {
        try { return JSON.parse(line); } catch { return { type: 'text', content: line }; }
    });
}

export async function stopJob(id: string) {
    await redis.hset(KEYS.JOB_CONTROL(id), { cancel: 'true' });
    revalidatePath(`/jobs/${id}`);
}

export async function getBrainIndex() {
    const indexStr = await redis.get<string>(KEYS.BRAIN_INDEX);
    if (!indexStr) return [];
    try {
        return JSON.parse(indexStr);
    } catch {
        return [];
    }
}

export async function getBrainFileContent(path: string) {
    const content = await redis.get<string>(`brain:content:${path}`);
    return content || '';
}
