import React from 'react';
import { HudIcon } from './HudIcons';

interface SelectedUnit {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
}

interface SelectionPanelProps {
  units: SelectedUnit[];
  factionColor: string;
}

export const SelectionPanel: React.FC<SelectionPanelProps> = ({ units, factionColor }) => {
  if (units.length === 0) return null;

  const single = units.length === 1;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        minWidth: single ? 220 : 300,
        maxWidth: 420,
        padding: 10,
        background: 'linear-gradient(160deg, rgba(28,26,22,0.94), rgba(14,16,18,0.96))',
        borderRadius: 4,
        border: `1px solid ${factionColor}44`,
        boxShadow: '0 6px 24px rgba(0,0,0,0.55)',
        pointerEvents: 'auto',
        color: '#ddd',
        fontFamily: "'Trebuchet MS', 'Verdana', sans-serif",
      }}
    >
      {single ? (
        <SingleUnitView unit={units[0]} factionColor={factionColor} />
      ) : (
        <MultiUnitView units={units} factionColor={factionColor} />
      )}
    </div>
  );
};

const SingleUnitView: React.FC<{ unit: SelectedUnit; factionColor: string }> = ({
  unit,
  factionColor,
}) => {
  const hpPercent = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
  const hpColor = hpPercent > 0.6 ? '#44dd44' : hpPercent > 0.3 ? '#ddaa22' : '#dd4444';

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 3,
          background: 'rgba(255,230,180,0.06)',
          border: `1px solid ${factionColor}66`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <HudIcon id="unit" size={22} color={factionColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: factionColor, marginBottom: 6 }}>
          {unit.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              flex: 1,
              height: 6,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${hpPercent * 100}%`,
                height: '100%',
                background: hpColor,
                borderRadius: 2,
              }}
            />
          </div>
          <span style={{ fontSize: 10, fontVariantNumeric: 'tabular-nums', opacity: 0.75 }}>
            {Math.ceil(unit.hp)}/{unit.maxHp}
          </span>
        </div>
      </div>
    </div>
  );
};

const MultiUnitView: React.FC<{ units: SelectedUnit[]; factionColor: string }> = ({
  units,
  factionColor,
}) => (
  <div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 700,
        color: factionColor,
        marginBottom: 8,
      }}
    >
      <HudIcon id="unit" size={12} color={factionColor} />
      {units.length} Units Selected
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {units.slice(0, 24).map((u) => {
        const hpPercent = u.maxHp > 0 ? u.hp / u.maxHp : 0;
        const borderColor = hpPercent > 0.6 ? '#44dd44' : hpPercent > 0.3 ? '#ddaa22' : '#dd4444';
        return (
          <div
            key={u.id}
            title={`${u.name} (${Math.ceil(u.hp)}/${u.maxHp})`}
            style={{
              width: 30,
              height: 30,
              borderRadius: 3,
              background: 'rgba(255,230,180,0.05)',
              border: `1.5px solid ${borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HudIcon id="unit" size={14} color="#c8c0b4" />
          </div>
        );
      })}
      {units.length > 24 && (
        <div style={{ fontSize: 9, color: '#888', alignSelf: 'center' }}>+{units.length - 24}</div>
      )}
    </div>
  </div>
);
