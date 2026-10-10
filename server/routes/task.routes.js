import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from "../controllers/task.controllers.js";

const router = express.Router();

router.route("/projects/:projectId/tasks")
  .post(authMiddleware, createTask)
  .get(authMiddleware, listTasks);
router.route("/tasks/:id")
  .patch(authMiddleware, updateTask)
  .delete(authMiddleware, deleteTask);

export default router;
