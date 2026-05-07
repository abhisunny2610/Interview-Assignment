import { useEffect, useMemo, useRef, useState } from "react";
import { fetchUserReactions, getOrCreateUserId, reactVideo, shareVideo } from "../../api.js";

export default function InnerCarousel({ videos, startIndex = 0 }) {
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [likedVideos, setLikedVideos] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [loading, setLoading] = useState({});
  const [progress, setProgress] = useState({});
  const [comments, setComments] = useState({});
  const [showCommentsFor, setShowCommentsFor] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");

  const videoRefs = useRef([]);
  const touchStartX = useRef(0);

  const userId = useMemo(() => getOrCreateUserId(), []);

  useEffect(() => {
    setActiveIndex(startIndex);
  }, [startIndex]);

  // Hydrate likes from backend so refresh keeps state
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const reactions = await fetchUserReactions(userId);
        if (cancelled) return;

        const liked = {};
        for (const r of reactions) {
          if (r?.reaction === "like" && r.videoId) liked[r.videoId] = true;
        }
        setLikedVideos(liked);
      } catch {
        // ignore - UI will still work (optimistic)
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // PLAY ACTIVE VIDEO
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === activeIndex) {
        video.muted = muted;
        if (isPlaying) {
          video
            .play()
            .catch(() => {});
        } else {
          video.pause();
        }
      } else {
        video.pause();
      }
    });
  }, [activeIndex, muted, isPlaying]);

  // SWIPE SUPPORT
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;

    if (diff > 50) next();
    if (diff < -50) prev();
  };

  const next = () => {
    setActiveIndex((prev) => (prev + 1) % videos.length);
  };

  const prev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? videos.length - 1 : prev - 1
    );
  };

  const togglePlay = () => {
    const currentVideo = videoRefs.current[activeIndex];
    if (!currentVideo) return;

    if (currentVideo.paused) {
      currentVideo
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      currentVideo.pause();
      setIsPlaying(false);
    }
  };

  // LIKE
  const toggleLike = async (videoId) => {
    const optimisticNext = !likedVideos[videoId];

    setLikedVideos((prev) => ({
      ...prev,
      [videoId]: optimisticNext,
    }));

    try {
      const action = optimisticNext ? "like" : "none";
      const res = await reactVideo(videoId, action, userId);
      setLikeCounts((prev) => ({ ...prev, [videoId]: res.likes }));
      setLikedVideos((prev) => ({
        ...prev,
        [videoId]: res.userReaction === "like",
      }));
    } catch {
      // rollback on error
      setLikedVideos((prev) => ({
        ...prev,
        [videoId]: !optimisticNext,
      }));
    }
  };

  // COMMENTS (in-memory, UI only)
  const handleAddComment = (videoId) => {
    const trimmed = commentDraft.trim();
    if (!trimmed) return;

    setComments((prev) => ({
      ...prev,
      [videoId]: [...(prev[videoId] || []), trimmed],
    }));
    setCommentDraft("");
  };

  // SHARE
  const handleShare = async (video) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
      }
      // persist share count in backend (best-effort)
      await shareVideo(video.id);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div
      className="inner-modal"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* LEFT */}
      <button className="nav-btn left" onClick={prev}>
        ←
      </button>

      <div className="carousel-3d">
        {videos.map((video, index) => {
          let position = "hidden";

          if (index === activeIndex) position = "center";
          else if (index === activeIndex - 1) position = "left";
          else if (index === activeIndex + 1) position = "right";

          if (activeIndex === 0 && index === videos.length - 1)
            position = "left";

          if (activeIndex === videos.length - 1 && index === 0)
            position = "right";

          const isLiked = likedVideos[video.id];
          const videoComments = comments[video.id] || [];
          const likeCount =
            typeof likeCounts[video.id] === "number"
              ? likeCounts[video.id]
              : video.likes;

          return (
            <div key={video.id} className={`card ${position}`}>
              
              {/* SPINNER */}
              {loading[index] && (
                <div className="spinner"></div>
              )}

              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={position !== "hidden" ? video.videoUrl : ""}
                className="video"
                loop
                playsInline
                preload="metadata"
                onWaiting={() =>
                  setLoading((p) => ({ ...p, [index]: true }))
                }
                onLoadedData={() =>
                  setLoading((p) => ({ ...p, [index]: false }))
                }
                onTimeUpdate={(e) => {
                  const current =
                    (e.target.currentTime / e.target.duration) * 100;

                  setProgress((p) => ({
                    ...p,
                    [index]: current,
                  }));
                }}
              />

              {/* PROGRESS BAR */}
              {position === "center" && (
                <div className="progress">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${progress[index] || 0}%`,
                    }}
                  />
                </div>
              )}

              {position === "center" && (
                <>
                  {/* CENTER OVERLAY PLAY/PAUSE */}
                  <button
                    className="play-pause-btn"
                    onClick={togglePlay}
                    aria-label={isPlaying ? "Pause video" : "Play video"}
                  >
                    {isPlaying ? "❚❚" : "▶"}
                  </button>

                  {/* RIGHT RAIL ACTIONS (Instagram-style) */}
                  <div className="action-rail">
                    <button
                      className="icon-btn mute-btn"
                      onClick={() => setMuted((m) => !m)}
                      aria-label={muted ? "Unmute" : "Mute"}
                    >
                      {muted ? "🔇" : "🔊"}
                    </button>

                    <button
                      className={`icon-btn like-btn ${
                        isLiked ? "liked" : ""
                      }`}
                      onClick={() => toggleLike(video.id)}
                    >
                      ❤️
                      <span className="count-badge">
                        {likeCount}
                      </span>
                    </button>

                    <button
                      className="icon-btn comment-btn"
                      onClick={() =>
                        setShowCommentsFor((current) =>
                          current === video.id ? null : video.id
                        )
                      }
                    >
                      💬
                      <span className="count-badge">
                        {videoComments.length}
                      </span>
                    </button>

                    <button
                      className="icon-btn share-btn"
                      onClick={() => handleShare(video)}
                    >
                      📤
                    </button>
                  </div>

                  {/* BOTTOM META (TITLE, COMMENTS INPUT) */}
                  <div className="meta-panel">
                    <div className="product-card">
                      <p className="video-title">{video.title}</p>
                    </div>

                    {showCommentsFor === video.id && (
                      <div className="comments-panel">
                        <div className="comments-list">
                          {videoComments.length === 0 ? (
                            <span className="empty-text">
                              No comments yet. Be the first!
                            </span>
                          ) : (
                            videoComments.map((c, i) => (
                              <div key={i} className="comment-item">
                                <span className="comment-text">{c}</span>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="comment-input-row">
                          <input
                            type="text"
                            className="comment-input"
                            value={
                              showCommentsFor === video.id ? commentDraft : ""
                            }
                            placeholder="Add a comment..."
                            onChange={(e) => setCommentDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddComment(video.id);
                              }
                            }}
                          />
                          <button
                            className="comment-send-btn"
                            onClick={() => handleAddComment(video.id)}
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* RIGHT */}
      <button className="nav-btn right" onClick={next}>
        →
      </button>
    </div>
  );
}