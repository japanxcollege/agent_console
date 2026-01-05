import { getRecentJobs } from "./actions";
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const jobs = await getRecentJobs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Recent Jobs</h2>
        <Link href="/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
          + New Job
        </Link>
      </div>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500">
            No jobs found. Start a new one!
          </div>
        ) : (
          jobs.map((job: any) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block group">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-indigo-500/50 transition-all hover:shadow-indigo-500/10 hover:shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider
                                ${job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      job.status === 'failed' ? 'bg-red-500/10 text-red-400' :
                        job.status === 'running' ? 'bg-sky-500/10 text-sky-400 animate-pulse' :
                          'bg-slate-700 text-slate-400'}`}>
                    {job.status}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(Number(job.createdAt)).toLocaleString()}
                  </span>
                </div>
                <div className="font-mono text-sm text-slate-300 truncate mb-1" title={job.repoPath}>
                  {job.repoPath}
                </div>
                <div className="text-slate-400 text-sm line-clamp-2">
                  {job.prompt}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
