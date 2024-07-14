import { Router } from "express";
import * as categoryController from "./controller/category.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validate from "./category.validation.js";
import { auth } from "../../middleware/authentication.middleware.js";
import { autherized } from "../../middleware/authorization.middleware.js";
const router = Router();
router.post(
  "/create",
  auth,
  autherized("user"),
  validation(validate.createCategory),
  categoryController.createCategory
);
router.patch(
  "/update/:category_Id",
  auth,
  autherized("user"),
  validation(validate.updateCategory),
  categoryController.updateCategory
);
router.delete(
  "/delete/:category_Id",
  auth,
  autherized("user"),
  validation(validate.deleteCategory),
  categoryController.deleteCategory
);
router.get("/all" , categoryController.getAllCategory);
router.get("/get/all" , categoryController.getAllCategoryFilteringSortingPagination);
export default router;
