import React from 'react';
import { CommandCard } from './CommandCard';
import { Minimap, type MinimapCamera, type MinimapMarker } from './Minimap';
import { ResourceBar } from './ResourceBar';
import { SelectionPanel } from './SelectionPanel';

export interface HUDProps {
  resources: { rupees: number; coins: number; starBits: number };
  selectedUnits: { id: number; name: string; hp: number; maxHp: number }[];
  factionName: string;
  factionColor: string;
  onCommand?: (commandId: string) => void;
  mapName?: string;
  mapExtent?: number;
  minimapMarkers?: MinimapMarker[];
  minimapCamera?: MinimapCamera | null;
}

export const HUD: React.FC<HUDProps> = ({
  resources,
  selectedUnits,
  factionName,
  factionColor,
  onCommand,
  mapName = 'Map',
  mapExtent = 40,
  minimapMarkers = [],
  minimapCamera = null,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        fontFamily: "'Trebuchet MS', 'Verdana', sans-serif",
        pointerEvents: 'none',
      }}
    >
      <ResourceBar resources={resources} factionName={factionName} factionColor={factionColor} />
      <Minimap
        mapName={mapName}
        extent={mapExtent}
        markers={minimapMarkers}
        camera={minimapCamera}
        factionColor={factionColor}
      />
      <CommandCard onCommand={onCommand} factionColor={factionColor} />
      {selectedUnits.length > 0 && (
        <SelectionPanel units={selectedUnits} factionColor={factionColor} />
      )}
    </div>
  );
};
