import React from 'react';

/** Tiny inline SVG icons for the command card / resource strip / minimap legend. */
export type HudIconId =
  | 'move'
  | 'attack'
  | 'stop'
  | 'hold'
  | 'patrol'
  | 'ability1'
  | 'ability2'
  | 'ability3'
  | 'build'
  | 'rally'
  | 'upgrade'
  | 'special'
  | 'rupee'
  | 'coin'
  | 'starBit'
  | 'unit'
  | 'building'
  | 'camera'
  | 'terrain';

interface HudIconProps {
  id: HudIconId;
  size?: number;
  color?: string;
}

export const HudIcon: React.FC<HudIconProps> = ({ id, size = 18, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ display: 'block', flexShrink: 0 }}
  >
    {ICON_PATHS[id]}
  </svg>
);

const ICON_PATHS: Record<HudIconId, React.ReactNode> = {
  move: (
    <>
      <circle cx="12" cy="12" r="2.5" fill={undefined} />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </>
  ),
  attack: (
    <>
      <path d="M14.5 4.5l5 5L9 20H4v-5L14.5 4.5z" />
      <path d="M12.5 6.5l5 5" />
    </>
  ),
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" />,
  hold: (
    <>
      <path d="M8 20V10a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2" />
      <path d="M12 14V9a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v5" />
      <path d="M16 14v-2a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v8H8" />
    </>
  ),
  patrol: (
    <>
      <path d="M4 12c2-4 4-6 8-6s6 2 8 6c-2 4-4 6-8 6s-6-2-8-6z" />
      <circle cx="12" cy="12" r="2" />
      <path d="M17 7l3-1M7 17l-3 1" />
    </>
  ),
  ability1: (
    <>
      <path d="M12 3l2.2 6.2L21 12l-6.8 2.8L12 21l-2.2-6.2L3 12l6.8-2.8L12 3z" />
    </>
  ),
  ability2: (
    <>
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4" />
      <circle cx="12" cy="12" r="3.5" />
    </>
  ),
  ability3: (
    <>
      <path d="M5 19c4-8 10-12 14-14" />
      <path d="M14 5h5v5" />
      <circle cx="8" cy="16" r="2" />
    </>
  ),
  build: (
    <>
      <path d="M4 20h16" />
      <path d="M6 20V10l6-5 6 5v10" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  rally: (
    <>
      <path d="M6 21V4" />
      <path d="M6 5h10l-2 3 2 3H6" fill="currentColor" fillOpacity={0.25} />
    </>
  ),
  upgrade: (
    <>
      <path d="M12 19V6" />
      <path d="M7 11l5-5 5 5" />
      <path d="M5 19h14" />
    </>
  ),
  special: (
    <>
      <path d="M12 2l1.8 5.5H20l-4.5 3.3 1.7 5.4L12 13.8 6.8 16.2l1.7-5.4L4 7.5h6.2L12 2z" />
    </>
  ),
  rupee: (
    <>
      <path d="M12 3l7 9-7 9-7-9 7-9z" fill="currentColor" fillOpacity={0.35} />
      <path d="M12 3l7 9-7 9-7-9 7-9z" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity={0.3} />
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9.5 10.5c.6-1 1.5-1.5 2.5-1.5s2 .6 2 1.8c0 2.2-4 2-4 4.2 0 1 .8 1.5 2 1.5s1.8-.4 2.4-1.2" />
    </>
  ),
  starBit: (
    <>
      <path
        d="M12 3l2.1 5.4 5.9.3-4.6 3.6 1.6 5.6L12 15.2 6.9 18l1.6-5.6L4 8.7l5.9-.3L12 3z"
        fill="currentColor"
        fillOpacity={0.35}
      />
      <path d="M12 3l2.1 5.4 5.9.3-4.6 3.6 1.6 5.6L12 15.2 6.9 18l1.6-5.6L4 8.7l5.9-.3L12 3z" />
    </>
  ),
  unit: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M6 19c1.5-3.5 3.5-5 6-5s4.5 1.5 6 5" />
    </>
  ),
  building: (
    <>
      <path d="M5 20V9l7-5 7 5v11" />
      <path d="M10 20v-4h4v4" />
    </>
  ),
  camera: (
    <>
      <rect x="5" y="7" width="14" height="10" rx="1.5" />
      <path d="M5 7l3-3h8l3 3" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  terrain: (
    <>
      <path d="M3 17l5-7 4 4 3-3 6 6H3z" fill="currentColor" fillOpacity={0.3} />
      <path d="M3 17l5-7 4 4 3-3 6 6" />
    </>
  ),
};
