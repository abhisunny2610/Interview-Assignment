import { useEffect, useState } from "react";
import Carousel from "./components/Carousel/Carousel";
import {
  fetchVideos,
  reactVideo,
  shareVideo,
} from "./api";
import "./App.css";

function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos()
      .then(setVideos)
      .catch((err) => {
        console.error(err);
        alert("Failed to load videos");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleReact = async (videoId, action) => {
    setVideos((prev) =>
      prev.map((v) => {
        if (v.id !== videoId) return v;

        return {
          ...v,
          likes: action === "like" ? v.likes + 1 : v.likes,
          dislikes: action === "dislike" ? v.dislikes + 1 : v.dislikes,
        };
      })
    );

    try {
      const res = await reactVideo(videoId, action);

      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? { ...v, likes: res.likes, dislikes: res.dislikes }
            : v
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = async (videoId) => {
    try {
      await shareVideo(videoId);

      if (navigator.share) {
        await navigator.share({
          title: "Check this video",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied!");
      }

      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId ? { ...v, shares: (v.shares || 0) + 1 } : v
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const actions = {
    onReact: handleReact,
    onShare: handleShare,
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="App">
      <Carousel videos={videos} actions={actions} />
    </div>
  );
}

export default App;