import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from "../controllers/project.controllers.js";

const router = express.Router();

router.use(authMiddleware);
router.route("/").post(createProject).get(listProjects);
router.route("/:id").get(getProject).patch(updateProject).delete(deleteProject);

export default router;
