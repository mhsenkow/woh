# PD-BRIEF-WON-001 — Product Design Base

**Document ID:** PD-BRIEF-WON-001  
**Author:** Principal Product Design Architect (IC9)  
**Project Codename:** World of Nintendo (Project PaperCraft)  
**Target Architecture:** High-Concurrency Micro-Voxel RTS / Persistent Action-MMO Hybrid  
**Status:** Architectural Alignment & Pre-Production Greenlight  

---

## 1. Executive Summary & Product Thesis

World of Nintendo synthesizes the deterministic, readable macro-strategy of Warcraft II and StarCraft II with a hyper-optimized, modern rendering pipeline: **Micro-Voxel Terrain** paired with **2.5D Extruded Dielectric Cutout Sprites**.

At an IC9 product design level, our primary challenge is bridging massive unit concurrency (hundreds of units on screen across persistent territory control) with zero-ambiguity visual readability and a tiny memory footprint. By replacing skeletal-rigged 3D meshes with normal-mapped, thick-beveled 2.5D "board game standee" cutouts moving across destructible micro-voxel biomes, we achieve 120 FPS performance on modest hardware, rapid asset authoring, and a tactile, toybox aesthetic native to Nintendo's design DNA.

---

## 2. Visual & Rendering Architecture: "The Diorama Engine"

The graphical target honors the crisp, high-contrast isometric readability of late-90s/early-2010s Blizzard RTS titles while introducing a physical, material-driven art direction.

### 2.1 Micro-Voxel World Geometry

| Spec | Detail |
|------|--------|
| **Scale** | 0.25m micro-voxels (16× the volumetric resolution of standard 1m block games). Terrain reads as sculpted, stepped topography rather than coarse cubes. |
| **Gameplay Utility** | Terrain is fully deterministic and destructible. Bombchus, Bob-ombs, and Gordo impacts carve real craters into castle walls or divert water channels to flood enemy trenches. |
| **Memory & Streaming** | Chunk octrees compress terrain state into lightweight bitmasks, allowing instant network synchronization for massive multiplayer sieges. |

### 2.2 2.5D Extruded Cutout Entities ("Standees")

- **Geometry:** Characters and units are rendered as upright 2D planes with a 3D extruded cardboard/acrylic rim (Paper Mario meets Octopath Traveler HD-2D), grounded on small circular plinth bases.
- **Surface Shaders:** Multi-layered PBR materials — matte cardstock, holographic foil (elite/upgraded units), embossed gold leaf, and subsurface scattering when backlit by fireballs or lasers.
- **Directional Billboarding & Flipbook States:** 8-directional sprite facings with crisp, snapping 180° Y-axis flips on state changes. Damage states are physical: bent corners, scorched edges, or punch-out holes — not generic health bars alone.
- **Readability at Scale:** In a 200-unit clash, traditional 3D silhouettes turn into polygon soup. Upright cutouts with bold white or faction-colored die-cut borders guarantee instant unit identification at any zoom level.

---

## 3. Core Faction Matrix: The Dual-Alignment Trifecta

To capture the asymmetric strategic depth of StarCraft's 3-species model across a 2-alignment ("Order vs. Chaos") war, the launch roster maps **3 Realms × 2 Alignments = 6 Playable Factions**, where each pair embodies a distinct RTS archetype (Terran / Protoss / Zerg).

| Faction Name | Realm | Alignment | RTS Archetype | Core Mechanics & Economy |
|---|---|---|---|---|
| Hyrule Royal Guard | Hyrule | Order (Good) | Terran (Positional / Modular) | Combined-arms infantry, Goron siege artillery, Zora aquatic routing, and transformable Sheikah Turrets. |
| Ganon's Malice Horde | Hyrule | Chaos (Bad) | Zerg (Creep / Attrition) | Spreads Gloom/Malice Creep across micro-voxels; Bokoblin swarms resurrect during Blood Moon cycles. |
| Toadstool Collective | Mushroom | Order (Good) | Terran (Logistics / Bunker) | Warp Pipe underground transit networks; Toad builders hot-swap Item Block attachments onto structures. |
| The Koopa Troop | Mushroom | Chaos (Bad) | Protoss / Mech (Armored Siege) | High-durability Airships, Bullet Bill factories, Magikoopa geometry-warping buffs, and shell-ricochet physics. |
| Dream Land Star Guard | Popstar | Order (Good) | Protoss (Elite / Assimilation) | Low unit count, high power. Copy-Essence Matrix lets elite units absorb defeated enemy weapon traits. |
| NightMare & Dark Matter | Popstar | Chaos (Bad) | Zerg / Swarm (Parasitic) | Spawns Waddle Doo/Dark Matter husks via Star Rods; corrupts enemy micro-voxels into void tiles that drain shields. |

---

## 4. Core Gameplay Loops & Systems Design

### 4.1 The Dual-Scale Camera (RTS Macro to Action Micro)

- **Strategic Isometric View (Default):** Locked 55° isometric camera with orthographic-leaning FOV to preserve the "tabletop diorama" look. Players manage base building, resource harvesting (Rupees, Star Bits, Coins), and control groups.
- **Hero Commander Lock:** Players can toggle lock onto their Faction Hero (Link, Ganondorf, Mario, Bowser, Kirby, Marx/Dedede) for direct WASD/Twin-Stick micro-control during skirmishes while background macro queues execute via hotkeys.

### 4.2 Voxel-Integrated Base Building & Physics

- **Snap-Grid Fortifications:** Players build walls using Mushroom Bricks, Hyrule Castle Stone, or Dream Blocks directly on the micro-voxel grid.
- **Verticality & Line of Sight:** High ground provides a **+25% range bonus** and obscures fog-of-war. Cutout units physically stack on stepped voxel ridges like tabletop miniatures on tiered terrain.
- **Environmental Counters:**
  - Fire Bros / Din's Fire ignite wooden voxel bridges and dry grass biomes.
  - Ice Kirby / Zora Tunic freeze water voxels into traversable flanking bridges.
  - Bob-omb Squads tunnel underneath enemy turtle bases through soft dirt voxels.

---

## 5. UI, HUD & Information Architecture

As a Principal Designer, the HUD must celebrate the tactile materiality of the game without cluttering the viewport:

- **Diegetic Command Card:** Bottom-right 4×3 command grid styled as an embossed Collector's Binder / Arcade Control Deck. Hotkeys physically depress like mechanical switches when triggered.
- **Selection Plinths & Tethers:** Selecting a control group projects a crisp vector ring onto the micro-voxel floor underneath each character's cutout standee, color-coded by subgroup priority.
- **Zero-Clutter Health & Status:** Unit health is communicated via the Standee Base Ring (radial arc around the circular foot-base) and physical wear-and-tear on the cutout border — not floating UI bars.
- **Minimap Topology:** Flat, high-contrast 16-bit style cartographic map in the bottom-left corner, updating dynamically as micro-voxel terrain is destroyed or terraformed by Malice/Pipe networks.

---

## 6. Technical & Production Advantages (Why This Wins)

| Advantage | Rationale |
|-----------|-----------|
| **10× Asset Velocity** | A new unit requires 4–8 keyframe vectors with normal/specular maps — not sculpt, retopo, UV, rig, and weight-paint. A single senior illustrator can ship an entire unit line in two days. |
| **Deterministic Network Performance** | Cutout animations are state-driven flipbooks; terrain changes are RLE voxel diffs. Replay files and netcode packets stay kilobytes — enabling SC2-grade instant replay scrubbing and 4v4 chaos with zero desync. |
| **Distinctive Brand Safety** | Avoids the uncanny valley of realistic 3D mashups, framing the cross-IP war as an imaginative, living tabletop clash inside a giant diorama box. |
