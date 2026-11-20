import * as THREE from 'three';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { defineQuery } from 'bitecs/legacy';

import { DioramaRenderer } from './engine/DioramaRenderer';
import { IsometricCamera } from './engine/IsometricCamera';
import { DioramaLighting } from './engine/lighting/DioramaLighting';
import { VoxelWorld } from './engine/voxel/VoxelWorld';
import { StandeeRenderer } from './engine/standee/StandeeRenderer';
import { createStandeeMaterial } from './engine/standee/StandeeMaterial';
import {
  createStandeeArtTexture,
  artKindForUnit,
  type StandeeArtKind,
} from './engine/standee/StandeeArtFactory';
import { BuildingRenderer } from './engine/buildings/BuildingRenderer';
import { FlatTrees, floraThemeFromBiome } from './engine/props/FlatTrees';
import { VoxelPhysics } from './engine/voxel/VoxelPhysics';
import { WaterSurface } from './engine/voxel/WaterSurface';
import { CHUNK_SIZE, VOXEL_SCALE, VoxelType } from './engine/voxel/VoxelChunk';
import { OCEAN_Y } from './engine/voxel/VoxelWorld';
import { applyPostProcessConfig, createDioramaPostStack } from './engine/fx/PostProcessing';
import { createExplosionEmitter } from './engine/fx/ParticlePool';
import { loadMap, DEFAULT_MAP } from './game/maps/MapLoader';
import { SimLoop } from './sim/SimWorker';
import { spawnMidGameScenario } from './game/scenarios/MidGameScenario';
import { drainCombatEvents } from './sim/ecs/systems/CombatSystem';
import { getCreepState } from './sim/ecs/systems/CreepSystem';
import { Position, Health, Standee, Faction, UnitType, Building, Pathfinding, Target, Combat } from './sim/ecs/components';
import { getResources } from './sim/ecs/systems/ResourceSystem';
import { FactionId } from './sim/ecs/components';
import { InputManager } from './input/InputManager';
import { SelectionBox } from './input/SelectionBox';
import { SelectionController } from './input/SelectionController';
import { HeroLockController } from './input/HeroLockController';
import { HUD, type HUDProps } from './ui/HUD';
import { FACTIONS } from './game/factions/FactionRegistry';
import { getMeta } from './sim/ecs/World';

const standeeQuery = defineQuery([Position, Standee]);
const buildingQuery = defineQuery([Position, Building, Faction]);

async function boot() {
  const container = document.getElementById('game-canvas')!;
  const hudRoot = document.getElementById('hud-root')!;

  const diorama = new DioramaRenderer(container);
  await diorama.init();
  applyPostProcessConfig(diorama.renderer, { toneMappingExposure: 1.0 });

  const iso = new IsometricCamera(diorama.width, diorama.height);
  iso.setZoom(42);
  iso.attach(container);

  const post = createDioramaPostStack(diorama.renderer, diorama.scene, iso.camera, {
    bokehScale: 0.15,
    focusRange: 80,
    vignetteIntensity: 0.05,
    bloomStrength: 0.04,
  });
  post.setSize(diorama.width, diorama.height);
  window.addEventListener('resize', () => {
    post.setSize(container.clientWidth, container.clientHeight);
  });

  const lighting = new DioramaLighting();
  diorama.scene.add(lighting.group);

  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.ShadowMaterial({ opacity: 0.32 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  diorama.scene.add(ground);

  const voxelWorld = new VoxelWorld();
  const mapDef = loadMap(voxelWorld, DEFAULT_MAP);
  diorama.scene.add(voxelWorld.createOcean());
  diorama.scene.add(voxelWorld.group);

  // Keep the camera over the playable diorama (chunkRadius → world meters + padding)
  const mapExtent = mapDef.chunkRadius * 32 * 0.25 * 3.2;
  iso.setBounds({
    minX: -mapExtent,
    maxX: mapExtent,
    minZ: -mapExtent,
    maxZ: mapExtent,
  });

  // Open looking at the player's spawn
  const openSpawn = mapDef.spawnPoints.find((s) => s.faction === 0) ?? mapDef.spawnPoints[0];
  if (openSpawn) iso.setTarget(openSpawn.x, 0, openSpawn.z);

  const standeeRenderer = new StandeeRenderer();
  diorama.scene.add(standeeRenderer.group);

  const buildingRenderer = new BuildingRenderer();
  diorama.scene.add(buildingRenderer.group);

  // Realm flora — Zelda / Mario / Kirby silhouettes matched to map biome (or mixed sectors)
  const floraTheme =
    mapDef.realm === 'Neutral' ? 'mixed' : floraThemeFromBiome(mapDef.biome);
  const trees = new FlatTrees(0, 26, floraTheme);
  trees.plantGroves({
    isGrass: (x, z) => voxelWorld.surfaceType(x, z) === VoxelType.Grass,
    isShore: (x, z) => {
      const shore = voxelWorld.probe(x, z);
      return shore.top === VoxelType.Sand && shore.landY >= OCEAN_Y && shore.landY < OCEAN_Y + 0.85;
    },
    height: (x, z) => voxelWorld.getSurfaceHeight(x, z),
  });
  diorama.scene.add(trees.group);

  const water = new WaterSurface(voxelWorld);

  const voxelPhysics = new VoxelPhysics(voxelWorld);

  // Seed creep sim state from map Malice / Void voxels so adrenal / drain kits work immediately
  {
    const creep = getCreepState();
    voxelWorld.forEachChunk((chunk) => {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          for (let y = CHUNK_SIZE - 1; y >= 0; y--) {
            const v = chunk.get(x, y, z);
            if (v !== VoxelType.Malice && v !== VoxelType.Void) continue;
            const wx = (chunk.cx * CHUNK_SIZE + x) * VOXEL_SCALE;
            const wz = (chunk.cz * CHUNK_SIZE + z) * VOXEL_SCALE;
            const key = `${Math.floor(wx)},${Math.floor(wz)}`;
            if (v === VoxelType.Malice) creep.maliceTiles.add(key);
            else creep.voidTiles.add(key);
            break;
          }
        }
      }
    });
  }

  const explosionEmitter = createExplosionEmitter();
  diorama.scene.add(explosionEmitter.mesh);

  // Procedural PaperCraft roster — cohesive Zelda/Mario/Kirby silhouettes
  const artCache = new Map<StandeeArtKind, THREE.Texture>();
  function getArtTexture(kind: StandeeArtKind): THREE.Texture {
    if (!artCache.has(kind)) artCache.set(kind, createStandeeArtTexture(kind, 512));
    return artCache.get(kind)!;
  }

  const sim = new SimLoop();
  getMeta(sim.world).terrain = {
    isWater: (x, z) => voxelWorld.isWater(x, z),
  };
  const scenario = spawnMidGameScenario(sim.world, mapDef.spawnPoints);
  const allUnitEids = scenario.unitEids;

  // Seat units + buildings on terrain
  for (const eid of allUnitEids) {
    Position.y[eid] = voxelWorld.getSurfaceHeight(Position.x[eid], Position.z[eid]);
  }
  for (const eid of scenario.buildingEids) {
    Position.y[eid] = voxelWorld.getSurfaceHeight(Position.x[eid], Position.z[eid]);
  }

  sim.start();

  // Unit standees
  for (const eid of allUnitEids) {
    const fid = Faction.id[eid];
    const isElite = Standee.isElite[eid] === 1;
    const unitTypeId = UnitType.id[eid];
    const factionDef = FACTIONS.find((f) => f.id === fid);
    const primaryColor = factionDef?.primaryColor ?? 0xffffff;
    const kind = artKindForUnit(unitTypeId, isElite, fid);
    const map = getArtTexture(kind);

    const mat = createStandeeMaterial({
      baseColor: 0xffffff,
      factionColor: primaryColor,
      isElite,
      map,
    });

    standeeRenderer.createStandee(
      eid,
      isElite
        ? { width: 1.7, height: 2.55, baseRadius: 0.48, rimDepth: 0.16 }
        : { width: 1.28, height: 2.05, rimDepth: 0.14 },
      mat,
      primaryColor,
    );

    standeeRenderer.getStandee(eid)!.position.set(
      Position.x[eid], Position.y[eid], Position.z[eid],
    );
  }

  // Buildings
  for (const eid of scenario.buildingEids) {
    const fid = Faction.id[eid];
    const typeId = Building.type[eid];
    buildingRenderer.createBuilding(eid, typeId, fid);
    const mesh = buildingRenderer.getBuilding(eid)!;
    mesh.position.set(Position.x[eid], Position.y[eid], Position.z[eid]);
  }

  const input = new InputManager();
  input.attach(container);
  const selectionBox = new SelectionBox(container);
  const heroLock = new HeroLockController(input);
  const playerFaction = FactionId.HyruleRoyalGuard;
  getMeta(sim.world).playerFaction = playerFaction;

  const selection = new SelectionController(
    container,
    iso.camera,
    sim.world,
    playerFaction,
    standeeRenderer,
    selectionBox,
  );

  input.registerHotkey('f', () => {
    heroLock.toggle();
    console.log(heroLock.locked ? '[Camera] Hero lock ON — WASD drives hero' : '[Camera] Hero lock OFF — WASD pans');
  });
  input.registerHotkey('home', () => iso.resetView(true));
  input.registerHotkey('0', () => iso.resetZoom());

  // Orders — only when something is selected (keeps WASD free for camera otherwise)
  const withSelection = (cmd: string) => {
    if (selection.getSelectedIds().length === 0) return;
    selection.issueCommand(cmd);
  };
  input.registerHotkey('s', () => withSelection('stop'));
  input.registerHotkey('h', () => withSelection('hold'));
  input.registerHotkey('a', () => withSelection('attack'));
  input.registerHotkey('m', () => withSelection('move'));
  input.registerHotkey('q', () => withSelection('ability1'));
  input.registerHotkey('w', () => withSelection('ability2'));
  input.registerHotkey('e', () => withSelection('ability3'));
  input.registerHotkey('escape', () => {
    selection.clearSelection();
    selection.setOrderMode('default');
  });

  // Control groups: Ctrl+1-9 assign, 1-9 recall (double-tap centers camera)
  const groupRecallAt = new Map<number, number>();
  for (let g = 1; g <= 9; g++) {
    const groupId = g;
    input.registerHotkey(String(groupId), () => {
      if (input.state.ctrlHeld) {
        selection.assignControlGroup(groupId);
        console.log(`[Group] Assigned Ctrl+${groupId} → ${selection.getSelectedIds().length} units`);
        return;
      }
      const now = performance.now();
      const last = groupRecallAt.get(groupId) ?? 0;
      selection.recallControlGroup(groupId);
      if (now - last < 350) {
        const c = selection.getSelectionCentroid();
        if (c) iso.setTarget(c.x, 0, c.z);
      }
      groupRecallAt.set(groupId, now);
    });
  }

  // Follow the player's hero when present
  const playerHeroEid =
    allUnitEids.find((eid) => Faction.id[eid] === playerFaction && Standee.isElite[eid] === 1) ??
    allUnitEids.find((eid) => Faction.id[eid] === playerFaction);

  const followPos = new THREE.Vector3();

  const factionColorHex = (fid: number) => {
    const def = FACTIONS.find((f) => f.id === fid);
    const c = def?.primaryColor ?? 0xffffff;
    return `#${c.toString(16).padStart(6, '0')}`;
  };

  const react = createRoot(hudRoot);
  function renderHUD() {
    const res = getResources(sim.world, playerFaction);
    const factionDef = FACTIONS.find((f) => f.id === playerFaction)!;

    const selectedUnits = selection.getSelectedInfos();

    const minimapMarkers: HUDProps['minimapMarkers'] = [];
    for (const eid of standeeQuery(sim.world)) {
      if ((Health.current[eid] ?? 0) <= 0) continue;
      minimapMarkers.push({
        x: Position.x[eid],
        z: Position.z[eid],
        color: factionColorHex(Faction.id[eid]),
        kind: 'unit',
      });
    }
    for (const eid of buildingQuery(sim.world)) {
      if ((Health.current[eid] ?? 0) <= 0) continue;
      minimapMarkers.push({
        x: Position.x[eid],
        z: Position.z[eid],
        color: factionColorHex(Faction.id[eid]),
        kind: 'building',
      });
    }

    const camTarget = iso.getTarget();
    const props: HUDProps = {
      resources: res,
      selectedUnits,
      factionName: factionDef.name,
      factionColor: `#${factionDef.primaryColor.toString(16).padStart(6, '0')}`,
      onCommand: (cmd) => selection.issueCommand(cmd),
      mapName: mapDef.name,
      mapExtent,
      minimapMarkers,
      minimapCamera: {
        x: camTarget.x,
        z: camTarget.z,
        // Perspective FOV ≈42° → ground half-extent roughly distance * tan(fov/2) * 1.4
        halfExtent: iso.getZoom() * 0.55,
      },
    };

    react.render(React.createElement(HUD, props));
  }

  let lastTime = performance.now();
  let frameCount = 0;

  function frame(time: number) {
    requestAnimationFrame(frame);
    const dt = (time - lastTime) / 1000;
    lastTime = time;
    frameCount++;

    sim.update(time);

    // Combat → particles + destructible / corrupted terrain
    for (const ev of drainCombatEvents()) {
      if (ev.type === 'kill') {
        explosionEmitter.emit(new THREE.Vector3(ev.x, ev.y + 0.5, ev.z), ev.wasBuilding ? 40 : 18);
        voxelPhysics.applyImpact({
          worldX: ev.x,
          worldY: ev.y,
          worldZ: ev.z,
          radius: ev.wasBuilding ? 1.1 : 0.55,
          type: 'explosion',
        });
        water.wake(ev.x, ev.z, ev.wasBuilding ? 1.6 : 0.9);
        if (ev.wasBuilding) {
          for (const eid of buildingQuery(sim.world)) {
            if (Health.current[eid] <= 0) buildingRenderer.removeBuilding(eid);
          }
        }
      } else if (ev.type === 'hit' && (ev.ranged || ev.kind === 'splash' || ev.kind === 'spin')) {
        explosionEmitter.emit(new THREE.Vector3(ev.x, ev.y + 0.4, ev.z), 4);
      } else if (ev.type === 'heal' || ev.type === 'buff') {
        explosionEmitter.emit(new THREE.Vector3(ev.x, ev.y + 0.6, ev.z), 3);
      } else if (ev.type === 'ability') {
        explosionEmitter.emit(new THREE.Vector3(ev.x, ev.y + 0.8, ev.z), 12);
      } else if (ev.type === 'landscape') {
        const impact =
          ev.impact === 'malice' || ev.impact === 'void' || ev.impact === 'fire' ||
          ev.impact === 'ice' || ev.impact === 'tunnel' || ev.impact === 'explosion'
            ? ev.impact
            : 'explosion';
        voxelPhysics.applyImpact({
          worldX: ev.x,
          worldY: ev.y,
          worldZ: ev.z,
          radius: ev.radius,
          type: impact,
        });
        if (impact === 'explosion' || impact === 'ice') water.wake(ev.x, ev.z, 1.1);
        explosionEmitter.emit(new THREE.Vector3(ev.x, ev.y + 0.4, ev.z), 8);
      }
    }

    for (const eid of standeeQuery(sim.world)) {
      const group = standeeRenderer.getStandee(eid);
      if (!group) continue;
      if (Health.current[eid] <= 0) {
        group.visible = false;
        continue;
      }
      group.visible = true;
      const unitId = UnitType.id[eid] ?? 0;
      const flying = unitId === 123 || unitId === 134 || unitId === 143;
      const aquatic = unitId === 102;
      const surfaceY = flying
        ? voxelWorld.getSurfaceHeight(Position.x[eid], Position.z[eid])
        : voxelWorld.walkHeight(Position.x[eid], Position.z[eid], aquatic) + water.heightAt(Position.x[eid], Position.z[eid]);
      if (!flying && voxelWorld.isWater(Position.x[eid], Position.z[eid]) && (frameCount & 3) === 0) {
        water.wake(Position.x[eid], Position.z[eid], aquatic ? 0.12 : 0.28);
      }
      Position.y[eid] = surfaceY;
      group.position.set(Position.x[eid], surfaceY, Position.z[eid]);
      standeeRenderer.setHealth(eid, Health.max[eid] > 0 ? Health.current[eid] / Health.max[eid] : 1);
    }

    for (const eid of buildingQuery(sim.world)) {
      const mesh = buildingRenderer.getBuilding(eid);
      if (!mesh) continue;
      const surfaceY = voxelWorld.getSurfaceHeight(Position.x[eid], Position.z[eid]);
      Position.y[eid] = surfaceY;
      mesh.position.set(Position.x[eid], surfaceY, Position.z[eid]);
    }

    water.update(dt);
    explosionEmitter.update(dt);
    selectionBox.drawSelectionBox();

    // Hero lock: drive hero + soft-follow camera
    if (heroLock.locked && playerHeroEid !== undefined) {
      heroLock.setHeroPosition(
        Position.x[playerHeroEid],
        Position.y[playerHeroEid],
        Position.z[playerHeroEid],
      );
      const move = heroLock.update(dt, iso.getYaw());
      if (move) {
        Position.x[playerHeroEid] += move.dx;
        Position.z[playerHeroEid] += move.dz;
        Position.y[playerHeroEid] = voxelWorld.getSurfaceHeight(
          Position.x[playerHeroEid],
          Position.z[playerHeroEid],
        );
      }
      followPos.set(
        Position.x[playerHeroEid],
        Position.y[playerHeroEid],
        Position.z[playerHeroEid],
      );
    }

    const hasSelection = selection.getSelectedIds().length > 0;
    iso.update({
      dt,
      allowKeyboardPan: !heroLock.locked,
      // Free WASD for Stop/Attack/Move/Hold hotkeys while units are selected
      allowWasdPan: !hasSelection,
      keys: input.state.keys,
      mouseX: input.state.mouseX,
      mouseY: input.state.mouseY,
      mouseInView: input.state.mouseInView,
      follow: heroLock.locked ? followPos : null,
    });

    // Populous-style upright cutouts: yaw-billboard to camera, never pitch-lean
    const camYaw = iso.getYaw();
    standeeRenderer.faceCamera(camYaw);
    buildingRenderer.faceCamera(camYaw);
    trees.faceCamera(camYaw);

    const focus = iso.getTarget();
    post.setFocus(focus, iso.getFocusDistance());
    post.render(dt);
    input.resetFrameState();

    if (Math.floor(time / 100) !== Math.floor((time - dt * 1000) / 100)) {
      renderHUD();
    }
  }

  renderHUD();
  requestAnimationFrame(frame);

  // Debug handle for input/camera verification
  (window as unknown as { __pc: object }).__pc = {
    getCam: () => {
      const t = iso.getTarget();
      return {
        x: t.x,
        y: t.y,
        z: t.z,
        zoom: iso.getZoom(),
        yaw: iso.getYaw(),
        pitch: iso.getPitch(),
        heroLocked: heroLock.locked,
        mouseInView: input.state.mouseInView,
      };
    },
    getKeys: () => [...input.state.keys].sort(),
    setTarget: (x: number, y: number, z: number) => iso.setTarget(x, y, z),
    setZoom: (z: number) => iso.setZoom(z),
    /** Debug: force selected (or all player) units to attack nearest enemy unit. */
    forceAttackNearest: () => {
      const ids = selection.getSelectedIds();
      const pool = ids.length > 0 ? ids : allUnitEids.filter(
        (eid) => Faction.id[eid] === playerFaction && (Health.current[eid] ?? 0) > 0,
      );
      let foe = -1;
      let bestD = Infinity;
      for (const eid of allUnitEids) {
        if ((Health.current[eid] ?? 0) <= 0) continue;
        if (Faction.id[eid] === playerFaction) continue;
        const dx = Position.x[eid] - Position.x[pool[0]];
        const dz = Position.z[eid] - Position.z[pool[0]];
        const d = dx * dx + dz * dz;
        if (d < bestD) { bestD = d; foe = eid; }
      }
      if (foe < 0) return { foe: -1, attackers: 0 };
      for (const eid of pool) {
        // Close the gap so the hit lands this test
        Position.x[eid] = Position.x[foe] + (Math.random() - 0.5) * 1.5;
        Position.z[eid] = Position.z[foe] + (Math.random() - 0.5) * 1.5;
        Target.hasTarget[eid] = 1;
        Target.entity[eid] = foe;
        Target.x[eid] = Position.x[foe];
        Target.z[eid] = Position.z[foe];
        Pathfinding.hasPath[eid] = 0;
      }
      return { foe, foeHp: Health.current[foe], attackers: pool.length, foeType: UnitType.id[foe] };
    },
    getHp: (eid: number) => Health.current[eid],
    /** Advance sim manually (useful when rAF is throttled in background tabs). */
    tickSim: (n = 30) => {
      try {
        sim.step(n);
      } catch (e) {
        return { error: String(e), tick: getMeta(sim.world).time.tick };
      }
      const meta = getMeta(sim.world);
      return { tick: meta.time.tick, elapsed: meta.time.elapsed };
    },
    combatDiag: () => {
      const ids = allUnitEids.filter((e) => Faction.id[e] === playerFaction && Health.current[e] > 0);
      const sample = ids[0];
      if (sample === undefined) return { none: true, frames: frameCount };
      const foe = Target.entity[sample];
      const dx = Position.x[foe] - Position.x[sample];
      const dz = Position.z[foe] - Position.z[sample];
      const meta = getMeta(sim.world);
      return {
        sample,
        hasTarget: Target.hasTarget[sample],
        foe,
        foeHp: Health.current[foe],
        dist: Math.sqrt(dx * dx + dz * dz),
        range: Combat.range[sample],
        cooldown: Combat.cooldown[sample],
        damage: Combat.damage[sample],
        atkHp: Health.current[sample],
        tick: meta.time.tick,
        elapsed: meta.time.elapsed,
        frames: frameCount,
        simWorldOk: !!meta,
      };
    },
    focus: () => container.focus({ preventScroll: true }),
    getSelection: () => selection.getSelectedInfos(),
    selectAllPlayer: () => {
      const ids = allUnitEids.filter(
        (eid) => Faction.id[eid] === playerFaction && (Health.current[eid] ?? 0) > 0,
      );
      selection.selectIds(ids);
      return ids.length;
    },
    getUnitPos: (eid: number) => ({
      x: Position.x[eid],
      z: Position.z[eid],
      hasPath: Pathfinding.hasPath[eid] === 1,
      goalX: Pathfinding.goalX[eid],
      goalZ: Pathfinding.goalZ[eid],
    }),
  };

  console.log(
    '%c🏰 Project PaperCraft — Mid-Game Triforce Clash',
    'color: #ffcc00; font-size: 14px; font-weight: bold;',
  );
  console.log(
    `  Map: ${mapDef.name} | Units: ${allUnitEids.length} | Buildings: ${scenario.buildingEids.length}`,
  );
  console.log('  SW Hyrule · NW Dream Land · NE Malice');
  console.log(
    '  Camera: WASD pan · wheel zoom · Q/E orbit · Alt-drag orbit · Z/X pitch · MMB/Shift pan · F hero lock · Home reset',
  );
  console.log(
    '  Control: LMB select/marquee · RMB move/attack · A attack-move · S stop · H hold · Ctrl+1-9 groups · Esc clear',
  );
}

boot().catch(console.error);
