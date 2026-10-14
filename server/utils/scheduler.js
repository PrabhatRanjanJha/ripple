import { topoSort } from './graph.js'
import { parseDay, addDays, formatDay, daysBetween } from './dates.js'

// work out the schedule and the critical path of a project
const computeSchedule = ({ tasks, startDate, deadline = null, today = null }) => {
    const start = parseDay(startDate)
    const byId = new Map(tasks.map((task) => [task.id, task]))

    // only keep dependencies that exist, once each
    const dependenciesOf = (task) => [...new Set((task.dependsOn || []).filter((id) => byId.has(id)))]

    // every task comes after the tasks it depends on (throws if there is a circle)
    const order = topoSort(tasks)

    // forward pass: the earliest each task can start and finish
    const earliestStart = new Map()
    const earliestFinish = new Map()
    order.forEach((id) => {
        const task = byId.get(id)
        let begin = 0
        dependenciesOf(task).forEach((dependencyId) => {
            begin = Math.max(begin, earliestFinish.get(dependencyId))
        })
        earliestStart.set(id, begin)
        earliestFinish.set(id, begin + task.durationDays)
    })

    // the project ends when its last task ends
    let projectDuration = 0
    earliestFinish.forEach((finish) => {
        projectDuration = Math.max(projectDuration, finish)
    })

    // for each task, the tasks that wait for it
    const successors = new Map()
    tasks.forEach((task) => {
        dependenciesOf(task).forEach((dependencyId) => {
            if (!successors.has(dependencyId)) {
                successors.set(dependencyId, [])
            }
            successors.get(dependencyId).push(task.id)
        })
    })

    // backward pass: the latest each task can start and finish without delaying the project
    const latestStart = new Map()
    const latestFinish = new Map()
    for (let i = order.length - 1; i >= 0; i--) {
        const id = order[i]
        const waiting = successors.get(id) || []
        let finish = projectDuration
        waiting.forEach((nextId) => {
            finish = Math.min(finish, latestStart.get(nextId))
        })
        latestFinish.set(id, finish)
        latestStart.set(id, finish - byId.get(id).durationDays)
    }

    // slack is how long a task can slip, a task with no slack is critical
    const rows = tasks.map((task) => {
        const id = task.id
        const slack = latestStart.get(id) - earliestStart.get(id)
        return {
            taskId: id,
            title: task.title,
            durationDays: task.durationDays,
            status: task.status,
            dependsOn: task.dependsOn || [],
            earliestStart: earliestStart.get(id),
            earliestFinish: earliestFinish.get(id),
            latestStart: latestStart.get(id),
            latestFinish: latestFinish.get(id),
            slack,
            critical: slack === 0,
            startDate: formatDay(addDays(start, earliestStart.get(id))),
            endDate: formatDay(addDays(start, earliestFinish.get(id) - 1)),
        }
    })
    rows.sort((a, b) => a.earliestStart - b.earliestStart || a.title.localeCompare(b.title))

    const finishDate = tasks.length > 0 ? formatDay(addDays(start, projectDuration - 1)) : null

    let deadlineStatus = 'none'
    let daysFromDeadline = null
    if (deadline && finishDate) {
        daysFromDeadline = daysBetween(parseDay(deadline), parseDay(finishDate))
        deadlineStatus = daysFromDeadline > 0 ? 'late' : 'on_track'
    }

    // progress: how much of the planned work is done and which tasks are late
    const totalDays = tasks.reduce((sum, task) => sum + task.durationDays, 0)
    const doneDays = tasks.reduce((sum, task) => sum + (task.status === 'done' ? task.durationDays : 0), 0)
    const doneCount = tasks.filter((task) => task.status === 'done').length
    const overdueTaskIds = today
        ? rows.filter((row) => row.status !== 'done' && row.endDate < today).map((row) => row.taskId)
        : []

    return {
        projectStart: formatDay(start),
        projectDuration,
        finishDate,
        deadline: deadline || null,
        deadlineStatus,
        daysFromDeadline,
        tasks: rows,
        criticalTaskIds: rows.filter((row) => row.critical).map((row) => row.taskId),
        progress: {
            percentDone: totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0,
            doneCount,
            totalCount: tasks.length,
            overdueTaskIds,
        },
    }
}

const clampDuration = (days) => Math.min(365, Math.max(1, days))

// run the schedule again with some durations changed, nothing is saved
const simulate = ({ tasks, startDate, deadline = null, changes = [] }) => {
    const baseline = computeSchedule({ tasks, startDate, deadline })

    // add up the changes of each task, changes for unknown tasks are ignored
    const deltas = new Map()
    changes.forEach((change) => {
        deltas.set(change.taskId, (deltas.get(change.taskId) || 0) + change.deltaDays)
    })

    const changedTasks = tasks.map((task) => ({
        ...task,
        durationDays: clampDuration(task.durationDays + (deltas.get(task.id) || 0)),
    }))
    const simulated = computeSchedule({ tasks: changedTasks, startDate, deadline })

    // list the tasks that moved or changed between critical and not critical
    const before = new Map(baseline.tasks.map((row) => [row.taskId, row]))
    const moved = []
    simulated.tasks.forEach((row) => {
        const old = before.get(row.taskId)
        const shiftDays = row.earliestFinish - old.earliestFinish
        const becameCritical = row.critical && !old.critical
        const leftCritical = !row.critical && old.critical
        if (shiftDays !== 0 || becameCritical || leftCritical) {
            moved.push({ taskId: row.taskId, title: row.title, shiftDays, becameCritical, leftCritical })
        }
    })

    return {
        baseline,
        simulated,
        diff: {
            finishShiftDays: simulated.projectDuration - baseline.projectDuration,
            deadlineStatusBefore: baseline.deadlineStatus,
            deadlineStatusAfter: simulated.deadlineStatus,
            tasks: moved,
        },
    }
}

export { computeSchedule, simulate }