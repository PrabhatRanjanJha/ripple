import Project from '../model/project.model.js'
import Scenario from '../model/scenario.model.js'
import { simulate } from '../utils/scheduler.js'
import { loadSchedulingData } from '../utils/projectData.js'
import { checkChanges } from '../utils/changes.js'

const isValidId = (id) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)

const findOwnedProject = async (projectId, ownerId) => {
    if (!isValidId(projectId)) {
        return { error: 'Invalid project id', status: 400 }
    }

    const project = await Project.findOne({ _id: projectId, owner: ownerId })
    return project ? { project } : { error: 'Project not found', status: 404 }
}

const findOwnedScenario = async (scenarioId, ownerId) => {
    if (!isValidId(scenarioId)) {
        return { error: 'Invalid scenario id', status: 400 }
    }

    const scenario = await Scenario.findById(scenarioId)
    if (!scenario) {
        return { error: 'Scenario not found', status: 404 }
    }

    const project = await Project.findOne({ _id: scenario.project, owner: ownerId })
    return project ? { scenario, project } : { error: 'Scenario not found', status: 404 }
}

// turn a saved scenario into plain data for the client
const publicScenario = (scenario) => ({
    _id: scenario._id,
    project: scenario.project,
    name: scenario.name,
    changes: scenario.changes.map((change) => ({ taskId: String(change.taskId), deltaDays: change.deltaDays })),
    createdAt: scenario.createdAt,
})

// save a scenario

const createScenario = async (req, res) => {
    try {
        const projectResult = await findOwnedProject(req.params.id, req.user._id)
        if (projectResult.error) {
            return res.status(projectResult.status).json({ success: false, message: projectResult.error })
        }

        const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
        if (!name || name.length > 60) {
            return res.status(400).json({ success: false, message: 'Scenario name is required (up to 60 characters)' })
        }

        const data = await loadSchedulingData(projectResult.project)
        const { changes, error } = checkChanges(req.body.changes, data.tasks.map((task) => task.id))
        if (error) {
            return res.status(400).json({ success: false, message: error })
        }
        if (changes.length === 0) {
            return res.status(400).json({ success: false, message: 'Add at least one change to the scenario' })
        }

        const scenario = await Scenario.create({ project: projectResult.project._id, name, changes })
        return res.status(201).json({ success: true, scenario: publicScenario(scenario) })
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Unable to save the scenario', error: err.message })
    }
}

// list the scenarios of a project

const listScenarios = async (req, res) => {
    try {
        const projectResult = await findOwnedProject(req.params.id, req.user._id)
        if (projectResult.error) {
            return res.status(projectResult.status).json({ success: false, message: projectResult.error })
        }

        const scenarios = await Scenario.find({ project: projectResult.project._id }).sort({ createdAt: -1, _id: -1 })
        return res.status(200).json({ success: true, scenarios: scenarios.map(publicScenario) })
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Unable to load the scenarios', error: err.message })
    }
}

// run a saved scenario, changes that point to deleted tasks are ignored

const runScenario = async (req, res) => {
    try {
        const scenarioResult = await findOwnedScenario(req.params.id, req.user._id)
        if (scenarioResult.error) {
            return res.status(scenarioResult.status).json({ success: false, message: scenarioResult.error })
        }

        const data = await loadSchedulingData(scenarioResult.project)
        const taskIds = data.tasks.map((task) => task.id)
        const changes = scenarioResult.scenario.changes
            .map((change) => ({ taskId: String(change.taskId), deltaDays: change.deltaDays }))
            .filter((change) => taskIds.includes(change.taskId))

        const result = simulate({ ...data, changes })
        return res.status(200).json({ success: true, scenario: publicScenario(scenarioResult.scenario), ...result })
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Unable to run the scenario', error: err.message })
    }
}

// delete a scenario

const deleteScenario = async (req, res) => {
    try {
        const scenarioResult = await findOwnedScenario(req.params.id, req.user._id)
        if (scenarioResult.error) {
            return res.status(scenarioResult.status).json({ success: false, message: scenarioResult.error })
        }

        await scenarioResult.scenario.deleteOne()
        return res.status(200).json({ success: true, message: 'Scenario deleted successfully' })
    }
    catch (err) {
        return res.status(500).json({ success: false, message: 'Unable to delete the scenario', error: err.message })
    }
}

export { createScenario, listScenarios, runScenario, deleteScenario }