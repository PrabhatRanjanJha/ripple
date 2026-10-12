import Project from '../model/project.model.js'
import Task from '../model/task.model.js'
import { computeSchedule } from '../utils/scheduler.js'
import { formatDay } from '../utils/dates.js'

const isValidId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)

// get the schedule of a project

const getSchedule = async (req, res) => {
    try {
        if (!isValidId(req.params.id)) {
            return res.status(400).json({ success: false, message: 'Invalid project id' })
        }

        const project = await Project.findOne({ _id: req.params.id, owner: req.user._id })
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' })
        }

        const tasks = await Task.find({ project: project._id }).sort({ createdAt: 1, _id: 1 })
        const schedule = computeSchedule({
            tasks: tasks.map((task) => ({
                id: String(task._id),
                title: task.title,
                durationDays: task.durationDays,
                status: task.status,
                dependsOn: task.dependsOn.map(String),
            })),
            startDate: formatDay(project.startDate),
            deadline: project.deadline ? formatDay(project.deadline) : null,
        })

        return res.status(200).json({ success: true, schedule })
    }
    catch (err) {
        if (err.cycle) {
            return res.status(400).json({ success: false, message: 'Circular dependency found' })
        }
        return res.status(500).json({ success: false, message: 'Unable to calculate the schedule', error: err.message })
    }
}

export { getSchedule }