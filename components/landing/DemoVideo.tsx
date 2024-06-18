const DemoVideo = () => {
  return (
    // TODO: Make the video proper 16:9 - Screen Studio is botched so it's 4 pixels off 😅
    <video
      className="aspect-[1280/716] rounded-lg border border-black box-content"
      controls
      muted
      loop
      preload="metadata"
      playsInline
    >
      <source src="/assets/videos/demo.mp4#t=0.001" type="video/mp4" />
    </video>
  );
};

export default DemoVideo;
