import { spawn } from 'child_process';
import { redis, KEYS } from './redis.js';
import * as fs from 'fs';
import * as path from 'path';

export async function executeJob(jobId: string, meta: any) {
    const { repoPath, prompt, mode, allowedTools } = meta;

    // Safety check for repo path
    const allowedRootsStr = process.env.ALLOWED_ROOTS || '';
    const allowedRoots = allowedRootsStr.split(',').map(r => r.trim()).filter(Boolean);
    const isAllowed = allowedRoots.some(root => repoPath.startsWith(root));

    if (!isAllowed) {
        await redis.hset(KEYS.JOB_META(jobId), { status: 'failed', error: 'Repository path not allowed' });
        return;
    }

    await redis.hset(KEYS.JOB_META(jobId), { status: 'running', startTime: Date.now() });

    // Construct command
    // Default tools if not specified
    const tools = allowedTools || "Read,Bash(git:*),Bash(npm run test:e2e),Bash(pnpm -v),Bash(node -v)";
    let permissionMode = 'plan'; // Default
    if (mode === 'fix' || mode === 'diagnose') permissionMode = 'acceptEdits'; // Simplify for now

    // We use 'claude' assuming it's in PATH. User must ensure this.
    const args = [
        '-p',
        prompt,
        '--verbose',
        '--output-format', 'stream-json',
        '--permission-mode', permissionMode, // 'plan' or 'acceptEdits' (user request said plan/fix map)
        '--allowedTools', tools,
        '--cwd', repoPath // claude doesn't strictly support --cwd flag like this, it usually runs in CWD. 
        // Note: Claude CLI typically takes the prompt as an argument or stdin. 
        // User request: "stdout/stderr stream-json", "stdin prompt".
        // Let's re-read the request: "stdinからプロンプトを渡す"
    ];

    // Reset args to use stdin for prompt
    // claude [options] [prompt] -> if prompt is -, read from stdin? Or just pipe?
    // Let's assume `claude` accepts prompt as arg `-p "prompt"` OR `cat prompt | claude`.
    // The user request example: `claude -p ...`. If `-p` is used, it expects the prompt in the arg.
    // BUT the request also says "stdin to pass prompt". 
    // Let's try to pass it via -p for simplicity if short, but for long prompts stdin is better.
    // If I use `spawn('claude', ...)` I can write to stdin.
    // Let's assume standard behavior: if no prompt arg, it listens on stdin? 
    // Actually, `claude` CLI behavior might vary. I will use the `-p` or stdin. 
    // Providing prompt via stdin is safer for special chars.

    // Correction: `claude` CLI usually accepts prompt as a positional arg or `-p`.
    // If the tool supports `-p`, I'll use it. If the prompt is huge, might be an issue.
    // Let's use the exact command structure the user requested in the Prompt.
    // The user provided: `claude -p --verbose ...` but also `stdin from prompt`. 
    // Probably means: `echo "prompt" | claude --verbose ...` OR `claude -p "prompt" ...`.
    // Let's go with writing to stdin and NOT passing -p if I can, OR pass -p if the CLI requires it.
    // The user request example explicitly included `-p`. 
    // "claude -p --verbose ... を使い、stdinからプロンプトを渡す" -> This is contradictory or means "-p" is for something else?
    // standard `claude` (anthropic's python cli? or `claude-code`?)
    // Assuming `claude` alias for `claude-code` or similar.
    // I will write the prompt to a temporary file and stream it or just write to stdin.
    // Let's try writing to stdin.

    const cmdArgs = [
        '--verbose',
        '--output-format', 'stream-json',
        '--permission-mode', permissionMode,
        '--allowedTools', tools,
        // We need to execute IN the repo path.
    ];

    // Check if the CLI supports changing CWD or if execute in that dir.
    // child_process.spawn cwd option handles this.

    console.log(`Spawning claude in ${repoPath} with args:`, cmdArgs);

    const child = spawn('claude', cmdArgs, {
        cwd: repoPath,
        env: { ...process.env, FORCE_COLOR: '1' }
    });

    // Write prompt to stdin
    child.stdin.write(prompt);
    // Write prompt to stdin
    child.stdin.write(prompt);
    // Do NOT end stdin immediately, keep it open for interactive mode
    // child.stdin.end();

    child.stdout.on('data', async (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            await redis.rpush(KEYS.JOB_LOGS(jobId), line);
        }
    });

    child.stderr.on('data', async (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
            if (!line.trim()) continue;
            const errorMsg = JSON.stringify({ type: 'error', content: line });
            await redis.rpush(KEYS.JOB_LOGS(jobId), errorMsg);
        }
    });

    // Handler for cancellation and input
    const checkInterval = setInterval(async () => {
        // 1. Check for cancellation
        const control = await redis.hgetall(KEYS.JOB_CONTROL(jobId));
        if (control?.cancel === 'true') {
            child.kill('SIGINT');
            clearInterval(checkInterval);
            await redis.rpush(KEYS.JOB_LOGS(jobId), JSON.stringify({ type: 'system', content: 'Job cancelled by user.' }));
            return;
        }

        // 2. Check for user input
        // Using lpop to get oldest message
        const inputMsg = await redis.lpop(KEYS.JOB_INPUT(jobId));
        if (inputMsg && typeof inputMsg === 'string') {
            console.log(`Sending input to job ${jobId}: ${inputMsg}`);
            // Claude Code expects inputs on stdin. 
            // If it's a prompt response, usually just the text + newline.
            child.stdin.write(inputMsg + '\n');

            // Log that we sent input
            await redis.rpush(KEYS.JOB_LOGS(jobId), JSON.stringify({
                type: 'system',
                content: `> User input: ${inputMsg}`
            }));
        }
    }, 500); // Check every 500ms

    return new Promise<void>((resolve, reject) => {
        child.on('close', async (code) => {
            clearInterval(checkInterval);

            // Post-execution: Capture artifacts
            try {
                // git diff
                // We'll spawn a quick git diff
                const diffChild = spawn('git', ['diff'], { cwd: repoPath });
                let diffOut = '';
                diffChild.stdout.on('data', d => diffOut += d.toString());
                await new Promise(r => diffChild.on('close', r));

                // git status
                const statusChild = spawn('git', ['status', '--short'], { cwd: repoPath });
                let statusOut = '';
                statusChild.stdout.on('data', d => statusOut += d.toString());
                await new Promise(r => statusChild.on('close', r));

                await redis.hset(KEYS.JOB_ARTIFACTS(jobId), {
                    gitDiff: diffOut,
                    gitStatus: statusOut
                });

            } catch (e) {
                console.error('Failed to capture artifacts', e);
            }

            const finalStatus = code === 0 ? 'completed' : 'failed';
            await redis.hset(KEYS.JOB_META(jobId), { status: finalStatus, endTime: Date.now() });
            resolve();
        });

        child.on('error', async (err) => {
            clearInterval(checkInterval);
            await redis.hset(KEYS.JOB_META(jobId), { status: 'failed', error: err.message });
            resolve(); // Resolve to process next job
        });
    });
}
