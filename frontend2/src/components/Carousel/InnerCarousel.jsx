import { useEffect, useRef, useState } from "react";

import {
  fetchUserReactions,
  reactVideo,
  shareVideo,
} from "../../api.js";

import {
  IoHeartOutline,
  IoHeart,
  IoPaperPlaneOutline,
  IoVolumeMute,
  IoVolumeHigh,
} from "react-icons/io5";

export default function InnerCarousel({
  videos,
  startIndex = 0,
}) {
  const [activeIndex, setActiveIndex] =
    useState(startIndex);

  const [muted, setMuted] = useState(true);

  const [likedVideos, setLikedVideos] =
    useState({});

  const [likeCounts, setLikeCounts] =
    useState({});

  const [progress, setProgress] =
    useState({});

  const [overlayIcon, setOverlayIcon] =
    useState(null);

  const videoRefs = useRef([]);
  const touchStartX = useRef(0);

  useEffect(() => {
    setActiveIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    let cancelled = false;
  
    (async () => {
      try {
        const reactions =
          await fetchUserReactions();
  
        if (cancelled) return;
  
        const liked = {};
  
        for (const r of reactions) {
          if (
            r?.reaction === "like" &&
            r.videoId
          ) {
            liked[r.videoId] = true;
          }
        }
  
        setLikedVideos(liked);
      } catch (err) {
        console.log(err);
      }
    })();
  
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;

      if (index === activeIndex) {
        video.muted = muted;

        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activeIndex, muted]);

  const onTouchStart = (e) => {
    touchStartX.current =
      e.touches[0].clientX;
  };

  const onTouchEnd = (e) => {
    const endX =
      e.changedTouches[0].clientX;

    const diff =
      touchStartX.current - endX;

    if (diff > 50) next();

    if (diff < -50) prev();
  };

  const next = () => {
    console.log("check");

    setActiveIndex(
      (prev) => (prev + 1) % videos.length
    );
  };

  const prev = () => {
    console.log("check");
    setActiveIndex((prev) =>
      prev === 0
        ? videos.length - 1
        : prev - 1
    );
  };

  const togglePlay = (index) => {
    const video = videoRefs.current[index];

    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});

      showOverlay("▶");
    } else {
      video.pause();

      showOverlay("❚❚");
    }
  };

  const toggleMute = () => {
    const current =
      videoRefs.current[activeIndex];

    if (!current) return;

    current.muted = !current.muted;

    setMuted(current.muted);
  };

  const showOverlay = (icon) => {
    setOverlayIcon(icon);

    setTimeout(() => {
      setOverlayIcon(null);
    }, 500);
  };

  const toggleLike = async (videoId) => {
    const optimisticNext =
      !likedVideos[videoId];

    setLikedVideos((prev) => ({
      ...prev,
      [videoId]: optimisticNext,
    }));

    try {
      const action = optimisticNext
        ? "like"
        : "none";

      const res = await reactVideo(
        videoId,
        action,
      );

      setLikeCounts((prev) => ({
        ...prev,
        [videoId]: res.likes,
      }));

      setLikedVideos((prev) => ({
        ...prev,
        [videoId]:
          res.userReaction === "like",
      }));
    } catch {
      setLikedVideos((prev) => ({
        ...prev,
        [videoId]: !optimisticNext,
      }));
    }
  };

  const handleShare = async (video) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        );

        alert("Link copied!");
      }

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
      <button
        className="nav-btn left"
        onClick={prev}
      >
        ←
      </button>

      <div className="carousel-3d">
        {videos.map((video, index) => {
         let position = "hidden";

         const prevIndex =
           (activeIndex - 1 + videos.length) %
           videos.length;
         
         const nextIndex =
           (activeIndex + 1) % videos.length;
         
         if (index === activeIndex) {
           position = "center";
         } else if (index === prevIndex) {
           position = "left";
         } else if (index === nextIndex) {
           position = "right";
         }

          const isLiked =
            likedVideos[video.id];

          const likeCount =
            typeof likeCounts[
              video.id
            ] === "number"
              ? likeCounts[video.id]
              : video.likes;

          return (
            <div
              key={video.id}
              className={`card ${position}`}
            >
              <video
                ref={(el) =>
                  (videoRefs.current[index] =
                    el)
                }
                src={
                  position !== "hidden"
                    ? video.videoUrl
                    : ""
                }
                className="video"
                loop
                playsInline
                preload="auto"
                muted={muted}
                onClick={() =>
                  togglePlay(index)
                }
                onTimeUpdate={(e) => {
                  const current =
                    (e.target.currentTime /
                      e.target.duration) *
                    100;

                  setProgress((p) => ({
                    ...p,
                    [index]: current,
                  }));
                }}
              />

              {overlayIcon &&
                position ===
                  "center" && (
                  <div className="tap-overlay">
                    {overlayIcon}
                  </div>
                )}

              {position ===
                "center" && (
                <button
                  className="mute-toggle"
                  onClick={toggleMute}
                >
                  {muted ? (
                    <IoVolumeMute />
                  ) : (
                    <IoVolumeHigh />
                  )}
                </button>
              )}

              {position ===
                "center" && (
                <div className="ig-progress">
                  <div
                    className="ig-progress-fill"
                    style={{
                      width: `${
                        progress[index] ||
                        0
                      }%`,
                    }}
                  />
                </div>
              )}

              {position ===
                "center" && (
                <>
                  <div className="action-rail">
                    <button
                      className="action-btn"
                      onClick={() =>
                        toggleLike(
                          video.id
                        )
                      }
                    >
                      {isLiked ? (
                        <IoHeart className="liked-icon" />
                      ) : (
                        <IoHeartOutline />
                      )}

                      <span>
                        {likeCount}
                      </span>
                    </button>

                    <button
                      className="action-btn"
                      onClick={() =>
                        handleShare(video)
                      }
                    >
                      <IoPaperPlaneOutline />

                      <span>
                        Share
                      </span>
                    </button>
                  </div>

                  <div className="meta-panel">
                    <p className="video-title">
                      {video.title}
                    </p>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="nav-btn right"
        onClick={next}
      >
        →
      </button>
    </div>
  );
}