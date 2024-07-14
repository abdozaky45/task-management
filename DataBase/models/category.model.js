import { Schema, model, Types } from "mongoose";
const categorySchema = new Schema(
  {
    categoryName: {
      type: String,
      min: 5,
      max: 20,
      required: true,
    },
    slug: { type: String, required: true },
    createdBy: { type: Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true,strictQuery:true ,toJSON: { virtuals: true }, toObject: { virtuals: true } }
);
categorySchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "categoryId"
});
categorySchema.query.paginate = function (page) {
  page = !page || page < 1 || isNaN(page) ? 1 : page;
  const limit = 5;
  const skip = limit * (page - 1);
  // this >>>>> query
  // return query
  return this.skip(skip).limit(limit);
}
export const categoryModel = model("Category", categorySchema);
