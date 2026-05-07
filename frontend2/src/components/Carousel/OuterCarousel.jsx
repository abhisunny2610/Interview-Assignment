import { useEffect, useRef } from "react";

export default function OuterCarousel({ videos, onClick }) {
  const scrollRef = useRef(null);

  // 🔁 Auto scroll
  useEffect(() => {
    const interval = setInterval(() => {
      if (!scrollRef.current) return;

      const container = scrollRef.current;
      const cardWidth = container.firstChild?.offsetWidth || 250;

      container.scrollBy({
        left: cardWidth + 20,
        behavior: "smooth",
      });

      // loop back
      if (
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth - 10
      ) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="outer-wrapper">
      <h1 className="outer-title">Socially Approved Carousel</h1>

      <div className="outer-carousel">
        <div className="outer-container" ref={scrollRef}>
          {videos.map((video, index) => (
            <button
              key={video.id}
              className="outer-card"
              onClick={() => onClick(index)}
            >
              <div className="outer-image-wrapper">
                <video
                  src={video.videoUrl}
                  className="outer-video"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}