"use client";

import  { Player } from "@lottiefiles/react-lottie-player";
import { self } from "@services/request";
import { cache, useEffect, useState } from "react";
import ConditionalRender from "./utils/ConditionalRender";

const cachedFetch = cache(async (url: string) => {
  return await self.get(url)
})
export default function AnimatedLogo() {
  const [logo, setLogo] = useState({});
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  
  useEffect(() => {
    (async () => {
      const res = await cachedFetch("/json/logo-animation.json");
      const json = await res.json();
      setLogo(json);
      setKey((prev) => prev + 1);
      setLoading(false);
    })();
  }, []);

  console.log("Rendering AnimatedLogo");
  
  
  return (
    <ConditionalRender condition={!loading}>
      <Player
        autoplay
        loop
        src={logo}
        key={key}
        className="h-full w-auto"
      />
    </ConditionalRender>
  );
}
