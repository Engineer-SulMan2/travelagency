"use client";

import { useState } from "react";

const VIDEOS = ["/hero-video-1.mp4", "/hero-video-2.mp4", "/hero-video-3.mp4", "/hero-video-4.mp4"];

export function HeroBackgroundVideo() {
  const [index, setIndex] = useState(0);

  function handleEnded() {
    setIndex((i) => (i + 1) % VIDEOS.length);
  }

  return (
    <>
      <video
        key={VIDEOS[index]}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={VIDEOS[index]} type="video/mp4" />
      </video>
      {/* Dark wash so white hero text stays readable over any clip */}
      <div className="absolute inset-0 bg-[#0B1120]/75" />
    </>
  );
}