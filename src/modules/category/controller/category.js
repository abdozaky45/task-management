import slugify from "slugify";
import { categoryModel } from "../../../../DataBase/models/category.model.js";
import { ApiResponse } from "../../../utils/ApiResponse.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import { ApiError } from "../../../utils/ApiError.js";
// ? CRUD
// ?Create category : 
export const createCategory = asyncHandler(async (req, res) => {
    const category = await categoryModel.create({
        categoryName: req.body.categoryName,
        slug: slugify(req.body.categoryName),
        createdBy: req.user._id
    });
    return res.status(200).json(new ApiResponse(200, { category }, "Category created"))
});
// ? update category 
export const updateCategory = asyncHandler(async (req, res) => {
    const category = await categoryModel.findById(req.params.category_Id)
    if (!category)
        throw new ApiError(400, "InValid categoryId!");
    if (req.user._id.toString() !== category.createdBy.toString())
        throw new ApiError(404, "not authorized !!")
    category.categoryName = req.body.categoryName
        ? req.body.categoryName
        : category.categoryName;
    category.slug = req.body.categoryName
        ? req.body.categoryName
        : category.categoryName
    await category.save();
    return res.status(200).json(new ApiResponse(200, { category }, "category updated"))
});
// ? delete category
export const deleteCategory = asyncHandler(async (req, res) => {
    const category = await categoryModel.findById(req.params.category_Id)
    if (!category)
        throw new ApiError(400, "InValid categoryId!");
    if (req.user._id.toString() !== category.createdBy.toString())
        throw new ApiError(404, "not authorized !!");
    await categoryModel.findByIdAndDelete(req.params.category_Id);
    return res.status(200).json(new ApiResponse(200, {}, "category deleted!"))
});
// ? get all categorys > isSharedTask=Public
export const getAllCategory = asyncHandler(async (req, res) => {
    const category = await categoryModel.find({})
        .select("categoryName slug")
        .populate({
            path: "tasks",
            match: { isSharedTask: "Public" },
            select: "-_id",
            populate: { // Nested populate 
                path: "createdBy",
                select: "-_id userName email"
            }
        })
        .paginate(req.query.page)

    return res.status(200).json(new ApiResponse(200, { category }, "get all categorys"))
});
// ? get all categorys > Pagination , Sorting , Filtering
// http://localhost:3000/category/get/all/?sort=categoryName&page=1&categoryName=projects New 9
export const getAllCategoryFilteringSortingPagination = asyncHandler(async (req, res) => {
    const category = await categoryModel
    .find({ ...req.query })
    .paginate(req.query.page)
    .sort(req.query.sort);

    return res.status(200).json(new ApiResponse(200, { page: req.query.page, category }, "get all categorys"))
});
