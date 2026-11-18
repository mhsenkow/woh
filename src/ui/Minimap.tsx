import React, { useRef, useEffect } from 'react';
import { HudIcon } from './HudIcons';

const MAP_SIZE = 168;

export interface MinimapMarker {
  x: number;
  z: number;
  color: string;
  kind: 'unit' | 'building';
}

export interface MinimapCamera {
  x: number;
  z: number;
  /** Half-extent of visible ground approx (world units). */
  halfExtent: number;
}

export interface MinimapProps {
  mapName?: string;
  extent: number;
  markers?: MinimapMarker[];
  camera?: MinimapCamera | null;
  factionColor?: string;
}

export const Minimap: React.FC<MinimapProps> = ({
  mapName = 'Map',
  extent,
  markers = [],
  camera = null,
  factionColor = '#44aaff',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const span = Math.max(extent * 2, 1);
    const toPx = (world: number) => ((world + extent) / span) * MAP_SIZE;

    // Terrain base — cartographic 16-bit feel
    const grd = ctx.createLinearGradient(0, 0, MAP_SIZE, MAP_SIZE);
    grd.addColorStop(0, '#1c3a28');
    grd.addColorStop(0.45, '#2a4a30');
    grd.addColorStop(1, '#1a3048');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    // Soft biome blobs
    for (let i = 0; i < 48; i++) {
      const x = ((Math.sin(i * 12.1) * 0.5 + 0.5) * MAP_SIZE) | 0;
      const y = ((Math.cos(i * 7.7) * 0.5 + 0.5) * MAP_SIZE) | 0;
      const r = 8 + (i % 5) * 3;
      const water = i % 7 === 0;
      ctx.fillStyle = water ? 'rgba(40,90,140,0.35)' : 'rgba(70,120,55,0.22)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const p = (g / 4) * MAP_SIZE;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, MAP_SIZE);
      ctx.moveTo(0, p);
      ctx.lineTo(MAP_SIZE, p);
      ctx.stroke();
    }

    // Markers — buildings as squares, units as dots
    for (const m of markers) {
      const px = toPx(m.x);
      const py = toPx(m.z);
      ctx.fillStyle = m.color;
      if (m.kind === 'building') {
        ctx.fillRect(px - 3, py - 3, 6, 6);
        ctx.strokeStyle = 'rgba(0,0,0,0.45)';
        ctx.strokeRect(px - 3.5, py - 3.5, 7, 7);
      } else {
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Camera frustum box
    if (camera) {
      const half = Math.max(camera.halfExtent, 4);
      const cx = toPx(camera.x);
      const cy = toPx(camera.z);
      const hw = (half / span) * MAP_SIZE * 2;
      const hh = hw * 0.72;
      ctx.strokeStyle = factionColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - hw / 2, cy - hh / 2, hw, hh);
      ctx.fillStyle = `${factionColor}22`;
      ctx.fillRect(cx - hw / 2, cy - hh / 2, hw, hh);
    }

    // Frame
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, MAP_SIZE - 2, MAP_SIZE - 2);
  }, [extent, markers, camera, factionColor]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        pointerEvents: 'auto',
        fontFamily: "'Trebuchet MS', 'Verdana', sans-serif",
      }}
    >
      <div
        style={{
          padding: 6,
          background: 'linear-gradient(160deg, rgba(28,26,22,0.94), rgba(14,16,18,0.96))',
          borderRadius: 4,
          border: `1px solid ${factionColor}44`,
          boxShadow: '0 6px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,220,160,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 5,
            padding: '0 2px',
          }}
        >
          <HudIcon id="terrain" size={12} color={factionColor} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              color: '#c8c0b4',
            }}
          >
            {mapName}
          </span>
        </div>

        <canvas
          ref={canvasRef}
          width={MAP_SIZE}
          height={MAP_SIZE}
          style={{
            width: MAP_SIZE,
            height: MAP_SIZE,
            borderRadius: 2,
            imageRendering: 'pixelated',
            display: 'block',
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 6,
            padding: '0 2px',
            fontSize: 9,
            color: '#9a9288',
            alignItems: 'center',
          }}
        >
          <Legend icon="unit" label="Unit" color="#7ec8ff" />
          <Legend icon="building" label="Base" color="#e0c070" />
          <Legend icon="camera" label="View" color={factionColor} />
        </div>
      </div>
    </div>
  );
};

const Legend: React.FC<{ icon: 'unit' | 'building' | 'camera'; label: string; color: string }> = ({
  icon,
  label,
  color,
}) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
    <HudIcon id={icon} size={10} color={color} />
    {label}
  </span>
);
