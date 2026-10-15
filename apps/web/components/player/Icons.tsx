import React from "react";

type P = React.SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
  ...p,
});
const stroke = (p: P) => ({
  ...base(p),
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const PlayIcon = (p: P) => (<svg {...base(p)}><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>);
export const PauseIcon = (p: P) => (<svg {...base(p)}><rect x="6" y="5" width="4" height="14" rx="1.2" /><rect x="14" y="5" width="4" height="14" rx="1.2" /></svg>);
export const NextIcon = (p: P) => (<svg {...base(p)}><path d="M6 6.2v11.6a.8.8 0 0 0 1.25.66l8.5-5.8a.8.8 0 0 0 0-1.32l-8.5-5.8A.8.8 0 0 0 6 6.2Z" /><rect x="16.5" y="5.5" width="2.5" height="13" rx="1" /></svg>);
export const PrevIcon = (p: P) => (<svg {...base(p)}><path d="M18 6.2v11.6a.8.8 0 0 1-1.25.66l-8.5-5.8a.8.8 0 0 1 0-1.32l8.5-5.8A.8.8 0 0 1 18 6.2Z" /><rect x="5" y="5.5" width="2.5" height="13" rx="1" /></svg>);
export const ShuffleIcon = (p: P) => (<svg {...stroke(p)}><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>);
export const RepeatIcon = (p: P) => (<svg {...stroke(p)}><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>);
export const ChevronDownIcon = (p: P) => (<svg {...stroke(p)}><path d="m6 9 6 6 6-6" /></svg>);
export const ExpandIcon = (p: P) => (<svg {...stroke(p)}><path d="m18 15-6-6-6 6" /></svg>);
export const CloseIcon = (p: P) => (<svg {...stroke(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>);
export const VolumeIcon = (p: P) => (<svg {...stroke(p)}><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>);
export const MuteIcon = (p: P) => (<svg {...stroke(p)}><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="m22 9-6 6M16 9l6 6" /></svg>);
