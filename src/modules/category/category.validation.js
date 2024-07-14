import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.middleware.js";

export const createCategory = joi
  .object({
    categoryName: joi.string().min(5).max(20).required(),
  })
  .required();

export const updateCategory = joi.object({
  category_Id:joi.string().custom(isValidObjectId).required(),
  categoryName:joi.string().min(5).max(20).required(),
}).required();

export const deleteCategory = joi.object({
  category_Id:joi.string().custom(isValidObjectId).required(),
}).required();