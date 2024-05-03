"use client";

import { Player } from "@lottiefiles/react-lottie-player";
import logoAnimation from "@public/json/logo-animation.json"

export default function AnimatedLogo() {
  return (
    <Player
      autoplay
      loop
      src={logoAnimation}
      className="h-44 w-auto"
    />
  );
}
