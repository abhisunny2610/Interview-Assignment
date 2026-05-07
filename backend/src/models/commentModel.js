import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true, index: true },
    actorKey: { type: String, required: true, index: true },
    message: { type: String, required: true }
  },
  { timestamps: true }
);

export const Comment = mongoose.model("Comment", commentSchema);

