"use client";

import React from "react";
import { Check, Heart, Music4 } from "lucide-react";
import { Singer } from "../app/lib/singersDB";

interface SingerCardProps {
  singer: Singer;
  isSelected: boolean;
  disabled: boolean;
  onToggle: (id: string) => void;
}

export default function SingerCard({
  singer,
  isSelected,
  disabled,
  onToggle,
}: SingerCardProps) {
  const formatFollowers = (count: number | null) => {
    if (!count) return "N/A";
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return count.toString();
  };

  const isClickable = !disabled || isSelected;

  return (
    <div
      onClick={() => isClickable && onToggle(singer.id)}
      className={`relative group hover:border-accent flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
        isSelected
          ? "border-accent bg-gradient-to-b from-surface to-bg-ter cursor-pointer shadow-lg ring-1 ring-accent/30"
          : disabled
          ? "border-border/40 bg-surface/30 opacity-40 cursor-not-allowed"
          : "border-border-light bg-gradient-to-b from-surface to-card hover:border-accent/40 cursor-pointer hover:bg-surface/80 hover:scale-[1.03] hover:shadow-xl"
      }`}
    >
      {/* Spotify-Style Circular Avatar Container */}
      <div className="relative mb-3.5 ">
        <div className="h-28 w-28 sm:h-36 sm:w-36 rounded-full overflow-hidden border-2 border-border-light bg-bg-ter shadow-md group-hover:border-accent/60 transition-colors duration-300">
          <img
            src={singer.image}
            alt={singer.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Selection Checkmark Badge on Top-Right of Avatar */}
        <div
          className={`absolute top-0 right-0 h-7 w-7 rounded-full border-2 border-bg flex items-center justify-center transition-all duration-300 shadow-md ${
            isSelected
              ? "bg-accent text-bg scale-100"
              : "bg-bg-ter/80 border-border-light text-transparent scale-90 opacity-0 group-hover:opacity-100"
          }`}
        >
          <Check size={14} strokeWidth={3} />
        </div>

        {/* Rating Badge Overlay */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-bg/90 backdrop-blur-md border border-border-light rounded-full px-2.5 py-0.5 text-[11px] font-bold text-accent shadow-sm">
          <Music4 size={10} />
          {singer.rating.toFixed(1)}
        </div>
      </div>

      {/* Artist Information */}
      <div className="w-full space-y-1.5 pt-1">
        <h3 className="font-extrabold text-sm sm:text-base text-pri truncate group-hover:text-accent transition-colors">
          {singer.name}
        </h3>

        {/* Category Tags */}
        <div className="flex flex-wrap justify-center items-center gap-1">
          {singer.categories.map((cat, idx) => (
            <span
              key={idx}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-bg-ter border border-border-light text-sec"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Followers & Sub-genre */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted pt-1">
          <Heart size={11} className="text-accent fill-accent/20 shrink-0" />
          <span className="font-semibold text-sec text-[11px]">
            {formatFollowers(singer.followers)}
          </span>
          <span>•</span>
          <span className="truncate text-[11px] max-w-[90px]">{singer.genre}</span>
        </div>
      </div>
    </div>
  );
}
