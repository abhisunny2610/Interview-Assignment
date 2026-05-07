import { Engagement } from "../models/engagementModel.js";
import { Reaction } from "../models/reactionModel.js";
import { videoMetadata } from "../models/videoMetaModel.js";

async function ensureSeededEngagement() {
  const ops = videoMetadata.map((video) => ({
    updateOne: {
      filter: { videoId: video.id },
      update: {
        $setOnInsert: {
          likes: Math.floor(Math.random() * 2000) + 25,
          shares: Math.floor(Math.random() * 250) + 4
        }
      },
      upsert: true
    }
  }));

  await Engagement.bulkWrite(ops);
}

export async function getVideosWithEngagement() {
  await ensureSeededEngagement();
  const [engagementDocs] = await Promise.all([
    Engagement.find({}, { _id: 0, videoId: 1, likes: 1, dislikes: 1, shares: 1 }).lean(),
 
  ]);
  const engagementMap = new Map(engagementDocs.map((doc) => [doc.videoId, doc]));

  return videoMetadata.map((video) => ({
    ...video,
    likes: engagementMap.get(video.id)?.likes ?? 0,
    shares: engagementMap.get(video.id)?.shares ?? 0,
  }));
}

async function updateReactionCounts(videoId) {
  const [likes, dislikes] = await Promise.all([
    Reaction.countDocuments({ videoId, reaction: "like" }),
    Reaction.countDocuments({ videoId, reaction: "dislike" })
  ]);

  const updated = await Engagement.findOneAndUpdate(
    { videoId },
    { $set: { likes, dislikes }, $setOnInsert: { shares: 0 } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      projection: { _id: 0, videoId: 1, likes: 1, dislikes: 1, shares: 1 }
    }
  ).lean();

  return updated;
}

export async function setReaction({ videoId, actorKey, action }) {
  const existing = await Reaction.findOne({ videoId, actorKey }).lean();
  let userReaction = "none";

  if (action === "none") {
    await Reaction.deleteOne({ videoId, actorKey });
  } else if (existing?.reaction === action) {
    await Reaction.deleteOne({ videoId, actorKey });
  } else {
    await Reaction.findOneAndUpdate(
      { videoId, actorKey },
      { $set: { reaction: action } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    userReaction = action;
  }

  if (action !== "none" && existing?.reaction && existing.reaction !== action) {
    userReaction = action;
  }
  if (action === "none" || existing?.reaction === action) {
    userReaction = "none";
  }

  const counts = await updateReactionCounts(videoId);
  return { ...counts, userReaction };
}

export async function incrementShare(videoId) {
  return Engagement.findOneAndUpdate(
    { videoId },
    { $inc: { shares: 1 }, $setOnInsert: { likes: 0 } },
    { upsert: true, new: true, setDefaultsOnInsert: true, projection: { _id: 0, videoId: 1, shares: 1 } }
  ).lean();
}

export async function getUserReactions(actorKey) {
  const reactions = await Reaction.find(
    { actorKey },
    { _id: 0, videoId: 1, reaction: 1 }
  ).lean();

  return reactions;
}

