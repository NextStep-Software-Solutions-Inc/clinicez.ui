"use client";

import Image from "next/image";
import { useState } from "react";
import { User } from "lucide-react";

interface HPAvatarProps {
  imageUrl?: string;
  description?: string;
}

export function HPAvatar({ imageUrl, description }: HPAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const showFallback = !imageUrl || hasError;

  return (
    <div className="flex aspect-square h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted sm:h-24 sm:w-24">
      {showFallback ? (
        <User className="h-8 w-8 text-muted-foreground sm:h-12 sm:w-12" strokeWidth={1.5} />
      ) : (
        <Image
          src={imageUrl}
          alt={description ?? "Image of a healthcare provider"}
          width={96}
          height={96}
          sizes="(max-width: 640px) 64px, 96px"
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
