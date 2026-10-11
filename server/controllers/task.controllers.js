import Project from '../model/project.model.js'
import Task from '../model/task.model.js'
import { findCycle } from '../utils/graph.js'

const taskFields = ['title', 'durationDays', 'status', 'notes', 'dependsOn']
const validStatuses = ['todo', 'doing', 'done']

const isValidId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)

// check and clean the fields sent for a task
const getTaskInput = (body, isCreate) => {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Task details must be a JSON object' }
    }

    if (Object.keys(body).some((field) => !taskFields.includes(field))) {
        return { error: 'Only title, durationDays, status, notes and dependsOn are allowed' }
    }

    const input = {}

    if ('title' in body) {
        if (typeof body.title !== 'string' || !body.title.trim()) {
            return { error: 'Title is required' }
        }
        input.title = body.title.trim()
    }
    else if (isCreate) {
        return { error: 'Title is required' }
    }

    if ('durationDays' in body) {
        if (!Number.isInteger(body.durationDays) || body.durationDays < 1 || body.durationDays > 365) {
            return { error: 'Duration must be an integer from 1 to 365 days' }
        }
        input.durationDays = body.durationDays
    }
    else if (isCreate) {
        return { error: 'Duration must be an integer from 1 to 365 days' }
    }

    if ('status' in body) {
        if (!validStatuses.includes(body.status)) {
            return { error: 'Status must be todo, doing or done' }
        }
        input.status = body.status
    }

    if ('notes' in body) {
        if (typeof body.notes !== 'string') {
            return { error: 'Notes must be a string' }
        }
        input.notes = body.notes.trim()
    }

    if ('dependsOn' in body) {
        if (!Array.isArray(body.dependsOn) || !body.dependsOn.every(isValidId)) {
            return { error: 'Dependencies must be a list of task ids' }
        }
        input.dependsOn = [...new Set(body.dependsOn.map((id) => id.toLowerCase()))]
    }

    return { input }
}

const findOwnedProject = async (projectId, ownerId) => {
    if (!isValidId(projectId)) {
        return { error: 'Invalid project id', status: 400 }
    }

    const project = await Project.findOne({ _id: projectId, owner: ownerId })
    return project ? { project } : { error: 'Project not found', status: 404 }
}

const findOwnedTask = async (taskId, ownerId) => {
    if (!isValidId(taskId)) {
        return { error: 'Invalid task id', status: 400 }
    }

    const task = await Task.findById(taskId)
    if (!task) {
        return { error: 'Task not found', status: 404 }
    }

    const project = await Project.findOne({ _id: task.project, owner: ownerId })
    return project ? { task } : { error: 'Task not found', status: 404 }
}

// check the dependencies of a task, task is null while a new task is being created
const checkDependencies = async (projectId, dependsOn, task) => {
    if (task && dependsOn.includes(String(task._id))) {
        return { error: 'A task cannot depend on itself' }
    }

    const projectTasks = await Task.find({ project: projectId }).sort({ createdAt: 1, _id: 1 })
    const projectTaskIds = projectTasks.map((item) => String(item._id))

    if (dependsOn.some((id) => !projectTaskIds.includes(id))) {
        return { error: 'Dependencies must belong to the same project' }
    }

    // a new task cannot be part of a circle yet
    if (!task) {
        return {}
    }

    const graph = projectTasks.map((item) => ({
        id: String(item._id),
        title: item.title,
        dependsOn: String(item._id) === String(task._id) ? dependsOn : item.dependsOn.map(String),
    }))

    const cycle = findCycle(graph)
    if (cycle) {
        const titles = cycle.map((id) => graph.find((item) => item.id === id).title)
        return { error: `Circular dependency: ${[...titles, titles[0]].join(' -> ')}` }
    }

    return {}
}

// create task

const createTask = async (req, res) => {
    try {
        const projectResult = await findOwnedProject(req.params.projectId, req.user._id)
        if (projectResult.error) {
            return res.status(projectResult.status).json({ success: false, message: projectResult.error })
        }

        const { input, error } = getTaskInput(req.body ?? {}, true)
        if (error) {
            return res.status(400).json({ success: false, message: error })
        }

        const dependsOn = input.dependsOn || []
        if (dependsOn.length > 0) {
            const dependencyResult = await checkDependencies(projectResult.project._id, dependsOn, null)
            if (dependencyResult.error) {
                return res.status(400).json({ success: false, message: dependencyResult.error })
            }
        }

        const task = await Task.create({
            ...input,
            project: projectResult.project._id,
            dependsOn,
        })
        return res.status(201).json({ success: true, task })
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Unable to create task', error: err.message })
    }
}

// list tasks of a project

const listTasks = async (req, res) => {
    try {
        const projectResult = await findOwnedProject(req.params.projectId, req.user._id)
        if (projectResult.error) {
            return res.status(projectResult.status).json({ success: false, message: projectResult.error })
        }

        const tasks = await Task.find({ project: projectResult.project._id }).sort({ createdAt: 1, _id: 1 })
        return res.status(200).json({ success: true, tasks })
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Unable to load tasks', error: err.message })
    }
}

// update task

const updateTask = async (req, res) => {
    try {
        const taskResult = await findOwnedTask(req.params.id, req.user._id)
        if (taskResult.error) {
            return res.status(taskResult.status).json({ success: false, message: taskResult.error })
        }

        const { input, error } = getTaskInput(req.body ?? {}, false)
        if (error) {
            return res.status(400).json({ success: false, message: error })
        }

        if (input.dependsOn) {
            const dependencyResult = await checkDependencies(taskResult.task.project, input.dependsOn, taskResult.task)
            if (dependencyResult.error) {
                return res.status(400).json({ success: false, message: dependencyResult.error })
            }
        }

        Object.assign(taskResult.task, input)
        await taskResult.task.save()
        return res.status(200).json({ success: true, task: taskResult.task })
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Unable to update task', error: err.message })
    }
}

// delete task

const deleteTask = async (req, res) => {
    try {
        const taskResult = await findOwnedTask(req.params.id, req.user._id)
        if (taskResult.error) {
            return res.status(taskResult.status).json({ success: false, message: taskResult.error })
        }

        await taskResult.task.deleteOne()

        // remove the deleted task from the dependencies of the other tasks
        await Task.updateMany(
            { project: taskResult.task.project, dependsOn: taskResult.task._id },
            { $pull: { dependsOn: taskResult.task._id } }
        )

        return res.status(200).json({ success: true, message: 'Task deleted successfully' })
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Unable to delete task', error: err.message })
    }
}

export { createTask, listTasks, updateTask, deleteTask }