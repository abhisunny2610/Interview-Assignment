import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    videoId: { type: String, required: true, index: true },
    actorKey: { type: String, required: true, index: true },
    reaction: { type: String, enum: ["like", "dislike"], required: true }
  },
  { timestamps: true }
);

reactionSchema.index({ videoId: 1, actorKey: 1 }, { unique: true });

export const Reaction = mongoose.model("Reaction", reactionSchema);
