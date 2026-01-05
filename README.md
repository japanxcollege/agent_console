# Agent Console

Remote control interface for Claude Code on macOS, accessible via a Vercel-hosted Web App.

## Architecture
- **Web App**: Next.js (App Router) hosted on Vercel.
- **Worker**: Node.js process running on your Mac.
- **Communication**: Upstash Redis (REST API).

## Prerequisites
1. **Upstash Redis**: Create a database at [console.upstash.com](https://console.upstash.com/). Get the `REST_URL` and `REST_TOKEN`.
2. **Claude Code**: Ensure `claude` is installed and authenticated on your Mac.
3. **Node.js**: v18+.

## Setup

### 1. Web App (Vercel)
1. Navigate to `app/`.
2. Copy `.env.example` to `.env.local` and fill in:
   ```bash
   UPSTASH_REDIS_REST_URL="..."
   UPSTASH_REDIS_REST_TOKEN="..."
   ADMIN_KEY="your-secret-key"
   ```
3. Deploy to Vercel:
   ```bash
   npx vercel deploy
   ```
   (Or push to GitHub and connect Vercel).
4. Set the Environment Variables in Vercel project settings.

### 2. Worker (Mac)
1. Navigate to `worker/`.
2. Copy `.env.example` to `.env` and fill in:
   ```bash
   UPSTASH_REDIS_REST_URL="..."
   UPSTASH_REDIS_REST_TOKEN="..."
   ALLOWED_ROOTS="/Users/yourname/projects,/Users/yourname/dev"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the worker:
   ```bash
   npm start
   ```

### 3. Usage
1. Open the Web App URL.
2. Go to **New Job**.
3. Select a repository (scanned from `ALLOWED_ROOTS`).
4. Enter a prompt for Claude.
5. Watch the live logs!

## Security Notes
- **Admin Key**: Ensure your Web App is protected (Basic Auth or similar recommended if exposed publicly, currently the app code does not enforce `ADMIN_KEY` check on routes, you should add Middleware if deploying publicly).
- **Allowed Roots**: strictly limit `ALLOWED_ROOTS` in `worker/.env` to prevent access to sensitive directories.
- **Review Mode**: Use `plan` mode to review Claude's plan before execution.

## Troubleshooting
- **No Repos**: Check `ALLOWED_ROOTS` in worker `.env` and restart worker.
- **No Logs**: Check Redis connection in both App and Worker. Ensure `claude` command is in PATH for the worker process.
- **Artifacts**: Brain artifacts are scanned from `~/.gemini/antigravity/brain`.
