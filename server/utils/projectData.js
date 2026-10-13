import Task from '../model/task.model.js'
import { formatDay } from './dates.js'

// load the tasks of a project in the shape the scheduler needs
const loadSchedulingData = async (project) => {
    const tasks = await Task.find({ project: project._id }).sort({ createdAt: 1, _id: 1 })

    return {
        tasks: tasks.map((task) => ({
            id: String(task._id),
            title: task.title,
            durationDays: task.durationDays,
            status: task.status,
            dependsOn: task.dependsOn.map(String),
        })),
        startDate: formatDay(project.startDate),
        deadline: project.deadline ? formatDay(project.deadline) : null,
    }
}

export { loadSchedulingData }