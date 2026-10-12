// shows the schedule of a project and highlights the critical path
const formatDate = (value) => {
  if (!value) {
    return 'Not set'
  }
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

const daysText = (count) => `${count} ${count === 1 ? 'day' : 'days'}`

// words and colour for the deadline badge
const deadlineBadge = (schedule) => {
  if (schedule.deadlineStatus === 'none') {
    return { text: 'No deadline set', style: 'bg-slate-100 text-slate-700' }
  }

  if (schedule.deadlineStatus === 'late') {
    return { text: `${daysText(schedule.daysFromDeadline)} late`, style: 'bg-rose-100 text-rose-800' }
  }

  if (schedule.daysFromDeadline === 0) {
    return { text: 'On track, finishes on the deadline', style: 'bg-emerald-100 text-emerald-800' }
  }

  return { text: `On track, ${daysText(-schedule.daysFromDeadline)} to spare`, style: 'bg-emerald-100 text-emerald-800' }
}

function ScheduleTable({ schedule }) {
  if (!schedule) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold text-slate-900">Schedule</h2>
        <p className="mt-2 text-slate-600">The schedule could not be loaded right now.</p>
      </section>
    )
  }

  if (schedule.tasks.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-2xl font-bold text-slate-900">Schedule</h2>
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-900">Nothing to schedule yet</h3>
          <p className="mt-2 text-slate-600">Add tasks to see the finish date and the critical path.</p>
        </div>
      </section>
    )
  }

  const badge = deadlineBadge(schedule)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Critical path</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">Schedule</h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Finish date</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{formatDate(schedule.finishDate)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total duration</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{daysText(schedule.projectDuration)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Critical tasks</p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {schedule.criticalTaskIds.length} of {schedule.tasks.length}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deadline</p>
          <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badge.style}`}>
            {badge.text}
          </span>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-3 py-3 font-semibold">Task</th>
              <th scope="col" className="px-3 py-3 font-semibold">Start</th>
              <th scope="col" className="px-3 py-3 font-semibold">End</th>
              <th scope="col" className="px-3 py-3 font-semibold">Duration</th>
              <th scope="col" className="px-3 py-3 font-semibold">Slack</th>
              <th scope="col" className="px-3 py-3 font-semibold">Critical</th>
            </tr>
          </thead>
          <tbody>
            {schedule.tasks.map((row) => (
              <tr
                key={row.taskId}
                className={`border-b border-slate-100 last:border-0 ${row.critical ? 'bg-amber-50' : ''}`}
              >
                <th scope="row" className="max-w-56 break-words px-3 py-3 font-semibold text-slate-900">
                  {row.title}
                </th>
                <td className="whitespace-nowrap px-3 py-3 text-slate-700">{formatDate(row.startDate)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-700">{formatDate(row.endDate)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-700">{daysText(row.durationDays)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-slate-700">{daysText(row.slack)}</td>
                <td className="px-3 py-3">
                  {row.critical ? (
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      Critical
                    </span>
                  ) : (
                    <span className="text-slate-400">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        A critical task has no slack. If it slips, the finish date moves with it.
      </p>
    </section>
  )
}

export default ScheduleTable