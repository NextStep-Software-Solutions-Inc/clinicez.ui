"use client";

import { useEffect } from "react";

interface Props {
    version?: string;
    headerId?: string;
}

export default function HeaderEffects({ version = "v1", headerId = "root-header" }: Props) {
  useEffect(() => {
    const header = document.getElementById(headerId);
    if (!header) return;

    const blurClasses = "bg-[#FCF8F1]/30 backdrop-blur";

    const apply = () => {
      const scrolled = window.scrollY > 0;
      if (version !== "v2" || scrolled) {
        header.classList.add(...blurClasses.split(" "));
      } else {
        header.classList.remove(...blurClasses.split(" "));
      }
    };

    apply();
    window.addEventListener("scroll", apply);
    return () => window.removeEventListener("scroll", apply);
  }, [version, headerId]);

  return null;
}