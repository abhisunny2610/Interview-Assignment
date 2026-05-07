import {
  getUserReactions,
  getVideosWithEngagement,
  incrementShare,
  setReaction,
} from "../services/videoService.js";
import { videoMetadata } from "../models/videoMetaModel.js";
import crypto from "crypto";

function isValidVideoId(videoId) {
  return videoMetadata.some((video) => video.id === videoId);
}

export async function getVideos(req, res, next) {
  try {
    const items = await getVideosWithEngagement();
    res.json({ total: items.length, items });
  } catch (error) {
    next(error);
  }
}

export async function likeVideo(req, res, next) {
  try {
    const { videoId, action = "like" } = req.body ?? {};

    if (!videoId || !isValidVideoId(videoId)) {
      return res.status(400).json({ message: "Invalid videoId." });
    }

    if (!["like", "dislike", "none"].includes(action)) {
      return res.status(400).json({
        message: "Invalid action. Use like, dislike or none.",
      });
    }

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "unknown";

    const userAgent = req.headers["user-agent"] || "unknown";

    const actorKey = crypto
      .createHash("sha256")
      .update(ip + userAgent)
      .digest("hex");

    const result = await setReaction({
      videoId,
      actorKey,
      action,
    });

    return res.json({
      videoId,
      likes: result.likes,
      dislikes: result.dislikes,
      userReaction: result.userReaction,
    });
  } catch (error) {
    return next(error);
  }
}

export async function shareVideo(req, res, next) {
  try {
    const { videoId, platform = "copy-link" } = req.body ?? {};
    if (!videoId || !isValidVideoId(videoId)) {
      return res.status(400).json({ message: "Invalid videoId." });
    }

    const result = await incrementShare(videoId);
    return res.json({
      videoId,
      shares: result.shares,
      platform,
      ip: req.ip,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getReactions(req, res, next) {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      "unknown";

    const userAgent = req.headers["user-agent"] || "unknown";

    const actorKey = crypto
      .createHash("sha256")
      .update(ip + userAgent)
      .digest("hex");

    const reactions = await getUserReactions(actorKey);

    return res.json({
      reactions,
    });
  } catch (error) {
    return next(error);
  }
}
