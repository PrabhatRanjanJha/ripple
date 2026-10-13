// lists the saved what-if scenarios of a project
const describeChange = (change, tasks) => {
  const title = tasks.find((task) => task._id === change.taskId)?.title
  if (!title) {
    return null
  }
  return `${title} ${change.deltaDays > 0 ? '+' : ''}${change.deltaDays}d`
}

function ScenarioList({ scenarios, tasks, busyId, onRun, onDelete }) {
  if (scenarios.length === 0) {
    return (
      <p className="mt-6 text-sm text-slate-500">
        No saved scenarios yet. Run a what-if and save it to see it here.
      </p>
    )
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-slate-900">Saved scenarios</h3>
      <ul className="mt-3 space-y-2">
        {scenarios.map((scenario) => (
          <li
            key={scenario._id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
          >
            <div>
              <p className="font-semibold text-slate-900">{scenario.name}</p>
              <p className="text-sm text-slate-600">
                {scenario.changes.map((change) => describeChange(change, tasks)).filter(Boolean).join(', ') || 'Its tasks were deleted'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onRun(scenario)}
                disabled={busyId === scenario._id}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {busyId === scenario._id ? 'Running...' : 'Run'}
              </button>
              <button
                type="button"
                onClick={() => onDelete(scenario)}
                disabled={busyId === scenario._id}
                className="rounded-md border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ScenarioList