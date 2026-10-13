
import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "" },
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending", index: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium", index: true },
    dueDate: { type: Date, default: null, index: true },
    completedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

todoSchema.index({ status: 1, createdAt: -1 });
todoSchema.index({ priority: 1, createdAt: -1 });

const Todo = mongoose.model("Todo", todoSchema);
export default Todo;
