import React from 'react';
import { HudIcon, type HudIconId } from './HudIcons';

interface ResourceBarProps {
  resources: { rupees: number; coins: number; starBits: number };
  factionName: string;
  factionColor: string;
}

export const ResourceBar: React.FC<ResourceBarProps> = ({ resources, factionName, factionColor }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        padding: '10px 24px',
        background: 'linear-gradient(180deg, rgba(12,14,16,0.9), rgba(12,14,16,0))',
        pointerEvents: 'none',
        fontFamily: "'Trebuchet MS', 'Verdana', sans-serif",
      }}
    >
      <span
        style={{
          color: factionColor,
          fontWeight: 800,
          fontSize: 12,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          textShadow: '0 1px 4px rgba(0,0,0,0.85)',
        }}
      >
        {factionName}
      </span>

      <ResourceItem icon="rupee" value={resources.rupees} color="#44dd66" label="Rupees" />
      <ResourceItem icon="coin" value={resources.coins} color="#ffcc33" label="Coins" />
      <ResourceItem icon="starBit" value={resources.starBits} color="#ff88cc" label="Star Bits" />
    </div>
  );
};

const ResourceItem: React.FC<{
  icon: HudIconId;
  value: number;
  color: string;
  label: string;
}> = ({ icon, value, color, label }) => (
  <div
    title={label}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '4px 10px 4px 8px',
      background: 'rgba(0,0,0,0.28)',
      border: '1px solid rgba(255,230,180,0.1)',
      borderRadius: 3,
    }}
  >
    <HudIcon id={icon} size={14} color={color} />
    <span
      style={{
        color: '#ece6da',
        fontSize: 13,
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
        minWidth: 28,
      }}
    >
      {Math.floor(value)}
    </span>
  </div>
);
