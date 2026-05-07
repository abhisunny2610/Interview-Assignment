import mongoose from "mongoose";

const engagementSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true, unique: true, index: true },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Engagement = mongoose.model("Engagement", engagementSchema);
