"use client";

import { ImagePreviewDialog } from "@/components/app/ImagePreviewDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type CommunityAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: "md" | "lg";
  preview?: boolean;
};

const sizeClasses = {
  md: "h-12 w-12 text-lg",
  lg: "h-14 w-14 text-xl",
};

export function CommunityAvatar({ name, imageUrl, size = "md", preview = true }: CommunityAvatarProps) {
  const avatar = (
    <Avatar
      className={`${sizeClasses[size]} rounded-2xl bg-[#78fbb6]/20 font-bold text-[#006d43] after:rounded-2xl`}
    >
      {imageUrl ? (
        <AvatarImage
          src={imageUrl}
          alt={`${name} community`}
          className="rounded-2xl"
        />
      ) : null}
      <AvatarFallback className="rounded-2xl bg-[#78fbb6]/20 text-[#006d43]">
        {name.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );

  if (!imageUrl || !preview) return avatar;

  return (
    <ImagePreviewDialog
      src={imageUrl}
      alt={`${name} community`}
      label={`${name} community image`}
      triggerClassName="shrink-0 rounded-2xl"
    >
      {avatar}
    </ImagePreviewDialog>
  );
}
