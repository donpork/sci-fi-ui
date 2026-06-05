---
name: particle-system
description: >-
  Current app-specific notes for the boid particle layer inside the single glass
  pill: rendering path, pointer inputs, hardcoded parameters, and the controls
  that belong in a future Particles menu.
---

# Particle System

This app renders the particle system as boid line segments inside the single
glass pill. The active implementation is smaller than the older standalone V02
prototype: `particles/boidSketch.ts` still owns the boid math, but the app uses
it through `src/sketches/boidLayer.ts`.

## Current Files

- `src/components/ShaderCanvas.tsx`: mounts exactly one p5 WEBGL instance and
  removes it on cleanup.
- `src/sketches/gridShader.ts`: creates `bgLayer`, calls `createBoidLayer()`,
  draws particles into `bgLayer`, then samples that layer in the glass shader.
- `src/sketches/boidLayer.ts`: app adapter with hardcoded particle params and
  draw/reset lifecycle.
- `particles/boidSketch.ts`: shared boid helpers: pill SDF, spawn, flocking,
  mouse interaction, HCT color, and line drawing.
- `src/components/ResizableGridOverlay.tsx`: measures pill rects and writes
  pointer state into `dataRef.current`.
- `src/lib/sceneData.ts`: current runtime data shape. It only exposes
  `boidEnabled`; the rest of particle tuning is still internal to
  `boidLayer.ts`.

Ignore the old `createBoidSketch()` path in `particles/boidSketch.ts` unless
reviving the standalone particle prototype. The app path is `createBoidLayer()`
inside the existing grid shader.

## Runtime Flow

```text
ResizableGridOverlay
  -> dataRef.current.lightPos, rimHoldPointerDown, containerRects
ShaderCanvas
  -> createGridShaderSketch(dataRef)
gridShader.drawBackgroundLayer()
  -> boidLayer.draw(bgLayer, first container rect, lightPos, isDown, mouse velocity)
boidLayer
  -> v02InitBoids / v02SpawnUpToMinimum / v02FlockAndFilter / v02DrawAllBoids
cell.frag
  -> samples bgLayer through uBackground inside the glass pill
```

Coordinate space is scene space: `(0, 0)` is the top-left of the
`ResizableGridOverlay` root. Particles use `containerRects[0]`, which is the
glass pill surface. Pointer forces and bright color activity are gated by
`v02PillSDF(lightPos, pillRect) <= 0`; outside the pill, the boid layer passes
`-1, -1` as the effect position.

## Current Particle Defaults

These live in `PARAMS` in `src/sketches/boidLayer.ts`.

| Control label | Param | Current value | Effect |
| --- | --- | ---: | --- |
| Enabled | `SceneData.boidEnabled` | `true` | Render particles into `bgLayer` |
| Movement mode | `movementMode` | `isocontour` | Orbit pill contours instead of linear flow |
| Min live | `minLiveBoids` | `350` | Target live boid count |
| Edge buffer | `deathDistancePx` | `12` | Kill boids beyond pill SDF buffer |
| Stroke width | `v02BoidLength` | `2.5` | p5 stroke weight |
| Boid length | `v02BoidLineLength` | `6` | Line segment length multiplier |
| Seed color | `themeSeedHex` | `#6688cc` | HCT base hue/chroma |
| Life frames | `v02LifeCycleFrames` | `180` | Max age baseline |
| Inner exclusion | `v02InnerExclusionDepth` | `9999` | Disables practical center exclusion |
| Spawn margin | `v02SpawnOuterMarginPx` | `8` | Spawn band distance from wall |
| Blast radius | `v02BlastRadius` | `130` | First click impulse radius |
| Center speed | `v02CenterSpeed` | `0.55` | Fixed speed scale when constant speed is on |
| Edge speed x | `v02EdgeVelocityMultiplier` | `1.0` | Extra edge speed when variable speed is used |
| Constant speed | `v02ConstantSpeedAtCenter` | `true` | Uses `v02CenterSpeed` instead of pointer-distance speed |
| Sep radius / weight | `v02SepRadius`, `v02SepWeight` | `24`, `1.2` | Separation |
| Align radius / weight | `v02AlignRadius`, `v02AlignWeight` | `36`, `1.0` | Neighbor velocity matching |
| Cohesion radius / weight | `v02CohesionRadius`, `v02CohesionWeight` | `42`, `0.8` | Neighbor centering |
| Mouse align radius / weight | `mouseAlignRadius`, `mouseAlignWeight` | `80`, `0.6` | Match pointer velocity |
| Mouse attract radius / weight | `mouseAttractRadius`, `mouseAttractWeight` | `80`, `0.8` | Pull toward moving pointer |
| Mouse accel sensitivity | `mouseAccelSensitivity` | `1.0` | Boost pursuit on acceleration |
| Mouse min speed | `mouseMinSpeed` | `0.5` | Suppress align/attract below this speed |
| Mouse decay time | `mouseDecayRate` | `1.5` | Color perturbation memory |
| Proximity down lerp | `mouseProximityLerpDown` | `0.04` | Hover color decay rate |

## If Adding A Particles Menu

Add the chip after `Light` and before `Debug` in `src/App.tsx`. Start with the
controls above that directly map to `PARAMS`. Keep React state for visible UI,
but avoid per-frame `setState`; pass live values through the existing
`dataRef.current` pattern or a stable params ref read by `boidLayer.draw()`.

Do not move pointer hit-testing into p5. React owns pointer routing and pill
measurement; the boid layer should only consume `lightPos`, mouse velocity,
`rimHoldPointerDown`, and the measured pill rect.

## Behavior To Preserve

- One p5 WEBGL canvas only; no second particle canvas.
- Particles draw into `bgLayer` with `globalCompositeOperation = "lighter"`
  before labels/cursor reflections and before the glass shader samples
  `uBackground`.
- `boidLayer.resize()` resets the boid population when the p5 canvas size
  changes; `boidLayer.draw()` also reinitializes if the pill dimensions change
  significantly.
- First click inside the pill triggers a blast; held click applies sustained
  repel through `v02FlockAndFilter`.
- Hover alone subtly lifts local color through `proximityFraction`; movement
  adds pursuit/alignment and brighter HCT color.
- Boids remain clipped behaviorally by pill SDF: they die when
  `v02PillSDF(b.x, b.y, pillRect) > deathDistancePx`.

For grid/canvas coordinate alignment, also read
`../dom-grid-webgl-alignment/SKILL.md`.
