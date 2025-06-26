"use client";

export default function BypassAutoplay() {
  return (
    <iframe src={undefined} allow="autoplay" style={{ display: "none" }} />
  )
}
