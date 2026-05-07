import { Router } from "express";
import { getReactions, getVideos, likeVideo, shareVideo } from "../controllers/videoController.js";

const router = Router();

router.get("/videos", getVideos);
router.get("/reactions", getReactions);
router.post("/like", likeVideo);
router.post("/share", shareVideo);

export default router;
