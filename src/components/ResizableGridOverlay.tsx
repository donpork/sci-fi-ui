import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  type MutableRefObject,
} from "react";
import type { CellRect, SceneData } from "../lib/sceneData";
import { ShaderCanvas } from "./ShaderCanvas";
import type { LayoutPreset } from "../lib/layoutPreset";
import "./ResizableGridOverlay.css";

const MIN_SINGLE_W = 160;
const MIN_SINGLE_H = 120;
const SINGLE_DEFAULT_FRACTION = 0.6;

const SPECULAR_SPIN_DURATION_MS = 500;
const RIM_HOLD_RAMP_MS = 1500;
const RIM_SHORT_CLICK_THRESHOLD_MS = 150;
const RIM_SHORT_CLICK_RAMP_MS = 100;

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const u = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return u * u * (3 - 2 * u);
}

type Drag = {
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  pointerId: number;
  handle: HTMLElement;
};

type Props = {
  dataRef: MutableRefObject<SceneData>;
  layout: LayoutPreset;
  cellLabels: Record<string, string>;
  showDebugShader: boolean;
  showDebugGrid: boolean;
};

/**
 * Centered single glass cell with corner resize handle.
 */
export function ResizableGridOverlay({
  dataRef,
  layout,
  cellLabels,
  showDebugShader,
  showDebugGrid,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const cellsRef = useRef<HTMLDivElement | null>(null);
  const [debugShaderRects, setDebugShaderRects] = useState<CellRect[]>([]);
  const [debugGridRects, setDebugGridRects] = useState<CellRect[]>([]);
  const [singleW, setSingleW] = useState(0);
  const [singleH, setSingleH] = useState(0);

  const drag = useRef<Drag | null>(null);
  const moveListener = useRef<((e: PointerEvent) => void) | null>(null);
  const endPointerListener = useRef<((e: PointerEvent) => void) | null>(null);
  const glowRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  useLayoutEffect(() => {
    const parent = rootRef.current?.parentElement;
    if (!parent) return;
    setSingleW((w) => {
      if (w !== 0) return w;
      return Math.max(
        MIN_SINGLE_W,
        Math.round(parent.clientWidth * SINGLE_DEFAULT_FRACTION)
      );
    });
    setSingleH((h) => {
      if (h !== 0) return h;
      return Math.max(
        MIN_SINGLE_H,
        Math.round(parent.clientHeight * SINGLE_DEFAULT_FRACTION)
      );
    });
  }, []);

  const measureAndPushScene = useCallback(() => {
    const el = rootRef.current;
    const grid = cellsRef.current;
    const setSceneRects = (cellRects: CellRect[], containerRects: CellRect[]) => {
      dataRef.current = { ...dataRef.current, cellRects, containerRects };
      setDebugGridRects(cellRects);
      setDebugShaderRects(containerRects);
    };
    if (!el || !grid) {
      setSceneRects([], []);
      return;
    }
    const pw = el.clientWidth;
    const ph = el.clientHeight;
    if (pw <= 0 || ph <= 0) {
      setSceneRects([], []);
      return;
    }
    const rootRect = el.getBoundingClientRect();
    const rects: CellRect[] = [];
    const containerRects: CellRect[] = [];

    for (const cell of layout.cells) {
      if (cell.type === "empty") continue;
      const cellEl = grid.querySelector<HTMLElement>(`[data-cell-id="${cell.id}"]`);
      if (!cellEl) continue;
      const nr = cellEl.getBoundingClientRect();
      rects.push({
        id: cell.id,
        x: nr.left - rootRect.left,
        y: nr.top - rootRect.top,
        w: nr.width,
        h: nr.height,
      });
      const surface = cellEl.querySelector<HTMLElement>(".resizable-grid__cell-surface");
      const sr = surface ? surface.getBoundingClientRect() : nr;
      containerRects.push({
        id: cell.id,
        x: sr.left - rootRect.left,
        y: sr.top - rootRect.top,
        w: sr.width,
        h: sr.height,
      });
    }
    setSceneRects(rects, containerRects);
  }, [layout, dataRef, cellLabels]);

  useLayoutEffect(() => {
    measureAndPushScene();
  }, [measureAndPushScene, singleW, singleH]);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measureAndPushScene());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measureAndPushScene]);

  const endDrag = useCallback((ev?: PointerEvent) => {
    const d = drag.current;
    if (ev && d && ev.pointerId !== d.pointerId) return;
    if (d) {
      try {
        d.handle.releasePointerCapture(d.pointerId);
      } catch {
        // already lost capture
      }
    }
    const mm = moveListener.current;
    if (mm) document.removeEventListener("pointermove", mm);
    moveListener.current = null;
    const fe = endPointerListener.current;
    if (fe) {
      window.removeEventListener("pointerup", fe, true);
      window.removeEventListener("pointercancel", fe, true);
      endPointerListener.current = null;
    }
    drag.current = null;
  }, []);

  useEffect(
    () => () => {
      const mm = moveListener.current;
      if (mm) document.removeEventListener("pointermove", mm);
      const fe = endPointerListener.current;
      if (fe) {
        window.removeEventListener("pointerup", fe, true);
        window.removeEventListener("pointercancel", fe, true);
      }
      if (drag.current) {
        try {
          drag.current.handle.releasePointerCapture(drag.current.pointerId);
        } catch {
          // ignore
        }
        drag.current = null;
      }
    },
    []
  );

  const updateLightFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const el = rootRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
      dataRef.current = { ...dataRef.current, lightPos: { x, y } };
    },
    [dataRef]
  );

  const onRootPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updateLightFromClient(e.clientX, e.clientY);
    const root = rootRef.current;
    if (!root) return;
    const raw = e.target;
    const hitEl =
      raw instanceof Element ? raw : raw instanceof Node ? raw.parentElement : null;
    const surface = hitEl?.closest(".resizable-grid__cell-surface") ?? null;
    const overSurface =
      surface !== null && surface instanceof HTMLElement && root.contains(surface);
    dataRef.current = { ...dataRef.current, pointerOverSurface: overSurface };
  };

  const onRootPointerLeave = () => {
    dataRef.current = {
      ...dataRef.current,
      pointerOverSurface: false,
      lightPos: { x: -1, y: -1 },
    };
  };

  const clearRimHold = useCallback(() => {
    const scene = dataRef.current;
    if (!scene.rimHoldPointerDown) return;
    const nowMs = performance.now();
    const elapsedMs =
      scene.rimHoldStartTimeMs !== null
        ? Math.max(0, nowMs - scene.rimHoldStartTimeMs)
        : 0;
    const holdMul = 1.0 + 3.0 * smoothstep(0, RIM_HOLD_RAMP_MS, elapsedMs);
    const isShortClick = elapsedMs < RIM_SHORT_CLICK_THRESHOLD_MS;
    dataRef.current = {
      ...scene,
      rimHoldPointerDown: false,
      rimReleaseCellId: scene.rimHoldCellId,
      rimReleaseStartTimeMs: nowMs,
      rimReleaseFromMul: isShortClick ? 4.0 : holdMul,
      rimReleaseMode: isShortClick ? "shortClick" : "hold",
      rimShortPulseRampMs: isShortClick ? RIM_SHORT_CLICK_RAMP_MS : null,
      rimHoldStartTimeMs: null,
      rimHoldCellId: null,
    };
  }, [dataRef]);

  useEffect(() => {
    const onPointerEnd = () => clearRimHold();
    window.addEventListener("pointerup", onPointerEnd, true);
    window.addEventListener("pointercancel", onPointerEnd, true);
    return () => {
      window.removeEventListener("pointerup", onPointerEnd, true);
      window.removeEventListener("pointercancel", onPointerEnd, true);
    };
  }, [clearRimHold]);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const enabled = dataRef.current.glassParams.domBorderGlowEnabled;
      if (!enabled) {
        glowRefsRef.current.forEach((el) => {
          el.style.opacity = "0";
        });
      } else {
        const dirs = dataRef.current.specDirByCellId;
        glowRefsRef.current.forEach((el, cellId) => {
          const dir = dirs[cellId];
          if (!dir) return;
          el.style.setProperty(
            "--glow-angle",
            `${Math.atan2(dir[1], dir[0]) * (180 / Math.PI) + 90}deg`
          );
        });
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [dataRef]);

  const onCellPointerDown =
    (cellId: string) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const el = rootRef.current;
      if (!el) return;
      const cr = dataRef.current.containerRects.find((r) => r.id === cellId);
      if (!cr || cr.w <= 0 || cr.h <= 0) return;
      const rootRect = el.getBoundingClientRect();
      const x = Math.min(
        Math.max(e.clientX - rootRect.left, 0),
        rootRect.width
      );
      const y = Math.min(
        Math.max(e.clientY - rootRect.top, 0),
        rootRect.height
      );
      if (x < cr.x || x > cr.x + cr.w || y < cr.y || y > cr.y + cr.h) return;
      const cx = cr.x + cr.w * 0.5;
      const cy = cr.y + cr.h * 0.5;
      const localX = (x - cx) / Math.max(cr.w * 0.5, 1.0);
      const localY = (y - cy) / Math.max(cr.h * 0.5, 1.0);
      const sx = Math.max(-1.0, Math.min(1.0, localX));
      const sy = Math.max(-1.0, Math.min(1.0, localY));
      const len = Math.hypot(sx, sy);
      let nx = sx;
      let ny = sy;
      if (len < 1e-5) {
        nx = 0;
        ny = -1;
      } else {
        nx /= len;
        ny /= len;
      }
      e.preventDefault();
      const scene = dataRef.current;
      const nowMs = performance.now();
      const normalPx = 0.25 * Math.min(rootRect.width, rootRect.height);
      const cellSize = Math.sqrt(cr.w * cr.h);
      const sizeRatio = Math.max(0.5, Math.min(2.0, cellSize / Math.max(normalPx, 1)));
      const decayMs = Math.round(Math.max(1000, Math.min(4000, 2000 * sizeRatio)));
      const orbitMs = Math.round(Math.min(1000, SPECULAR_SPIN_DURATION_MS * sizeRatio));
      updateLightFromClient(e.clientX, e.clientY);
      dataRef.current = {
        ...scene,
        pointerOverSurface: true,
        rimHoldPointerDown: true,
        rimHoldCellId: cr.id,
        rimHoldStartTimeMs: nowMs,
        rimReleaseCellId: null,
        rimReleaseStartTimeMs: null,
        rimReleaseFromMul: null,
        rimReleaseMode: null,
        rimShortPulseRampMs: null,
        specularSpin: {
          cellId: cr.id,
          startTimeMs: nowMs,
          durationMs: orbitMs,
          startSpecDirX: nx,
          startSpecDirY: ny,
        },
        specularModulation: {
          cellId: cr.id,
          startTimeMs: nowMs,
          durationMs: orbitMs,
          peakPhase: 0.5,
          decayMs,
          peakSpecularIntensityMul: 3.0,
          peakSpecularPowerMul: 0.5,
          peakDispersionHueShiftMul: 3.5,
          peakDispersionSpreadMul: 4.0,
          peakSpecDispersionAmountMul: 5.0,
        },
      };
    };

  const onCellGlowMove =
    (cellId: string) => (_e: React.PointerEvent<HTMLDivElement>) => {
      if (!dataRef.current.glassParams.domBorderGlowEnabled) return;
      const el = glowRefsRef.current.get(cellId);
      if (!el) return;
      el.style.opacity = "1";
    };

  const onCellGlowLeave =
    (cellId: string) => (_e: React.PointerEvent<HTMLDivElement>) => {
      const el = glowRefsRef.current.get(cellId);
      if (!el) return;
      el.style.opacity = "0";
    };

  const onPointerDownSingle = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: singleW,
      startH: singleH,
      pointerId: e.pointerId,
      handle,
    };
    const onMove = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d || ev.pointerId !== d.pointerId) return;
      const parent = rootRef.current?.parentElement;
      const maxW = parent ? parent.clientWidth : d.startW;
      const maxH = parent ? parent.clientHeight : d.startH;
      setSingleW(Math.max(MIN_SINGLE_W, Math.min(maxW, d.startW + ev.clientX - d.startX)));
      setSingleH(Math.max(MIN_SINGLE_H, Math.min(maxH, d.startH + ev.clientY - d.startY)));
    };
    const onPointerEnd = (ev: PointerEvent) => {
      endDrag(ev);
    };
    moveListener.current = onMove;
    endPointerListener.current = onPointerEnd;
    document.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onPointerEnd, true);
    window.addEventListener("pointercancel", onPointerEnd, true);
  };

  const gridStyle = {
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
  } as const;

  const rootStyle =
    singleW > 0 && singleH > 0
      ? ({ width: singleW, height: singleH } as const)
      : undefined;

  const cell = layout.cells[0]!;
  const label = cellLabels[cell.id] ?? "";

  return (
    <div
      ref={rootRef}
      className="resizable-grid resizable-grid--single"
      style={rootStyle}
      onPointerMove={onRootPointerMove}
      onPointerLeave={onRootPointerLeave}
    >
      <ShaderCanvas
        dataRef={dataRef}
        className="shader-canvas__host resizable-grid__canvas-host"
      />
      <div
        ref={cellsRef}
        className="resizable-grid__cells"
        style={gridStyle}
        role="grid"
        aria-label="Shader cell"
      >
        <div
          data-cell-id={cell.id}
          className="resizable-grid__cell"
          role="gridcell"
          style={{
            gridColumn: `${cell.col + 1} / span ${cell.colSpan}`,
            gridRow: `${cell.row + 1} / span ${cell.rowSpan}`,
          }}
          onPointerDown={onCellPointerDown(cell.id)}
          onPointerMove={onCellGlowMove(cell.id)}
          onPointerLeave={onCellGlowLeave(cell.id)}
        >
          <div className="resizable-grid__cell-chrome">
            <div
              className="resizable-grid__cell-glow"
              ref={(el) => {
                if (el) glowRefsRef.current.set(cell.id, el);
                else glowRefsRef.current.delete(cell.id);
              }}
            />
            <div className="resizable-grid__cell-surface">
              {label ? (
                <span className="resizable-grid__cell-text">{label}</span>
              ) : (
                <span
                  className="resizable-grid__cell-text resizable-grid__cell-text--empty"
                  aria-hidden
                >
                  &nbsp;
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="resizable-grid__split resizable-grid__split--single-corner"
        aria-label="Resize cell"
        onPointerDown={onPointerDownSingle}
      >
        <span className="resizable-grid__split-plus" aria-hidden>
          +
        </span>
      </button>
      {(showDebugGrid || showDebugShader) && (
        <div className="resizable-grid__debug-overlay" aria-hidden>
          {showDebugGrid &&
            debugGridRects.map((rect) => (
              <div
                key={`grid-${rect.id}`}
                className="resizable-grid__debug-rect resizable-grid__debug-rect--grid"
                style={{
                  left: `${rect.x}px`,
                  top: `${rect.y}px`,
                  width: `${rect.w}px`,
                  height: `${rect.h}px`,
                }}
              />
            ))}
          {showDebugShader &&
            debugShaderRects.map((rect) => (
              <div
                key={`shader-${rect.id}`}
                className="resizable-grid__debug-rect resizable-grid__debug-rect--shader"
                style={{
                  left: `${rect.x}px`,
                  top: `${rect.y}px`,
                  width: `${rect.w}px`,
                  height: `${rect.h}px`,
                }}
              />
            ))}
        </div>
      )}
    </div>
  );
}
