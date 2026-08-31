export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-5 w-48 rounded bg-slate-200" />
      <div className="h-4 w-72 rounded bg-slate-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-200 bg-white p-5">
            <div className="h-3 w-20 rounded bg-slate-200" />
            <div className="mt-3 h-6 w-16 rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="h-40 rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
