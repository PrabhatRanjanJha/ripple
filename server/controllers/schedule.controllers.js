import Project from '../model/project.model.js'
import { computeSchedule, simulate } from '../utils/scheduler.js'
import { loadSchedulingData } from '../utils/projectData.js'
import { formatDay } from '../utils/dates.js'
import { checkChanges } from '../utils/changes.js'

const isValidId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)

// find a project of the logged in user
const findOwnedProject = async (projectId, ownerId) => {
    if (!isValidId(projectId)) {
        return { error: 'Invalid project id', status: 400 }
    }

    const project = await Project.findOne({ _id: projectId, owner: ownerId })
    return project ? { project } : { error: 'Project not found', status: 404 }
}

// get the schedule of a project

const getSchedule = async (req, res) => {
    try {
        const projectResult = await findOwnedProject(req.params.id, req.user._id)
        if (projectResult.error) {
            return res.status(projectResult.status).json({ success: false, message: projectResult.error })
        }

        const data = await loadSchedulingData(projectResult.project)
        const schedule = computeSchedule({ ...data, today: formatDay(new Date()) })
        return res.status(200).json({ success: true, schedule })
    }
    catch (err) {
        if (err.cycle) {
            return res.status(400).json({ success: false, message: 'Circular dependency found' })
        }
        return res.status(500).json({ success: false, message: 'Unable to calculate the schedule', error: err.message })
    }
}

// run a what-if on a project, nothing is saved

const simulateSchedule = async (req, res) => {
    try {
        const projectResult = await findOwnedProject(req.params.id, req.user._id)
        if (projectResult.error) {
            return res.status(projectResult.status).json({ success: false, message: projectResult.error })
        }

        const data = await loadSchedulingData(projectResult.project)
        const { changes, error } = checkChanges(req.body?.changes, data.tasks.map((task) => task.id))
        if (error) {
            return res.status(400).json({ success: false, message: error })
        }

        const result = simulate({ ...data, changes })
        return res.status(200).json({ success: true, ...result })
    }
    catch (err) {
        if (err.cycle) {
            return res.status(400).json({ success: false, message: 'Circular dependency found' })
        }
        return res.status(500).json({ success: false, message: 'Unable to run the what-if', error: err.message })
    }
}

export { getSchedule, simulateSchedule }