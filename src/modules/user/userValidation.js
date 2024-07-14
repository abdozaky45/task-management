import joi from "joi";
import { isValidObjectId } from "../../middleware/validation.middleware.js";
export const registerSchema = joi
  .object({
    userName: joi.string().min(3).max(22).required(),
    email: joi
      .string()
      .email({ maxDomainSegments: 2, tlds: { allow: ["com", "net"] } })
      .required(),
    password: joi.string().pattern(RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
    confirmPassword: joi.string().valid(joi.ref("password")).required(),
  })
  .required();
export const activeCode = joi
  .object({
    activationCode: joi.string().required()
  })
  .required();
export const loginSchema = joi
  .object({
    userName: joi
      .string().required(),
    password: joi.string().required()
  })
  .required();
  export const logout = joi.object({
    _id: joi.string().custom(isValidObjectId).required()
  });
export const forgetPass = joi
  .object({
    email: joi
      .string().required()
  })
  .required();
export const resetPassword = joi
  .object({
    forgetCode: joi.string().length(4).required(),
    email: joi
      .string().required(),
    password: joi.string().pattern(RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
    confirmPassword: joi.string().valid(joi.ref("password")).required()
  })
  .required();
