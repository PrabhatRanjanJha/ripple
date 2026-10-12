// draws the schedule as a timeline, one bar per task
const msPerDay = 24 * 60 * 60 * 1000

const toDate = (text) => {
  const [year, month, day] = text.split('-').map(Number)
  return new Date(year, month - 1, day)
}

// 'YYYY-MM-DD' plus a number of days, shown as '12 Oct'
const dayLabel = (startText, offset) => {
  const date = toDate(startText)
  date.setDate(date.getDate() + offset)
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

const daysBetween = (fromText, toText) => Math.round((toDate(toText) - toDate(fromText)) / msPerDay)

// baseline is an optional older schedule, drawn as dashed ghost bars
function GanttChart({ schedule, baseline = null }) {
  if (!schedule || schedule.tasks.length === 0) {
    return null
  }

  // the deadline line sits at the end of the deadline day
  const deadlineOffset = schedule.deadline ? daysBetween(schedule.projectStart, schedule.deadline) + 1 : null
  const total = Math.max(schedule.projectDuration, baseline?.projectDuration || 0, deadlineOffset || 0)
  const percent = (days) => `${(days / total) * 100}%`

  // about ten labels on the day axis
  const step = Math.max(1, Math.ceil(total / 10))
  const ticks = []
  for (let day = 0; day <= total; day += step) {
    ticks.push(day)
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Timeline</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">Gantt chart</h2>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500" /> Critical task</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-sky-500" /> Task with slack</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded bg-slate-200" /> Slack</span>
        {baseline && (
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border-2 border-dashed border-slate-400" /> Original plan</span>
        )}
        {deadlineOffset !== null && (
          <span className="flex items-center gap-1.5"><span className="h-3 w-0.5 bg-rose-500" /> Deadline</span>
        )}
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="relative min-w-[640px]">
          <div className="flex">
            <div className="w-40 shrink-0" />
            <div className="relative h-6 flex-1">
              {ticks.map((day) => (
                <span
                  key={day}
                  className="absolute top-0 -translate-x-1/2 whitespace-nowrap text-xs text-slate-500"
                  style={{ left: percent(day) }}
                >
                  {dayLabel(schedule.projectStart, day)}
                </span>
              ))}
            </div>
          </div>

          {schedule.tasks.map((row) => {
            const ghost = baseline?.tasks.find((item) => item.taskId === row.taskId)

            return (
              <div key={row.taskId} className="flex items-center border-t border-slate-100">
                <div className="w-40 shrink-0 truncate py-2 pr-3 text-sm font-medium text-slate-800" title={row.title}>
                  {row.title}
                </div>
                <div className="relative h-10 flex-1">
                  {ghost && (
                    <div
                      className="absolute top-1/2 h-6 -translate-y-1/2 rounded-md border-2 border-dashed border-slate-400"
                      style={{ left: percent(ghost.earliestStart), width: percent(ghost.durationDays) }}
                    />
                  )}
                  {row.slack > 0 && (
                    <div
                      className="absolute top-1/2 h-2 -translate-y-1/2 rounded-r bg-slate-200"
                      style={{ left: percent(row.earliestFinish), width: percent(row.slack) }}
                    />
                  )}
                  <div
                    className={`absolute top-1/2 flex h-6 -translate-y-1/2 items-center rounded-md px-2 text-xs font-semibold text-white ${row.critical ? 'bg-amber-500' : 'bg-sky-500'} ${row.status === 'done' ? 'opacity-50' : ''}`}
                    style={{ left: percent(row.earliestStart), width: percent(row.durationDays) }}
                    title={`${row.title}: ${row.startDate} to ${row.endDate}, slack ${row.slack} days`}
                  >
                    <span className="truncate">{row.durationDays}d</span>
                  </div>
                </div>
              </div>
            )
          })}

          {deadlineOffset !== null && (
            <div
              className="pointer-events-none absolute bottom-0 top-6 w-0.5 bg-rose-500"
              style={{ left: `calc(10rem + (100% - 10rem) * ${deadlineOffset / total})` }}
            />
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Each bar starts as early as its dependencies allow. The pale tail shows how long a task can slip without moving the finish date.
      </p>
    </section>
  )
}

export default GanttChart