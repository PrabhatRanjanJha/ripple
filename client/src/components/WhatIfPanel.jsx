import { useEffect, useState } from 'react'
import ScenarioList from './ScenarioList.jsx'
import StatusMessage from './StatusMessage.jsx'
import { createScenario, deleteScenario, fetchScenarios, runScenario } from '../axiosCalls/scenarioApi.js'
import { simulateSchedule } from '../axiosCalls/scheduleApi.js'

const emptyRow = { taskId: '', deltaDays: '1' }

const daysText = (count) => `${count} ${count === 1 ? 'day' : 'days'}`

const formatDate = (value) => {
  if (!value) {
    return 'Not set'
  }
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString()
}

const statusWord = (status) => ({ none: 'No deadline', on_track: 'On track', late: 'Late' }[status] || status)

const statusStyle = (status) => ({
  none: 'bg-slate-100 text-slate-700',
  on_track: 'bg-emerald-100 text-emerald-800',
  late: 'bg-rose-100 text-rose-800',
}[status] || 'bg-slate-100 text-slate-700')

// words for how far the finish date moved
const shiftText = (days) => {
  if (days === 0) {
    return 'The finish date does not move.'
  }
  if (days > 0) {
    return `The finish date moves ${daysText(days)} later.`
  }
  return `The finish date moves ${daysText(-days)} earlier.`
}

// words for how far one task moved
const moveText = (item) => {
  const parts = []
  if (item.shiftDays > 0) {
    parts.push(`${daysText(item.shiftDays)} later`)
  }
  if (item.shiftDays < 0) {
    parts.push(`${daysText(-item.shiftDays)} earlier`)
  }
  if (item.becameCritical) {
    parts.push('becomes critical')
  }
  if (item.leftCritical) {
    parts.push('no longer critical')
  }
  return parts.join(', ')
}

function WhatIfPanel({ projectId, tasks, result, onResult }) {
  const [rows, setRows] = useState([emptyRow])
  const [scenarios, setScenarios] = useState([])
  const [scenarioName, setScenarioName] = useState('')
  const [running, setRunning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState('')
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')

  // only rows with a task and a whole number of days other than 0 can be sent
  const readyChanges = rows
    .filter((row) => row.taskId && Number.isInteger(Number(row.deltaDays)) && Number(row.deltaDays) !== 0)
    .map((row) => ({ taskId: row.taskId, deltaDays: Number(row.deltaDays) }))

  useEffect(() => {
    fetchScenarios(projectId)
      .then((data) => setScenarios(data))
      .catch(() => setScenarios([]))
  }, [projectId])

  // forget tasks that were deleted
  useEffect(() => {
    setRows((prev) => prev.map((row) => (tasks.some((task) => task._id === row.taskId) ? row : { ...row, taskId: '' })))
  }, [tasks])

  const handleRowChange = (index, field, value) => {
    setRows((prev) => prev.map((row, position) => (position === index ? { ...row, [field]: value } : row)))
    setErr('')
    setNotice('')
  }

  const handleAddRow = () => {
    setRows((prev) => [...prev, emptyRow])
  }

  const handleRemoveRow = (index) => {
    setRows((prev) => (prev.length === 1 ? [emptyRow] : prev.filter((row, position) => position !== index)))
  }

  const handleRun = async () => {
    setErr('')
    setNotice('')
    if (readyChanges.length === 0) {
      setErr('Pick a task and a whole number of days other than 0.')
      return
    }

    setRunning(true)
    try {
      const data = await simulateSchedule(projectId, readyChanges)
      onResult({ baseline: data.baseline, simulated: data.simulated, diff: data.diff })
    }
    catch (error) {
      setErr(error.response?.data?.message || 'Unable to run the what-if. Please try again.')
    }
    setRunning(false)
  }

  const handleReset = () => {
    setRows([emptyRow])
    setErr('')
    setNotice('')
    onResult(null)
  }

  const handleSave = async () => {
    setErr('')
    setNotice('')
    if (!scenarioName.trim()) {
      setErr('Give the scenario a name.')
      return
    }
    if (readyChanges.length === 0) {
      setErr('Pick a task and a whole number of days other than 0.')
      return
    }

    setSaving(true)
    try {
      const saved = await createScenario(projectId, { name: scenarioName.trim(), changes: readyChanges })
      setScenarios((prev) => [saved, ...prev])
      setScenarioName('')
      setNotice('Scenario saved.')
    }
    catch (error) {
      setErr(error.response?.data?.message || 'Unable to save the scenario. Please try again.')
    }
    setSaving(false)
  }

  const handleRunScenario = async (scenario) => {
    setErr('')
    setNotice('')
    setBusyId(scenario._id)
    try {
      const data = await runScenario(scenario._id)
      onResult({ baseline: data.baseline, simulated: data.simulated, diff: data.diff })

      const kept = scenario.changes
        .filter((change) => tasks.some((task) => task._id === change.taskId))
        .map((change) => ({ taskId: change.taskId, deltaDays: String(change.deltaDays) }))
      setRows(kept.length > 0 ? kept : [emptyRow])
      setNotice(`Showing the scenario: ${scenario.name}`)
    }
    catch (error) {
      setErr(error.response?.data?.message || 'Unable to run the scenario. Please try again.')
    }
    setBusyId('')
  }

  const handleDeleteScenario = async (scenario) => {
    if (!window.confirm(`Delete the scenario "${scenario.name}"?`)) {
      return
    }

    setErr('')
    setNotice('')
    setBusyId(scenario._id)
    try {
      await deleteScenario(scenario._id)
      setScenarios((prev) => prev.filter((item) => item._id !== scenario._id))
    }
    catch (error) {
      setErr(error.response?.data?.message || 'Unable to delete the scenario. Please try again.')
    }
    setBusyId('')
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">What if</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">Try a delay</h2>
      <p className="mt-2 text-sm text-slate-600">
        Pick a task and change its duration to see what happens to the finish date. Nothing here changes your real plan.
      </p>

      {tasks.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">Add tasks to try a what-if.</p>
      ) : (
        <div className="mt-5 space-y-4">
          <StatusMessage message={err} />
          {notice && <p className="text-sm font-medium text-emerald-700">{notice}</p>}

          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <select
                  value={row.taskId}
                  onChange={(event) => handleRowChange(index, 'taskId', event.target.value)}
                  className="min-w-48 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
                >
                  <option value="">Choose a task</option>
                  {tasks.map((task) => (
                    <option key={task._id} value={task._id}>{task.title}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step="1"
                  value={row.deltaDays}
                  onChange={(event) => handleRowChange(index, 'deltaDays', event.target.value)}
                  className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                />
                <span className="text-sm text-slate-500">days (use a minus to shorten)</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRow(index)}
                  className="rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAddRow}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Add another change
            </button>
            <button
              type="button"
              onClick={handleRun}
              disabled={running}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {running ? 'Running...' : 'Run what-if'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <input
              type="text"
              placeholder="Scenario name"
              maxLength={60}
              value={scenarioName}
              onChange={(event) => setScenarioName(event.target.value)}
              className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save as scenario'}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-4">
          <p className="font-semibold text-slate-900">{shiftText(result.diff.finishShiftDays)}</p>
          <p className="mt-1 text-sm text-slate-600">
            New finish date: {formatDate(result.simulated.finishDate)} (was {formatDate(result.baseline.finishDate)})
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <span>Deadline:</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(result.diff.deadlineStatusBefore)}`}>
              {statusWord(result.diff.deadlineStatusBefore)}
            </span>
            <span>to</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(result.diff.deadlineStatusAfter)}`}>
              {statusWord(result.diff.deadlineStatusAfter)}
            </span>
          </div>

          {result.diff.tasks.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-slate-700">
              {result.diff.tasks.map((item) => (
                <li key={item.taskId}>
                  <span className="font-semibold">{item.title}</span>: {moveText(item)}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-xs text-slate-500">
            Nothing is saved to your plan. The Gantt chart below shows the original plan as dashed outlines.
          </p>
        </div>
      )}

      <ScenarioList
        scenarios={scenarios}
        tasks={tasks}
        busyId={busyId}
        onRun={handleRunScenario}
        onDelete={handleDeleteScenario}
      />
    </section>
  )
}

export default WhatIfPanel