export interface HeroDef {
  id: number;
  name: string;
  faction: number;
  hp: number;
  damage: number;
  range: number;
  speed: number;
  abilities: [AbilityDef, AbilityDef, AbilityDef];
}

export interface AbilityDef {
  name: string;
  cooldown: number;
  range: number;
  damage?: number;
  description: string;
}

export const HEROES: HeroDef[] = [
  {
    id: 0, name: 'Link', faction: 0, hp: 500, damage: 25, range: 1.5, speed: 3.0,
    abilities: [
      { name: 'Spin Attack', cooldown: 3, range: 2.5, damage: 40, description: 'AOE melee spin dealing damage to all nearby enemies.' },
      { name: 'Bow Shot', cooldown: 5, range: 8.0, damage: 35, description: 'Precision ranged arrow. Can headshot for 2x damage.' },
      { name: 'Paraglider Reposition', cooldown: 8, range: 10.0, description: 'Glide to target location, ignoring terrain.' },
    ],
  },
  {
    id: 1, name: 'Ganondorf', faction: 1, hp: 650, damage: 35, range: 2.0, speed: 2.5,
    abilities: [
      { name: 'Malice Burst', cooldown: 4, range: 3.0, damage: 50, description: 'Erupts Malice in an area, spreading creep.' },
      { name: 'Dark Punch', cooldown: 6, range: 1.5, damage: 70, description: 'Devastating single-target strike.' },
      { name: 'Blood Moon Ritual', cooldown: 30, range: 0, description: 'Resurrects all fallen Bokoblins within 20 tiles.' },
    ],
  },
  {
    id: 2, name: 'Mario', faction: 2, hp: 450, damage: 20, range: 1.5, speed: 3.2,
    abilities: [
      { name: 'Fireball Barrage', cooldown: 3, range: 5.0, damage: 25, description: 'Launches bouncing fireballs that ignite voxels.' },
      { name: 'Super Star', cooldown: 15, range: 0, description: 'Invulnerability for 5 seconds. Increased speed.' },
      { name: 'Ground Pound', cooldown: 6, range: 2.0, damage: 45, description: 'AOE slam that destroys nearby voxel terrain.' },
    ],
  },
  {
    id: 3, name: 'Bowser', faction: 3, hp: 800, damage: 40, range: 2.5, speed: 1.8,
    abilities: [
      { name: 'Fire Breath', cooldown: 5, range: 4.0, damage: 35, description: 'Cone of fire that ignites terrain and enemies.' },
      { name: 'Shell Slam', cooldown: 8, range: 3.0, damage: 60, description: 'Retreats into shell and charges, bouncing off walls.' },
      { name: 'Koopa Summon', cooldown: 20, range: 0, description: 'Summons 4 Koopa Troopas at current location.' },
    ],
  },
  {
    id: 4, name: 'Kirby', faction: 4, hp: 350, damage: 18, range: 1.5, speed: 3.5,
    abilities: [
      { name: 'Inhale & Copy', cooldown: 4, range: 2.0, description: 'Absorbs defeated enemy weapon trait via Copy-Essence Matrix.' },
      { name: 'Star Spit', cooldown: 3, range: 5.0, damage: 30, description: 'Expels a star projectile from absorbed energy.' },
      { name: 'Float', cooldown: 6, range: 8.0, description: 'Puffs up and floats to target, ignoring terrain.' },
    ],
  },
  {
    id: 5, name: 'Marx', faction: 5, hp: 400, damage: 28, range: 3.0, speed: 2.8,
    abilities: [
      { name: 'Dark Matter Wave', cooldown: 5, range: 4.0, damage: 40, description: 'Sends void corruption wave that drains shields.' },
      { name: 'Jester Teleport', cooldown: 7, range: 12.0, description: 'Teleports to any visible location on the map.' },
      { name: 'Void Corruption', cooldown: 15, range: 6.0, description: 'Converts enemy voxels into void tiles in a large area.' },
    ],
  },
];

export function getHero(id: number): HeroDef | undefined {
  return HEROES.find((h) => h.id === id);
}
