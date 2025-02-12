const DemoVideo = () => {
  return (
    // TODO: Make the video proper 16:9 - Screen Studio is botched so it's 4 pixels off 😅
    <video
      className="aspect-1280/716 rounded-lg border border-black box-content"
      controls
      muted
      loop
      preload="metadata" // Preload the video fully for faster LCP
      playsInline
      poster="/assets/images/thumbnail/demo-thumbnail.webp"
    >
      <source src="/assets/videos/demo.mp4" type="video/mp4" />
    </video>
  );
};

export default DemoVideo;
