import { Schema, model, Types } from "mongoose";
const taskSchema = new Schema(
    {
        typesTasks: { type: String, enum: ["text", "list"], required: true, },
        //! isPublicTask visible to all users  or private visible only to the creator
        isSharedTask: { type: String, enum: ['Public', 'Private'], required: true },
        oneTask: { type: String },
        listTask: [{ text: { type: String } }],
        createdBy: { type: Types.ObjectId, ref: "User", required: true },
        categoryId: { type: Types.ObjectId, ref: "Category", required: true }
    },
    { timestamps: true }
);
taskSchema.pre('save', function (next) {
    if (this.typesTasks === 'list' && this.listTask && this.listTask.length > 0) {
        this.listTask.forEach((task, index) => {
            task.id = index + 1;
        });
    }
    next();
});
taskSchema.query.paginate = function (page) {
    page = !page || page < 1 || isNaN(page) ? 1 : page;
    const limit = 5;
    const skip = limit * (page - 1);
    // this >>>>> query
    // return query
    return this.skip(skip).limit(limit);
}
export const taskModel = model("Task", taskSchema);
