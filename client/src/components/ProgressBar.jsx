// shows how much of the planned work is done
function ProgressBar({ progress }) {
  if (!progress || progress.totalCount === 0) {
    return null
  }

  const overdue = progress.overdueTaskIds.length

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Progress</h2>
        <p className="text-sm text-slate-600">
          {progress.doneCount} of {progress.totalCount} tasks done
        </p>
      </div>
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress.percentDone}%` }} />
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{progress.percentDone}% of the planned work is done</p>
      {overdue > 0 && (
        <p className="mt-1 text-sm font-medium text-rose-700">
          {overdue} {overdue === 1 ? 'task is' : 'tasks are'} overdue
        </p>
      )}
    </section>
  )
}

export default ProgressBar