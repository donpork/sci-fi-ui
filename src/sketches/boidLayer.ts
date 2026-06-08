import type p5 from "p5";
import type { BoidParams } from "../lib/sceneData";
import {
  type Boid,
  v02PillSDF,
  v02InitBoids,
  v02SpawnUpToMinimum,
  v02FlockAndFilter,
  v02DrawAllBoids,
  v02PointerSpeedScale,
  v02InnerExclusionDepthPx,
} from "../../particles/boidSketch";

const LAST_DIRECTION = { x: 0, y: 1 };

const VEL_LERP = 0.38;
const BLAST_SPEED = 22;
const BLAST_FRAMES = 10;
const BLAST_TWIST = 0.3;

export type BoidLayerHandle = {
  draw(
    target: p5.Graphics,
    pillRect: { x: number; y: number; w: number; h: number },
    lightPos: { x: number; y: number },
    isDown: boolean,
    mouseVelX: number,
    mouseVelY: number,
    params: BoidParams
  ): void;
  resize(): void;
};

export function createBoidLayer(): BoidLayerHandle {
  let boids: Boid[] = [];
  let initialized = false;
  let mouseDownFrames = 0;
  let smVelX = 0;
  let smVelY = 0;
  let lastPillW = 0;
  let lastPillH = 0;

  return {
    draw(target, pillRect, lightPos, isDown, mouseVelX, mouseVelY, params) {
      const { x: cx, y: cy, w: cw, h: ch } = pillRect;
      if (cw <= 0 || ch <= 0) return;

      const prevSmVelX = smVelX;
      const prevSmVelY = smVelY;
      smVelX = smVelX + (mouseVelX - smVelX) * VEL_LERP;
      smVelY = smVelY + (mouseVelY - smVelY) * VEL_LERP;
      const mouseSpeed = Math.hypot(smVelX, smVelY);
      const accelMag = Math.hypot(smVelX - prevSmVelX, smVelY - prevSmVelY);

      const lx = lightPos.x;
      const ly = lightPos.y;
      const pointerInsidePill =
        lx >= 0 &&
        ly >= 0 &&
        v02PillSDF(lx, ly, cx, cy, cw, ch) <= 0;
      const effectLx = pointerInsidePill ? lx : -1;
      const effectLy = pointerInsidePill ? ly : -1;

      const ACTIVITY_SPEED_SCALE = 5;
      const mouseActivityIntensity = pointerInsidePill
        ? Math.max(0, Math.min(1, mouseSpeed / ACTIVITY_SPEED_SCALE))
        : 0;

      const wasDown = mouseDownFrames > 0;
      if (isDown) mouseDownFrames++;
      else mouseDownFrames = 0;
      const justClicked = isDown && !wasDown;

      if (justClicked && pointerInsidePill) {
        const blastRadius = Math.max(1, params.v02BlastRadius);
        for (const b of boids) {
          const dx = b.x - effectLx;
          const dy = b.y - effectLy;
          const dist = Math.hypot(dx, dy);
          if (dist > blastRadius || dist < 0.1) continue;
          const falloff = 1 - (dist / blastRadius) ** 2;
          const nx = dx / dist;
          const ny = dy / dist;
          const tx = -ny;
          const ty = nx;
          const mag = Math.hypot(nx + tx * BLAST_TWIST, ny + ty * BLAST_TWIST);
          const outX = mag > 0.001 ? (nx + tx * BLAST_TWIST) / mag : nx;
          const outY = mag > 0.001 ? (ny + ty * BLAST_TWIST) / mag : ny;
          b.vx = outX * BLAST_SPEED * falloff;
          b.vy = outY * BLAST_SPEED * falloff;
          b.blastFrames = Math.round(BLAST_FRAMES * falloff);
          b.perturbationDecay = 1.0;
        }
      }

      const {
        movementMode,
        v02LifeCycleFrames,
        v02InnerExclusionPct,
        v02SpawnOuterMarginPx,
        minLiveBoids,
        deathDistancePx,
        v02CenterSpeed,
        v02EdgeVelocityMultiplier,
        v02ConstantSpeedAtCenter,
        v02SepRadius,
        v02AlignRadius,
        v02CohesionRadius,
        v02SepWeight,
        v02AlignWeight,
        v02CohesionWeight,
        mouseAlignRadius,
        mouseAttractRadius,
        mouseAlignWeight,
        mouseAttractWeight,
        mouseAccelSensitivity,
        mouseMinSpeed,
        mouseDecayRate,
        mouseProximityLerpDown,
        v02BoidLength,
        v02BoidLineLength,
        themeSeedHex,
      } = params;

      const innerExclusionDepth = v02InnerExclusionDepthPx(
        v02InnerExclusionPct,
        cx, cy, cw, ch,
      );
      const spawnOuterMarginPx = Math.max(1, v02SpawnOuterMarginPx);

      if (!initialized || Math.abs(cw - lastPillW) > 10 || Math.abs(ch - lastPillH) > 10) {
        boids = v02InitBoids(
          cx, cy, cw, ch,
          v02LifeCycleFrames,
          movementMode,
          innerExclusionDepth,
          spawnOuterMarginPx,
          LAST_DIRECTION.x,
          LAST_DIRECTION.y,
        );
        initialized = true;
        lastPillW = cw;
        lastPillH = ch;
      }

      const speedScale = v02PointerSpeedScale(
        lx, ly,
        cx, cy, cw, ch,
        false,
        v02EdgeVelocityMultiplier,
        v02CenterSpeed,
        v02ConstantSpeedAtCenter,
      );

      v02SpawnUpToMinimum(
        boids,
        minLiveBoids,
        cx, cy, cw, ch,
        v02LifeCycleFrames,
        movementMode,
        innerExclusionDepth,
        spawnOuterMarginPx,
        LAST_DIRECTION.x,
        LAST_DIRECTION.y,
      );

      boids = v02FlockAndFilter(
        boids,
        cx, cy, cw, ch,
        movementMode,
        LAST_DIRECTION.x, LAST_DIRECTION.y,
        innerExclusionDepth,
        speedScale,
        effectLx, effectLy,
        isDown,
        mouseDownFrames,
        deathDistancePx,
        v02SepRadius,
        v02AlignRadius,
        v02CohesionRadius,
        v02SepWeight,
        v02AlignWeight,
        v02CohesionWeight,
        smVelX, smVelY,
        mouseSpeed, accelMag,
        mouseAlignRadius,
        mouseAttractRadius,
        mouseAlignWeight,
        mouseAttractWeight,
        mouseAccelSensitivity,
        mouseMinSpeed,
        mouseDecayRate,
        mouseProximityLerpDown,
      );

      target.push();
      v02DrawAllBoids(
        target,
        boids,
        v02BoidLength,
        v02BoidLineLength,
        themeSeedHex,
        effectLx,
        effectLy,
        mouseActivityIntensity,
      );
      target.pop();
    },

    resize() {
      initialized = false;
      boids = [];
      smVelX = 0;
      smVelY = 0;
      mouseDownFrames = 0;
    },
  };
}
