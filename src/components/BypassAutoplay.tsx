"use client";

export default function BypassAutoplay() {
  return (
    <iframe src="/audio/success-1.mp3" allow="autoplay" style={{display: "none"}}/>
  )
}
