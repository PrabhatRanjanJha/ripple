import Project from "../model/project.model.js";
import Task from "../model/task.model.js";

const projectFields = ["title", "description", "startDate", "deadline"];

function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
}

function isValidId(id) {
  return typeof id === "string" && /^[a-f\d]{24}$/i.test(id);
}

function badRequest(res, message) {
  return res.status(400).json({ success: false, message });
}

function getProjectInput(body, currentProject = null) {
  const input = {};

  if ("title" in body) {
    if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 100) {
      return { error: "Title is required and must be 100 characters or fewer" };
    }
    input.title = body.title.trim();
  } else if (!currentProject) {
    return { error: "Title is required and must be 100 characters or fewer" };
  }

  if ("description" in body) {
    if (typeof body.description !== "string") {
      return { error: "Description must be a string" };
    }
    input.description = body.description.trim();
  }

  if ("startDate" in body) {
    const startDate = parseDate(body.startDate);
    if (!startDate) {
      return { error: "Start date must be a valid YYYY-MM-DD date" };
    }
    input.startDate = startDate;
  } else if (!currentProject) {
    return { error: "Start date must be a valid YYYY-MM-DD date" };
  }

  if ("deadline" in body) {
    if (body.deadline === null || body.deadline === "") {
      input.deadline = null;
    } else {
      const deadline = parseDate(body.deadline);
      if (!deadline) {
        return { error: "Deadline must be a valid YYYY-MM-DD date" };
      }
      input.deadline = deadline;
    }
  }

  const startDate = input.startDate ?? currentProject?.startDate;
  const deadline = input.deadline === undefined ? currentProject?.deadline : input.deadline;
  if (deadline && deadline < startDate) {
    return { error: "Deadline cannot be before the start date" };
  }

  return { input };
}

function hasUnexpectedFields(body) {
  return Object.keys(body).some((field) => !projectFields.includes(field));
}

export async function createProject(req, res, next) {
  try {
    const body = req.body ?? {};
    if (typeof body !== "object" || Array.isArray(body)) {
      return badRequest(res, "Project details must be a JSON object");
    }
    if (hasUnexpectedFields(body)) {
      return badRequest(res, "Only title, description, startDate and deadline are allowed");
    }

    const { input, error } = getProjectInput(body);
    if (error) {
      return badRequest(res, error);
    }

    const project = await Project.create({ ...input, owner: req.user._id });
    return res.status(201).json({ success: true, project });
  } catch (error) {
    return next(error);
  }
}

export async function listProjects(req, res, next) {
  try {
    const projects = await Project.find({ owner: req.user._id }).sort({ createdAt: -1 });
    const projectIds = projects.map((project) => project._id);
    const taskCounts = await Task.aggregate([
      { $match: { project: { $in: projectIds } } },
      { $group: { _id: "$project", count: { $sum: 1 } } },
    ]);
    const countByProject = new Map(taskCounts.map(({ _id, count }) => [String(_id), count]));
    const projectsWithCounts = projects.map((project) => ({
      ...project.toObject(),
      taskCount: countByProject.get(String(project._id)) || 0,
    }));
    return res.status(200).json({ success: true, projects: projectsWithCounts });
  } catch (error) {
    return next(error);
  }
}

export async function getProject(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return badRequest(res, "Invalid project id");
    }

    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    return res.status(200).json({ success: true, project });
  } catch (error) {
    return next(error);
  }
}

export async function updateProject(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return badRequest(res, "Invalid project id");
    }

    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const body = req.body ?? {};
    if (typeof body !== "object" || Array.isArray(body)) {
      return badRequest(res, "Project details must be a JSON object");
    }
    if (hasUnexpectedFields(body)) {
      return badRequest(res, "Only title, description, startDate and deadline are allowed");
    }

    const { input, error } = getProjectInput(body, project);
    if (error) {
      return badRequest(res, error);
    }

    Object.assign(project, input);
    await project.save();
    return res.status(200).json({ success: true, project });
  } catch (error) {
    return next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    if (!isValidId(req.params.id)) {
      return badRequest(res, "Invalid project id");
    }

    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    return res.status(200).json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    return next(error);
  }
}
