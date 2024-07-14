import { query } from "express";
import { categoryModel } from "../../../../DataBase/models/category.model.js";
import { taskModel } from "../../../../DataBase/models/task.model.js";
import { ApiError } from "../../../utils/ApiError.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
/*
    update > 
    - update oneTask: Handles updating a single task (typesTasks: 'text').
    - listTask: Handles updating multiple tasks within a list (typesTasks: 'list').
    - addTasksWithinMultipleTasks: Handles adding tasks to a list of tasks (typesTasks: 'list').
    - updateTask: Handles updating an existing task, either a single task or a list of tasks.
    delete >
    - Delete Task: Handles deletion of a single task based on its ID (task_id).
    - Delete Tasks Within Multiple Tasks: Handles deletion of tasks within a list of tasks
      based on their IDs (task_id).
*/
// ? CRUD
// ? create task
export const createTask = asyncHandler(async (req, res) => {
    const { typesTasks, isSharedTask, oneTask, listTask } = req.body
    const category = await categoryModel.findById(req.params.categoryId);
    if (!category)
        throw new ApiError(400, "InValid categoryId");
    if (typesTasks == "list") {
        // !This is to avoid tasks not being submitted
        if (!listTask || !Array.isArray(listTask) || listTask.length === 0) {
            throw new ApiError(400, "List task cannot be empty");
        }
        const tasks = await taskModel.create({
            typesTasks,
            isSharedTask,
            listTask,
            createdBy: req.user._id,
            categoryId: req.params.categoryId
        });
        return res.status(200).json(new ApiResponse(200, { tasks }, "Tasks added!"))
    }
    if (typesTasks == "text") {
        // !This is to avoid task not being submitted
        if (!oneTask || oneTask.trim() === "") {
            throw new ApiError(400, "Text task cannot be empty");
        }
        const task = await taskModel.create({
            typesTasks,
            isSharedTask,
            oneTask,
            createdBy: req.user._id,
            categoryId: req.params.categoryId
        });
        const isTask = await taskModel.findById(task._id).select("-listTask")
        return res.status(200).json(new ApiResponse(200, { isTask }, "Task added!"))
    }
});
// ? update one Task Or ListTask
export const updateTask = asyncHandler(async (req, res) => {
    const { typesTasks, isSharedTask, oneTask, listTask } = req.body
    const task = await taskModel.findById(req.params.task_id);
    if (!task) {
        throw new ApiError(400, "InValid taskId!");
    }
    if (req.user._id.toString() !== task.createdBy.toString()) {
        throw new ApiError(404, "not authorized !!");
    }
    if (typesTasks == "text") {
        if (!oneTask || oneTask.trim() === "") {
            throw new ApiError(400, "Text task cannot be empty");
        }
        task.isSharedTask = isSharedTask
            ? isSharedTask
            : task.isSharedTask
        task.oneTask = oneTask
            ? oneTask
            : task.oneTask
        await task.save();
        return res.status(200).json(new ApiResponse(200, { task }, "task updated"));
    }
    if (typesTasks == "list") {

        task.isSharedTask = isSharedTask
            ? isSharedTask
            : task.isSharedTask
        const tasks = listTask.map(async task => {
            if (!task._id || !task.text) {
                throw new ApiError(400, "Data is required!");
            }
            await taskModel.findOneAndUpdate(
                { 'listTask._id': task._id },
                { $set: { 'listTask.$.text': task.text } },
                { new: true }
            );
        });
        // !Waiting for a task to update, then another task, and so on, and then updating the entire object
        await Promise.all(tasks);
        return res.status(200).json(new ApiResponse(200, { task }, "tasks updated"));
    }
});
// ? addTasksWithinMultipleTasks
export const addTasksWithinMultipleTasks = asyncHandler(async (req, res) => {
    const { listTask } = req.body
    const isTask = await taskModel.findById(req.params.task_id);
    if (!isTask) {
        throw new ApiError(400, "InValid taskId!");
    }
    if (req.user._id.toString() !== isTask.createdBy.toString())
        throw new ApiError(404, "not authorized !!");
    const tasks = listTask.map(async task => {
        if (!task.text) {
            throw new ApiError(400, "Data is required!");
        }
        await taskModel.findByIdAndUpdate(
            req.params.task_id,
            {
                $push: { listTask: { text: task.text } },
            },
            { new: true }
        );
    });
    await Promise.all(tasks);
    return res.status(200).json(new ApiResponse(200, { isTask }, "added Tasks Within Multiple Tasks"));
});
// ?Delete Task
export const deleteTask = asyncHandler(async (req, res) => {
    const task = await taskModel.findById(req.params.task_id);
    if (!task)
        throw new ApiError(400, "InValid taskId!");
    if (req.user._id.toString() !== task.createdBy.toString())
        throw new ApiError(404, "not authorized !!");
    await taskModel.findByIdAndDelete(req.params.task_id)
    return res.status(200).json(new ApiResponse(200, {}, "task deleted!"));
});
// ? delete tasks within multiple tasks
export const deleteTasksWithinMultipleTasks = asyncHandler(async (req, res) => {
    const { listTask } = req.body
    const isTask = await taskModel.findById(req.params.task_id);
    if (!isTask) {
        throw new ApiError(400, "InValid taskId!");
    }
    if (req.user._id.toString() !== isTask.createdBy.toString())
        throw new ApiError(404, "not authorized !!");
    const tasks = listTask.map(async task => {
        if (!task._id) {
            throw new ApiError(400, "Data is required!");
        }
        await taskModel.findOneAndUpdate(
            { "listTask._id": task._id },
            {
                $pull: { listTask: { _id: task._id } }
            },
            { new: true }
        );
    });
    await Promise.all(tasks);
    return res.status(200).json(new ApiResponse(200, { isTask }, "task deleted!"));
});
/*
Tasks can be shared (visible to all users and unauthenticated 
viewers) or private (visible only to the creator)
 */
export const getAllTasks = asyncHandler(async (req, res) => {
    const tasks = await taskModel
        .find({ isSharedTask: "Public" })
        .select("-_id")
        .populate({ path: "categoryId", select: "categoryName slug" })
        .populate({ path: "createdBy", select: "-_id userName email" });
    return res.status(200).json(new ApiResponse(200, { results: tasks }, "all Tasks"))

});
export const getTasksVisibleOnlyCreator = asyncHandler(async (req, res) => {
    const tasks = await taskModel.find({ createdBy: req.params._id })
        .select("-_id")
        .populate({ path: "categoryId", select: "categoryName slug" })
        .populate({ path: "createdBy", select: "-_id userName email" });
    return res.status(200).json(new ApiResponse(200, { results: tasks }, "all Tasks"))
});
// ? get all Tasks > Pagination , Sorting , Filtering
//http://localhost:3000/tasks/all?page=1&sort=isSharedTask
export const getAllTasksFilteringSortingPagination = asyncHandler(async (req, res) => {
    const tasks = await taskModel
        .find({})
        .paginate(req.query.page)
        .sort(req.query.sort);


    return res.status(200).json(new ApiResponse(200, { page: req.query.page, tasks }, "get all tasks"))
});