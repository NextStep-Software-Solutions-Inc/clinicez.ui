"use client";

import logoAnimation from "@public/json/logo-animation.json"
import dynamic from "next/dynamic";

const Player = dynamic(() => import('@components/DynamicPlayer'), {
  ssr: false,
});

export default function AnimatedLogo() {
  return (
    <Player
      autoplay
      loop
      src={logoAnimation}
      className="h-full w-auto"
    />
  );
}
