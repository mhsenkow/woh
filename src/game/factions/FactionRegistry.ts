import { FactionId, AlignmentId } from '../../sim/ecs/components';
import { getTechTree, type FactionTechTree } from '../tech/TechTrees';
import { unitsForFaction } from '../units/UnitDefinitions';
import { buildingsForFaction } from '../buildings/BuildingDefinitions';

export interface FactionDef {
  id: FactionId;
  name: string;
  realm: string;
  alignment: AlignmentId;
  archetype: string;
  heroName: string;
  primaryColor: number;
  secondaryColor: number;
  resourceType: 'rupees' | 'coins' | 'starBits';
  /** Recommended 1v1 mirror / rivalry map id from MapDefinitions. */
  homeMapId: string;
  /** Opening production building for spawn scripts. */
  starterBuildingId: number;
  hqBuildingId: number;
}

export const FACTIONS: FactionDef[] = [
  {
    id: FactionId.HyruleRoyalGuard,
    name: 'Hyrule Royal Guard',
    realm: 'Hyrule',
    alignment: AlignmentId.Order,
    archetype: 'Terran — modular add-ons, depots, walls',
    heroName: 'Link',
    primaryColor: 0x2266bb,
    secondaryColor: 0xddcc44,
    resourceType: 'rupees',
    homeMapId: 'hyrule-field',
    starterBuildingId: 201,
    hqBuildingId: 200,
  },
  {
    id: FactionId.GanonMaliceHorde,
    name: "Ganon's Malice Horde",
    realm: 'Hyrule',
    alignment: AlignmentId.Chaos,
    archetype: 'Zerg — creep tumors, spine blooms, Blood Moon',
    heroName: 'Ganondorf',
    primaryColor: 0x991122,
    secondaryColor: 0x440022,
    resourceType: 'rupees',
    homeMapId: 'death-mountain-pass',
    starterBuildingId: 211,
    hqBuildingId: 210,
  },
  {
    id: FactionId.ToadstoolCollective,
    name: 'Toadstool Collective',
    realm: 'Mushroom',
    alignment: AlignmentId.Order,
    archetype: 'Terran — bunkers, pipes, ?-Block add-ons',
    heroName: 'Mario',
    primaryColor: 0xcc3333,
    secondaryColor: 0x3355cc,
    resourceType: 'coins',
    homeMapId: 'mushroom-plains',
    starterBuildingId: 221,
    hqBuildingId: 220,
  },
  {
    id: FactionId.KoopaTroop,
    name: 'The Koopa Troop',
    realm: 'Mushroom',
    alignment: AlignmentId.Chaos,
    archetype: 'Protoss/Mech — pylons, thwomps, airships',
    heroName: 'Bowser',
    primaryColor: 0x44aa22,
    secondaryColor: 0xeeaa00,
    resourceType: 'coins',
    homeMapId: 'bowser-courtyard',
    starterBuildingId: 233,
    hqBuildingId: 230,
  },
  {
    id: FactionId.DreamLandStarGuard,
    name: 'Dream Land Star Guard',
    realm: 'Popstar',
    alignment: AlignmentId.Order,
    archetype: 'Protoss — pylons, warp-in, Copy-Essence',
    heroName: 'Kirby',
    primaryColor: 0xffaa22,
    secondaryColor: 0xff66aa,
    resourceType: 'starBits',
    homeMapId: 'dream-meadows',
    starterBuildingId: 241,
    hqBuildingId: 240,
  },
  {
    id: FactionId.NightmareDarkMatter,
    name: 'NightMare & Dark Matter',
    realm: 'Popstar',
    alignment: AlignmentId.Chaos,
    archetype: 'Zerg — Void cysts, husks, shield drain',
    heroName: 'Marx/Dedede',
    primaryColor: 0x6611aa,
    secondaryColor: 0x220055,
    resourceType: 'starBits',
    homeMapId: 'void-star-arena',
    starterBuildingId: 253,
    hqBuildingId: 250,
  },
];

export function getFaction(id: FactionId): FactionDef {
  return FACTIONS.find((f) => f.id === id)!;
}

export function getFactionTechTree(id: FactionId): FactionTechTree {
  return getTechTree(id);
}

export function getFactionRoster(id: FactionId) {
  return {
    faction: getFaction(id),
    tech: getTechTree(id),
    units: unitsForFaction(id),
    buildings: buildingsForFaction(id),
  };
}
