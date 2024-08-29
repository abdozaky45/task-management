import { Router } from "express";
import * as userController from "./controller/user.js";
import { validation } from "../../middleware/validation.middleware.js";
import * as validate from "./userValidation.js";
import { auth } from "../../middleware/authentication.middleware.js";
import { autherized } from "../../middleware/authorization.middleware.js";
const router = Router();
// register
router.post(
  "/register",
  validation(validate.registerSchema),
  userController.register
);
// Active account
router.get(
  "/confirmEmail/:activationCode",
  validation(validate.activeCode),
  userController.activationAccount
);
//login
router.post("/login", validation(validate.loginSchema), userController.login);
// soical login 
router.post("/signupOrloginWithGamil",userController.signupOrloginWithGamil);
//logout
router.post("/logout/_:id",auth,autherized("user"),validation(validate.logout),userController.logout);
// Access token refreshed
router.post("/refreshToken",userController.refreshAccessToken);
// send code forget Password
router.patch(
  "/forget",
  validation(validate.forgetPass),
  userController.forgetPass
);
// reset Password
router.patch(
  "/resetPassword",
  validation(validate.resetPassword),
  userController.resetPassword
);
export default router;
