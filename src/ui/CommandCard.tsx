import React, { useState } from 'react';
import { HudIcon, type HudIconId } from './HudIcons';

interface CommandSlot {
  id: HudIconId;
  label: string;
  hotkey: string;
}

const DEFAULT_COMMANDS: CommandSlot[] = [
  { id: 'move', label: 'Move', hotkey: 'M' },
  { id: 'attack', label: 'Attack', hotkey: 'A' },
  { id: 'stop', label: 'Stop', hotkey: 'S' },
  { id: 'hold', label: 'Hold', hotkey: 'H' },
  { id: 'patrol', label: 'Patrol', hotkey: 'P' },
  { id: 'ability1', label: 'Ability', hotkey: 'Q' },
  { id: 'ability2', label: 'Ability', hotkey: 'W' },
  { id: 'ability3', label: 'Ability', hotkey: 'E' },
  { id: 'build', label: 'Build', hotkey: 'B' },
  { id: 'rally', label: 'Rally', hotkey: 'R' },
  { id: 'upgrade', label: 'Upgrade', hotkey: 'U' },
  { id: 'special', label: 'Special', hotkey: 'T' },
];

interface CommandCardProps {
  onCommand?: (commandId: string) => void;
  factionColor: string;
}

export const CommandCard: React.FC<CommandCardProps> = ({ onCommand, factionColor }) => {
  const [pressedId, setPressedId] = useState<string | null>(null);

  const handleClick = (cmd: CommandSlot) => {
    setPressedId(cmd.id);
    setTimeout(() => setPressedId(null), 120);
    onCommand?.(cmd.id);
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        right: 12,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 58px)',
        gridTemplateRows: 'repeat(3, 58px)',
        gap: 5,
        padding: 10,
        background: 'linear-gradient(160deg, rgba(28,26,22,0.94), rgba(14,16,18,0.96))',
        borderRadius: 4,
        border: `1px solid ${factionColor}55`,
        boxShadow: '0 6px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,220,160,0.06)',
      }}
    >
      {DEFAULT_COMMANDS.map((cmd) => {
        const pressed = pressedId === cmd.id;
        return (
          <button
            key={cmd.id}
            type="button"
            tabIndex={-1}
            title={`${cmd.label} (${cmd.hotkey})`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleClick(cmd)}
            style={{
              position: 'relative',
              width: 58,
              height: 58,
              background: pressed
                ? 'linear-gradient(180deg, rgba(40,38,34,0.95), rgba(55,52,46,0.9))'
                : 'linear-gradient(180deg, rgba(58,54,46,0.95), rgba(32,30,28,0.98))',
              border: `1px solid ${pressed ? `${factionColor}88` : 'rgba(255,230,180,0.12)'}`,
              borderRadius: 3,
              color: '#d8d0c4',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              transform: pressed ? 'translateY(2px)' : 'translateY(0)',
              boxShadow: pressed
                ? 'inset 0 2px 5px rgba(0,0,0,0.55)'
                : '0 2px 0 rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,230,180,0.08)',
              pointerEvents: 'auto',
              padding: 0,
            }}
          >
            <HudIcon id={cmd.id} size={20} color={factionColor} />
            <span
              style={{
                fontSize: 8,
                letterSpacing: 0.4,
                opacity: 0.85,
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              {cmd.label}
            </span>
            <span
              style={{
                position: 'absolute',
                top: 3,
                right: 5,
                fontSize: 8,
                fontWeight: 700,
                color: factionColor,
                opacity: 0.9,
              }}
            >
              {cmd.hotkey}
            </span>
          </button>
        );
      })}
    </div>
  );
};
