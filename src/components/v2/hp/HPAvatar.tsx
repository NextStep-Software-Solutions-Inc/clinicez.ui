import Image from "next/image";

interface HPAvatarProps {
  imageUrl?: string;
  description?: string;
}

export function HPAvatar({ imageUrl, description }: HPAvatarProps) {
  return (
    <div className="flex aspect-square h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted sm:h-24 sm:w-24">
      <Image
        src={imageUrl ?? "/placeholder.svg"}
        alt={description ?? "Image of a healthcare provider"}
        width={64}
        height={64}
        className="h-full w-full object-cover"
      />
    </div>
  );
}