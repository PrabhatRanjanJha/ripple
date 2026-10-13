import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
} from "../controllers/task.controllers.js";
import { getSchedule, simulateSchedule } from "../controllers/schedule.controllers.js";
import {
  createScenario,
  deleteScenario,
  listScenarios,
  runScenario,
} from "../controllers/scenario.controllers.js";

const router = express.Router();

router.route("/projects/:projectId/tasks")
  .post(authMiddleware, createTask)
  .get(authMiddleware, listTasks);
router.route("/tasks/:id")
  .patch(authMiddleware, updateTask)
  .delete(authMiddleware, deleteTask);
router.get("/projects/:id/schedule", authMiddleware, getSchedule);
router.post("/projects/:id/simulate", authMiddleware, simulateSchedule);
router.route("/projects/:id/scenarios")
  .post(authMiddleware, createScenario)
  .get(authMiddleware, listScenarios);
router.get("/scenarios/:id/run", authMiddleware, runScenario);
router.delete("/scenarios/:id", authMiddleware, deleteScenario);

export default router;
