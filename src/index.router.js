import connectDB from "../DataBase/connctionDB.js";
import categoryRouter from "./modules/category/category.router.js";
import taskRouter from "./modules/task/task.router.js";
import userRouter from "./modules/user/user.router.js";
import { globalErrorHandling } from "./utils/errorHandling.js";

export const bootstrap = (app, express) => {
  app.use(express.json());
  app.use("/auth", userRouter);
  app.use("/category", categoryRouter);
  app.use("/tasks", taskRouter)
  app.all("*", (req, res, next) => {
    return next(new Error("in-valid Router!!!", { cause: 404 }));
  });
  connectDB();
  app.use(globalErrorHandling);
};
