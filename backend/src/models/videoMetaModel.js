export const videoMetadata = Array.from({ length: 36 }, (_, idx) => {
  const id = `video-${idx + 1}`;
  return {
    id,
    title: `Socially Approved Clip ${idx + 1}`,
    description: `Short reel demo ${idx + 1} for the Socially Approved carousel.`,
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    thumbnailUrl: `https://picsum.photos/seed/${id}/640/1138`
  };
});
