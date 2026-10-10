import Project from "../model/project.model.js";
import Task from "../model/task.model.js";

const taskFields = ["title", "durationDays", "status", "notes", "dependsOn"];
const validStatuses = ["todo", "doing", "done"];

function isValidId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

function badRequest(res, message) {
  return res.status(400).json({ success: false, message });
}

function getTaskInput(body, isCreate) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Task details must be a JSON object" };
  }

  if (Object.keys(body).some((field) => !taskFields.includes(field))) {
    return { error: "Only title, durationDays, status, notes and dependsOn are allowed" };
  }

  const input = {};

  if ("title" in body) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return { error: "Title is required" };
    }
    input.title = body.title.trim();
  } else if (isCreate) {
    return { error: "Title is required" };
  }

  if ("durationDays" in body) {
    if (!Number.isInteger(body.durationDays) || body.durationDays < 1 || body.durationDays > 365) {
      return { error: "Duration must be an integer from 1 to 365 days" };
    }
    input.durationDays = body.durationDays;
  } else if (isCreate) {
    return { error: "Duration must be an integer from 1 to 365 days" };
  }

  if ("status" in body) {
    if (!validStatuses.includes(body.status)) {
      return { error: "Status must be todo, doing or done" };
    }
    input.status = body.status;
  }

  if ("notes" in body) {
    if (typeof body.notes !== "string") {
      return { error: "Notes must be a string" };
    }
    input.notes = body.notes.trim();
  }

  return { input };
}

async function findOwnedProject(projectId, ownerId) {
  if (!isValidId(projectId)) {
    return { error: "Invalid project id", status: 400 };
  }

  const project = await Project.findOne({ _id: projectId, owner: ownerId });
  return project ? { project } : { error: "Project not found", status: 404 };
}

export async function createTask(req, res, next) {
  try {
    const projectResult = await findOwnedProject(req.params.projectId, req.user._id);
    if (projectResult.error) {
      if (projectResult.status === 400) {
        return badRequest(res, projectResult.error);
      }
      return res.status(projectResult.status).json({ success: false, message: projectResult.error });
    }

    const { input, error } = getTaskInput(req.body ?? {}, true);
    if (error) {
      return badRequest(res, error);
    }

    const task = await Task.create({
      ...input,
      project: projectResult.project._id,
      dependsOn: [],
    });
    return res.status(201).json({ success: true, task });
  } catch (error) {
    return next(error);
  }
}

export async function listTasks(req, res, next) {
  try {
    const projectResult = await findOwnedProject(req.params.projectId, req.user._id);
    if (projectResult.error) {
      if (projectResult.status === 400) {
        return badRequest(res, projectResult.error);
      }
      return res.status(projectResult.status).json({ success: false, message: projectResult.error });
    }

    const tasks = await Task.find({ project: projectResult.project._id }).sort({ createdAt: 1, _id: 1 });
    return res.status(200).json({ success: true, tasks });
  } catch (error) {
    return next(error);
  }
}

async function findOwnedTask(taskId, ownerId) {
  if (!isValidId(taskId)) {
    return { error: "Invalid task id", status: 400 };
  }

  const task = await Task.findById(taskId);
  if (!task) {
    return { error: "Task not found", status: 404 };
  }

  const project = await Project.findOne({ _id: task.project, owner: ownerId });
  return project ? { task } : { error: "Task not found", status: 404 };
}

export async function updateTask(req, res, next) {
  try {
    const taskResult = await findOwnedTask(req.params.id, req.user._id);
    if (taskResult.error) {
      if (taskResult.status === 400) {
        return badRequest(res, taskResult.error);
      }
      return res.status(taskResult.status).json({ success: false, message: taskResult.error });
    }

    const { input, error } = getTaskInput(req.body ?? {}, false);
    if (error) {
      return badRequest(res, error);
    }

    Object.assign(taskResult.task, input);
    await taskResult.task.save();
    return res.status(200).json({ success: true, task: taskResult.task });
  } catch (error) {
    return next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const taskResult = await findOwnedTask(req.params.id, req.user._id);
    if (taskResult.error) {
      if (taskResult.status === 400) {
        return badRequest(res, taskResult.error);
      }
      return res.status(taskResult.status).json({ success: false, message: taskResult.error });
    }

    await taskResult.task.deleteOne();
    return res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    return next(error);
  }
}
