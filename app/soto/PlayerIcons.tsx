import type { ReactNode } from "react";

const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const PlayIcon = () => (
  <Icon>
    <path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none" />
  </Icon>
);

export const PauseIcon = () => (
  <Icon>
    <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
  </Icon>
);

export const ReplayIcon = () => (
  <Icon>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4v4.5h4.5" />
  </Icon>
);

export const SoundOnIcon = () => (
  <Icon>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" />
    <path d="M15.5 9a4 4 0 0 1 0 6" />
    <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
  </Icon>
);

export const SoundOffIcon = () => (
  <Icon>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </Icon>
);

export const LoopIcon = () => (
  <Icon>
    <path d="M17 3.5l3 3-3 3" />
    <path d="M20 6.5H8a4 4 0 0 0-4 4v1" />
    <path d="M7 20.5l-3-3 3-3" />
    <path d="M4 17.5h12a4 4 0 0 0 4-4v-1" />
  </Icon>
);

export const FullscreenIcon = () => (
  <Icon>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Icon>
);

export const ExitFullscreenIcon = () => (
  <Icon>
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </Icon>
);

export const ShareIcon = () => (
  <Icon>
    <path d="M12 15V3.5M7.5 8L12 3.5 16.5 8" />
    <path d="M5 12.5v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </Icon>
);
