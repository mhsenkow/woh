# ENG-BASE-WON-001 — Engineering Architecture Base

**Document ID:** ENG-BASE-WON-001  
**Source Brief:** PD-BRIEF-WON-001  
**Author:** Principal Product Design Architect (IC9) → Engineering Alignment  
**Project Codename:** World of Nintendo (Project PaperCraft)  
**Target Architecture:** High-Concurrency Micro-Voxel RTS / Persistent Action-MMO Hybrid  
**Status:** Architectural Alignment & Pre-Production Greenlight  

---

## 1. Engineering Thesis

Deliver hundreds of concurrent units on persistent, destructible territory with **zero-ambiguity readability**, a **tiny memory footprint**, and **120 FPS on modest hardware**.

Core stack bet:

1. **Micro-Voxel Terrain** — deterministic, destructible world geometry at 0.25m resolution.
2. **2.5D Extruded Cutout Entities ("Standees")** — billboarded flipbook units with extruded dielectric rims instead of skeletal 3D meshes.

This replaces mesh/rig pipelines with state-driven sprites + voxel diffs, enabling SC2-grade netcode determinism and rapid asset throughput.

---

## 2. Rendering Pipeline — "The Diorama Engine"

### 2.1 Micro-Voxel World Geometry

| Constraint | Spec |
|------------|------|
| Voxel scale | **0.25m** (16× volumetric resolution vs. standard 1m blocks) |
| Topology | Stepped / sculpted topography (not coarse cubes) |
| Mutability | Fully deterministic & destructible (craters, flood channels, tunnels) |
| Storage | Chunk **octrees** → compressed **bitmasks** for stream & sync |
| Sync model | Lightweight terrain bitmasks for massive multiplayer sieges |

**Gameplay → systems contracts:**

- Explosive impacts (Bombchu, Bob-omb, Gordo) mutate voxel occupancy and must produce identical results across clients.
- Water channel diversion / flooding is a first-class voxel state transition, not VFX-only.

### 2.2 Standee Entity Rendering

| Layer | Implementation Target |
|-------|----------------------|
| Geometry | Upright 2D plane + 3D extruded cardboard/acrylic rim + circular plinth base |
| Materials | Multi-layer PBR: matte cardstock, holographic foil (elite), embossed gold leaf, SSS under fire/laser backlight |
| Facing | **8-directional** flipbook billboarding; snap **180° Y-flip** on state changes |
| Damage viz | Physical cutout degradation (bent corners, scorched edges, punch-out holes) |
| Scale readability | Bold white / faction-colored die-cut borders for ID at any zoom (target: **200-unit** clashes) |

**Perf contract:** Prefer flipbook + extruded rim over skeletal meshes to keep draw/skin cost bounded under high concurrency.

---

## 3. Simulation & Faction Systems

Launch roster: **3 Realms × 2 Alignments = 6 factions**. Each pair maps to an RTS archetype and implies distinct sim systems.

| Faction | Realm | Alignment | Archetype | Engineering Hooks |
|---|---|---|---|---|
| Hyrule Royal Guard | Hyrule | Order | Terran (Positional / Modular) | Combined-arms AI; Goron siege; Zora aquatic pathing; Sheikah turret transform states |
| Ganon's Malice Horde | Hyrule | Chaos | Zerg (Creep / Attrition) | Malice/Gloom **creep voxel overlay**; Blood Moon resurrection cycle |
| Toadstool Collective | Mushroom | Order | Terran (Logistics / Bunker) | Warp Pipe **underground transit graph**; Item Block attachment hot-swap on structures |
| The Koopa Troop | Mushroom | Chaos | Protoss / Mech | Airship durability; Bullet Bill factory queues; Magikoopa geometry-warp buffs; shell ricochet physics |
| Dream Land Star Guard | Popstar | Order | Protoss (Elite / Assimilation) | Low-count elite units; **Copy-Essence Matrix** trait absorption from defeated enemies |
| NightMare & Dark Matter | Popstar | Chaos | Zerg / Swarm | Star Rod husk spawning; **void-tile corruption** draining shields |

---

## 4. Core Runtime Systems

### 4.1 Dual-Scale Camera & Control

| Mode | Spec |
|------|------|
| Strategic (default) | Locked **55°** isometric; orthographic-leaning FOV (tabletop diorama) |
| Macro actions | Base build, harvest (Rupees / Star Bits / Coins), control groups |
| Hero Commander Lock | Toggle lock to Faction Hero for WASD / Twin-Stick micro while macro queues continue via hotkeys |

**Heroes:** Link, Ganondorf, Mario, Bowser, Kirby, Marx/Dedede.

### 4.2 Voxel Base Building & Environment Physics

- **Snap-grid fortifications** on micro-voxel grid (Mushroom Bricks, Hyrule Castle Stone, Dream Blocks).
- **Verticality / LoS:** High ground → **+25% range**; fog-of-war occlusion; units stack on stepped ridges.
- **Environmental counters (must be sim-authoritative):**
  - Fire Bros / Din's Fire → ignite wooden bridges & dry grass voxels.
  - Ice Kirby / Zora Tunic → freeze water voxels into traversable bridges.
  - Bob-omb Squads → tunnel soft dirt under enemy bases.

---

## 5. UI / HUD — Client Presentation Contracts

| Element | Behavior |
|---------|----------|
| Command Card | Bottom-right **4×3** diegetic grid (Collector's Binder / Arcade Control Deck); hotkeys animate as mechanical depress |
| Selection | Vector ring projected onto voxel floor under each standee; subgroup color coding |
| Health / Status | **Standee Base Ring** radial arc + border wear — no floating bars over mass armies |
| Minimap | Bottom-left 16-bit cartographic map; live updates on voxel destroy / Malice / Pipe terraforming |

---

## 6. Production & Network Wins (Acceptance Drivers)

| Driver | Engineering Implication |
|--------|-------------------------|
| **10× asset velocity** | Unit pipeline = 4–8 keyframe vectors + normal/specular maps (no full sculpt/rig). Target: senior illustrator ships a unit line in ~2 days. |
| **Deterministic netcode** | Flipbook state machines + **RLE voxel diffs** → kilobyte packets/replays; SC2-grade scrubbing; 4v4 with zero desync. |
| **Brand / art risk control** | Explicitly avoid realistic 3D mashups; stick to diorama / standee presentation. |

---

## 7. Open Engineering Workstreams (Pre-Greenlight)

1. Voxel chunk octree format + bitmask compression + RLE delta protocol.
2. Standee renderer (8-dir billboard, rim extrusion, PBR material stack, damage mesh/mask).
3. Deterministic sim tick: combat, creep/void overlays, pipe transit graph, environmental voxel transitions.
4. Dual camera controller + hero lock input routing with background macro queue.
5. HUD presentation layer bound to selection/health rings (no floating bars at army scale).
6. Replay recorder/scrubber validated against voxel + flipbook state streams.
