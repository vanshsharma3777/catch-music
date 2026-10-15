"use client";

import React, { useEffect, useState } from "react";
import { Music2, User } from "lucide-react";

export const getImageUrl = (item: any): string => {
  if (Array.isArray(item?.image)) {
    return item.image[item.image.length - 1]?.url || "";
  }
  if (typeof item?.image === "string" && item.image.trim() !== "") {
    return item.image;
  }
  return "";
};

const hueFromText = (text: string) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
  return h;
};

/** Image with a built-in default: gradient tile + icon when the URL is empty or broken. */
export function CoverImage({
  src,
  name,
  kind = "song",
  className = "",
}: {
  src?: string;
  name?: string;
  kind?: "song" | "singer";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    const hue = hueFromText(name || "catchmusic");
    const Icon = kind === "singer" ? User : Music2;
    return (
      <div
        role="img"
        aria-label={name || "Default artwork"}
        className={`relative flex items-center justify-center overflow-hidden text-white/90 ${className}`}
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 70% 48%), hsl(${(hue + 55) % 360} 70% 28%))`,
        }}
      >
        <span className="absolute -right-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-white/15 blur-xl" />
        <Icon className="relative h-2/5 w-2/5" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name || ""}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}

export default CoverImage;
