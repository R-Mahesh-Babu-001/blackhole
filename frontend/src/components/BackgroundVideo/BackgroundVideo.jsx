import "./BackgroundVideo.css";

function BackgroundVideo() {
  return (
    <div className="background-video-container">

      {/*
        This video belongs to the whole BlackHole application.

        autoPlay  = starts automatically
        loop      = starts again when it reaches the end
        muted     = allows reliable background autoplay
        playsInline = keeps it inside the website on mobile
      */}
      <video
        className="background-video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source
          src="public/videos/blackhole-background.mp4"
          type="video/mp4"
        />
      </video>

    </div>
  );
}

export default BackgroundVideo;