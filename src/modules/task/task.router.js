import { Router } from "express";
import *as TaskController from "./controller/task.js";
import { auth } from "../../middleware/authentication.middleware.js";
import { autherized } from "../../middleware/authorization.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validate from "./task.validation.js";
const router = Router();
router.post(
  "/addTask/:categoryId",
  auth,
  autherized("user"),
  validation(validate.addTask),
  TaskController.createTask
);
router.patch(
  "/update/:task_id",
  auth,
  autherized("user"),
  validation(validate.updateTask),
  TaskController.updateTask
);
router.patch(
  "/update/add/:task_id",
  auth,
  autherized("user"),
  validation(validate.addTasksWithinMultipleTasks),
  TaskController.addTasksWithinMultipleTasks
);
router.delete(
  "/delete/:task_id",
  auth,
  autherized("user"),
  validation(validate.deleteTask),
  TaskController.deleteTask
);
router.patch(
  "/delete/multipleTasks/:task_id",
  auth,
  autherized("user"),
  validation(validate.deleteTasksWithinMultipleTasks),
  TaskController.deleteTasksWithinMultipleTasks
);
router.get("/getAll", TaskController.getAllTasks);
router.get(
  "/get/VisibleOnlyCreator/:_id",
  validation(validate.getTasksWithUser),
  TaskController.getTasksVisibleOnlyCreator
);
router.get(
  "/all",
  TaskController.getAllTasksFilteringSortingPagination
);
export default router;
