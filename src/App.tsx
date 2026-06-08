import { useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import { ResizableGridOverlay } from "./components/ResizableGridOverlay";
import { makeLabelsFromPreset } from "./lib/cellLabelGrid";
import { PRESET_SINGLE } from "./lib/layoutPreset";
import type { BoidParams, GlassParams, SceneData } from "./lib/sceneData";
import "./App.css";

const CELL_LABELS = makeLabelsFromPreset(PRESET_SINGLE);

const BOID_PARAMS_DEFAULTS: BoidParams = {
  minLiveBoids: 2000,
  deathDistancePx: 12,
  v02BoidLength: 2,
  v02BoidLineLength: 4,
  themeSeedHex: "#6688cc",
  v02LifeCycleFrames: 500,
  movementMode: "isocontour",
  v02ConstantSpeedAtCenter: true,
  v02CenterSpeed: 0.3,
  v02EdgeVelocityMultiplier: 1.0,
  v02InnerExclusionDepth: 0,
  v02SpawnOuterMarginPx: 8,
  v02BlastRadius: 800,
  v02SepRadius: 24,
  v02SepWeight: 1.3,
  v02AlignRadius: 36,
  v02AlignWeight: 1.0,
  v02CohesionRadius: 42,
  v02CohesionWeight: 1.0,
  mouseAlignRadius: 200,
  mouseAlignWeight: 2.0,
  mouseAttractRadius: 180,
  mouseAttractWeight: 4.0,
  mouseAccelSensitivity: 2.0,
  mouseMinSpeed: 0.3,
  mouseDecayRate: 1.5,
  mouseProximityLerpDown: 1.0,
};
const GLASS_DEFAULTS: GlassParams = {
  lightDirXY: [1.0, -1.0],
  keyLightIntensity: 1.0,
  keyLightZ: 0.85,
  specularLightXY: [1.0, 1.0],
  specularFollowPointer: true,
  domBorderGlowEnabled: false,
  specularPower: 60,
  specularIntensity: 2.0,
  rimPower: 0.3,
  rimIntensity: 0.3,
  flatPow: 5.0,
  plateau: 0.1,
  refractionStrength: 4.0,
  edgeSoftness: 2.0,
  dispersionHueShift: 0.2,
  dispersionSaturation: 1.0,
  dispersionSpread: 0.25,
  dispersionSharpness: 3.0,
  dispersionFocus: 0.3,
  specDispersionAmount: 0.45,
  envReflection: 0.1,
  boxLightEnabled: false,
  boxLightIntensity: 0.5,
  boxLightSoftness: 0.8,
  boxLightSize: [0.5, 0.5],
  boxLightPosXY: [0.0, 0.0],
  bevelEnabled: true,
  bevelStrength: 1.0,
  bevelWidthPx: 12,
  bevelExponent: 4,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function App() {
  const dataRef = useRef<SceneData>({
    lightPos: { x: 0, y: 0 },
    pointerOverSurface: false,
    rimHoldPointerDown: false,
    rimHoldCellId: null,
    rimHoldStartTimeMs: null,
    rimReleaseCellId: null,
    rimReleaseStartTimeMs: null,
    rimReleaseFromMul: null,
    rimReleaseMode: null,
    rimShortPulseRampMs: null,
    cellRects: [],
    containerRects: [],
    cellLabels: CELL_LABELS,
    glassParams: GLASS_DEFAULTS,
    specularSpin: null,
    specularModulation: null,
    specDirByCellId: {},
    boidEnabled: true,
    boidParams: BOID_PARAMS_DEFAULTS,
  });
  const [glassParams, setGlassParams] = useState<GlassParams>(GLASS_DEFAULTS);
  const [showDebugShader, setShowDebugShader] = useState(false);
  const [showDebugGrid, setShowDebugGrid] = useState(false);
  const [panelGlass, setPanelGlass] = useState(false);
  const [panelLight, setPanelLight] = useState(false);
  const [panelParticles, setPanelParticles] = useState(false);
  const [panelDebug, setPanelDebug] = useState(false);
  const [boidParams, setBoidParams] = useState<BoidParams>(BOID_PARAMS_DEFAULTS);

  useLayoutEffect(() => {
    dataRef.current = { ...dataRef.current, glassParams };
  }, [glassParams]);

  useLayoutEffect(() => {
    dataRef.current = { ...dataRef.current, boidParams };
  }, [boidParams]);

  const onGlassParam =
    (key: keyof GlassParams) => (e: ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      if (!Number.isFinite(n)) return;
      setGlassParams((prev) => {
        if (
          key === "lightDirXY" ||
          key === "specularLightXY" ||
          key === "specularFollowPointer"
        )
          return prev;
        if (key === "keyLightIntensity") {
          return { ...prev, keyLightIntensity: clamp(n, 0.0, 2.0) };
        }
        if (key === "keyLightZ") {
          return { ...prev, keyLightZ: clamp(n, 0.05, 2.0) };
        }
        if (key === "boxLightSize" || key === "boxLightPosXY")
          return prev;
        if (key === "boxLightEnabled" || key === "bevelEnabled" || key === "domBorderGlowEnabled")
          return prev;
        if (key === "specularPower") {
          return { ...prev, specularPower: clamp(n, 1.0, 256.0) };
        }
        if (key === "specularIntensity") {
          return { ...prev, specularIntensity: clamp(n, 0.0, 3.0) };
        }
        if (key === "rimPower") {
          return { ...prev, rimPower: clamp(n, 0.1, 8.0) };
        }
        if (key === "rimIntensity") {
          return { ...prev, rimIntensity: clamp(n, 0.0, 2.0) };
        }
        if (key === "flatPow") {
          return { ...prev, flatPow: clamp(n, 1.0, 8.0) };
        }
        if (key === "plateau") {
          return { ...prev, plateau: clamp(n, 0.0, 0.8) };
        }
        if (key === "refractionStrength") {
          return { ...prev, refractionStrength: clamp(n, 0.0, 32.0) };
        }
        if (key === "boxLightIntensity") {
          return { ...prev, boxLightIntensity: clamp(n, 0.0, 2.0) };
        }
        if (key === "boxLightSoftness") {
          return { ...prev, boxLightSoftness: clamp(n, 0.01, 0.8) };
        }
        if (key === "bevelStrength") {
          return { ...prev, bevelStrength: clamp(n, 0.0, 1.0) };
        }
        if (key === "bevelWidthPx") {
          return { ...prev, bevelWidthPx: clamp(n, 1.0, 32.0) };
        }
        if (key === "bevelExponent") {
          return { ...prev, bevelExponent: clamp(n, 1.0, 16.0) };
        }
        if (key === "dispersionHueShift") {
          return { ...prev, dispersionHueShift: clamp(n, -3.14159, 3.14159) };
        }
        if (key === "dispersionSaturation") {
          return { ...prev, dispersionSaturation: clamp(n, 0.0, 1.0) };
        }
        if (key === "dispersionSpread") {
          return { ...prev, dispersionSpread: clamp(n, 0.25, 3.0) };
        }
        if (key === "dispersionSharpness") {
          return { ...prev, dispersionSharpness: clamp(n, 0.0, 3.0) };
        }
        if (key === "dispersionFocus") {
          return { ...prev, dispersionFocus: clamp(n, 0.0, 1.0) };
        }
        if (key === "specDispersionAmount") {
          return { ...prev, specDispersionAmount: clamp(n, 0.0, 1.0) };
        }
        if (key === "envReflection") {
          return { ...prev, envReflection: clamp(n, 0.0, 3.0) };
        }
        if (key === "edgeSoftness") {
          return { ...prev, edgeSoftness: clamp(n, 0.2, 4.0) };
        }
        return prev;
      });
    };

  const onLightDir = (axis: 0 | 1) => (e: ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      if (!Number.isFinite(n)) return;
      setGlassParams((prev) => {
        const lightDirXY: [number, number] = [...prev.lightDirXY];
        lightDirXY[axis] = clamp(n, -1.0, 1.0);
        return { ...prev, lightDirXY };
      });
    };

  const onSpecularLight =
    (axis: 0 | 1) => (e: ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      if (!Number.isFinite(n)) return;
      setGlassParams((prev) => {
        const specularLightXY: [number, number] = [...prev.specularLightXY];
        specularLightXY[axis] = clamp(n, -1.0, 1.0);
        return { ...prev, specularLightXY };
      });
    };

  const onSpecularFollowPointer = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setGlassParams((prev) => ({ ...prev, specularFollowPointer: checked }));
  };

  const onDomBorderGlowEnabled = (e: ChangeEvent<HTMLInputElement>) => {
    setGlassParams((prev) => ({ ...prev, domBorderGlowEnabled: e.target.checked }));
  };

  const onBoxLightEnabled = (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setGlassParams((prev) => ({ ...prev, boxLightEnabled: checked }));
  };

  const onBevelEnabled = (e: ChangeEvent<HTMLInputElement>) => {
    setGlassParams((prev) => ({ ...prev, bevelEnabled: e.target.checked }));
  };

  const onBoxLightSize = (axis: 0 | 1) => (e: ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    if (!Number.isFinite(n)) return;
    setGlassParams((prev) => {
      const boxLightSize: [number, number] = [...prev.boxLightSize];
      boxLightSize[axis] = clamp(n, 0.05, 0.8);
      return { ...prev, boxLightSize };
    });
  };

  const onBoxLightPos = (axis: 0 | 1) => (e: ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    if (!Number.isFinite(n)) return;
    setGlassParams((prev) => {
      const boxLightPosXY: [number, number] = [...prev.boxLightPosXY];
      boxLightPosXY[axis] = clamp(n, 0.0, 1.0);
      return { ...prev, boxLightPosXY };
    });
  };

  const onBoidParam =
    (key: keyof BoidParams) => (e: ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      if (!Number.isFinite(n)) return;
      setBoidParams((prev) => {
        if (key === "minLiveBoids") return { ...prev, minLiveBoids: Math.max(0, Math.min(10000, Math.round(n))) };
        if (key === "deathDistancePx") return { ...prev, deathDistancePx: clamp(n, 0, 100) };
        if (key === "v02BoidLength") return { ...prev, v02BoidLength: clamp(n, 0.5, 10) };
        if (key === "v02BoidLineLength") return { ...prev, v02BoidLineLength: clamp(n, 1, 40) };
        if (key === "v02LifeCycleFrames") return { ...prev, v02LifeCycleFrames: Math.max(10, Math.round(n)) };
        if (key === "v02CenterSpeed") return { ...prev, v02CenterSpeed: clamp(n, 0, 2) };
        if (key === "v02EdgeVelocityMultiplier") return { ...prev, v02EdgeVelocityMultiplier: clamp(n, 0, 4) };
        if (key === "v02InnerExclusionDepth") return { ...prev, v02InnerExclusionDepth: clamp(n, 0, 800) };
        if (key === "v02SpawnOuterMarginPx") return { ...prev, v02SpawnOuterMarginPx: Math.max(1, n) };
        if (key === "v02BlastRadius") return { ...prev, v02BlastRadius: Math.max(1, n) };
        if (key === "v02SepRadius") return { ...prev, v02SepRadius: Math.max(1, n) };
        if (key === "v02SepWeight") return { ...prev, v02SepWeight: clamp(n, 0, 5) };
        if (key === "v02AlignRadius") return { ...prev, v02AlignRadius: Math.max(1, n) };
        if (key === "v02AlignWeight") return { ...prev, v02AlignWeight: clamp(n, 0, 5) };
        if (key === "v02CohesionRadius") return { ...prev, v02CohesionRadius: Math.max(1, n) };
        if (key === "v02CohesionWeight") return { ...prev, v02CohesionWeight: clamp(n, 0, 5) };
        if (key === "mouseAlignRadius") return { ...prev, mouseAlignRadius: Math.max(1, n) };
        if (key === "mouseAlignWeight") return { ...prev, mouseAlignWeight: clamp(n, 0, 10) };
        if (key === "mouseAttractRadius") return { ...prev, mouseAttractRadius: Math.max(1, n) };
        if (key === "mouseAttractWeight") return { ...prev, mouseAttractWeight: clamp(n, 0, 10) };
        if (key === "mouseAccelSensitivity") return { ...prev, mouseAccelSensitivity: clamp(n, 0, 10) };
        if (key === "mouseMinSpeed") return { ...prev, mouseMinSpeed: clamp(n, 0, 10) };
        if (key === "mouseDecayRate") return { ...prev, mouseDecayRate: clamp(n, 0.001, 10) };
        if (key === "mouseProximityLerpDown") return { ...prev, mouseProximityLerpDown: clamp(n, 0.001, 1) };
        return prev;
      });
    };

  const onBoidMovementMode = (e: ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === "isocontour" || v === "flow") {
      setBoidParams((prev) => ({ ...prev, movementMode: v }));
    }
  };

  const onBoidConstantSpeed = (e: ChangeEvent<HTMLInputElement>) => {
    setBoidParams((prev) => ({ ...prev, v02ConstantSpeedAtCenter: e.target.checked }));
  };

  const onBoidSeedColor = (e: ChangeEvent<HTMLInputElement>) => {
    setBoidParams((prev) => ({ ...prev, themeSeedHex: e.target.value }));
  };

  const onBoidEnabled = (e: ChangeEvent<HTMLInputElement>) => {
    dataRef.current = { ...dataRef.current, boidEnabled: e.target.checked };
  };

  const onDebugShader = (e: ChangeEvent<HTMLInputElement>) => {
    setShowDebugShader(e.target.checked);
  };

  const onDebugGrid = (e: ChangeEvent<HTMLInputElement>) => {
    setShowDebugGrid(e.target.checked);
  };

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__title-row">
          <h1>Sci-Fi-UI</h1>
        </div>
        <div
          className="app__filter-chips"
          role="toolbar"
          aria-label="Control panels"
        >
          <button
            type="button"
            className={
              panelGlass ? "app__chip app__chip--on" : "app__chip"
            }
            aria-pressed={panelGlass}
            onClick={() => setPanelGlass((v) => !v)}
          >
            Glass
          </button>
          <button
            type="button"
            className={
              panelLight ? "app__chip app__chip--on" : "app__chip"
            }
            aria-pressed={panelLight}
            onClick={() => setPanelLight((v) => !v)}
          >
            Light
          </button>
          <button
            type="button"
            className={
              panelParticles ? "app__chip app__chip--on" : "app__chip"
            }
            aria-pressed={panelParticles}
            onClick={() => setPanelParticles((v) => !v)}
          >
            Particles
          </button>
          <button
            type="button"
            className={
              panelDebug ? "app__chip app__chip--on" : "app__chip"
            }
            aria-pressed={panelDebug}
            onClick={() => setPanelDebug((v) => !v)}
          >
            Debug
          </button>
        </div>
        <div className="app__param-groups">
          {panelLight ? (
          <>
          <fieldset className="app__param-group">
            <legend>Key light</legend>
            <div className="app__param-group__body">
            <label className="app__label">
              Light X
              <input
                type="number"
                step="0.01"
                min="-1"
                max="1"
                value={glassParams.lightDirXY[0]}
                onChange={onLightDir(0)}
              />
            </label>
            <label className="app__label">
              Light Y
              <input
                type="number"
                step="0.01"
                min="-1"
                max="1"
                value={glassParams.lightDirXY[1]}
                onChange={onLightDir(1)}
              />
            </label>
            <label className="app__label">
              Intensity
              <input
                type="number"
                step="0.05"
                min="0"
                max="2"
                value={glassParams.keyLightIntensity}
                onChange={onGlassParam("keyLightIntensity")}
              />
            </label>
            <label className="app__label">
              Z (depth)
              <input
                type="number"
                step="0.05"
                min="0.05"
                max="2"
                value={glassParams.keyLightZ}
                onChange={onGlassParam("keyLightZ")}
              />
            </label>
            </div>
          </fieldset>
          <fieldset className="app__param-group">
            <legend>Specular</legend>
            <div className="app__param-group__body">
            <label className="app__label">
              Spec X
              <input
                type="number"
                step="0.01"
                min="-1"
                max="1"
                value={glassParams.specularLightXY[0]}
                onChange={onSpecularLight(0)}
              />
            </label>
            <label className="app__label">
              Spec Y
              <input
                type="number"
                step="0.01"
                min="-1"
                max="1"
                value={glassParams.specularLightXY[1]}
                onChange={onSpecularLight(1)}
              />
            </label>
            <label className="app__label">
              Spec pow
              <input
                type="number"
                step="1"
                min="1"
                max="256"
                value={glassParams.specularPower}
                onChange={onGlassParam("specularPower")}
              />
            </label>
            <label className="app__label">
              Spec intensity
              <input
                type="number"
                step="0.1"
                min="0"
                max="3"
                value={glassParams.specularIntensity}
                onChange={onGlassParam("specularIntensity")}
              />
            </label>
            <label className="app__label">
              Follow pointer
              <input
                type="checkbox"
                checked={glassParams.specularFollowPointer}
                onChange={onSpecularFollowPointer}
              />
            </label>
            <label className="app__label">
              Border glow
              <input
                type="checkbox"
                checked={glassParams.domBorderGlowEnabled}
                onChange={onDomBorderGlowEnabled}
              />
            </label>
            </div>
          </fieldset>
          <fieldset className="app__param-group">
            <legend>Soft box</legend>
            <div className="app__param-group__body">
            <label className="app__label">
              Soft box light
              <input
                type="checkbox"
                checked={glassParams.boxLightEnabled}
                onChange={onBoxLightEnabled}
              />
            </label>
            <label className="app__label">
              Box intensity
              <input
                type="number"
                step="0.01"
                min="0"
                max="2"
                value={glassParams.boxLightIntensity}
                onChange={onGlassParam("boxLightIntensity")}
              />
            </label>
            <label className="app__label">
              Box softness
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="0.8"
                value={glassParams.boxLightSoftness}
                onChange={onGlassParam("boxLightSoftness")}
              />
            </label>
            <label className="app__label">
              Box width
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="0.8"
                value={glassParams.boxLightSize[0]}
                onChange={onBoxLightSize(0)}
              />
            </label>
            <label className="app__label">
              Box height
              <input
                type="number"
                step="0.01"
                min="0.05"
                max="0.8"
                value={glassParams.boxLightSize[1]}
                onChange={onBoxLightSize(1)}
              />
            </label>
            <label className="app__label">
              Box X
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={glassParams.boxLightPosXY[0]}
                onChange={onBoxLightPos(0)}
              />
            </label>
            <label className="app__label">
              Box Y
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={glassParams.boxLightPosXY[1]}
                onChange={onBoxLightPos(1)}
              />
            </label>
            </div>
          </fieldset>
          </>
          ) : null}
          {panelGlass ? (
          <>
          <fieldset className="app__param-group">
            <legend>Glass</legend>
            <div className="app__param-group__body">
            <label
              className="app__label"
              title="Fresnel curve exponent: higher = brighter only at grazing edges."
            >
              Rim power
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="8"
                value={glassParams.rimPower}
                onChange={onGlassParam("rimPower")}
              />
            </label>
            <label
              className="app__label"
              title="White edge glow where Fresnel is high (silhouette)."
            >
              Rim intensity
              <input
                type="number"
                step="0.01"
                min="0"
                max="2"
                value={glassParams.rimIntensity}
                onChange={onGlassParam("rimIntensity")}
              />
            </label>
            <label className="app__label">
              Flat pow
              <input
                type="number"
                step="0.1"
                min="1"
                max="8"
                value={glassParams.flatPow}
                onChange={onGlassParam("flatPow")}
              />
            </label>
            <label className="app__label">
              Plateau
              <input
                type="number"
                step="0.01"
                min="0"
                max="0.8"
                value={glassParams.plateau}
                onChange={onGlassParam("plateau")}
              />
            </label>
            <label className="app__label">
              Refraction
              <input
                type="number"
                step="0.1"
                min="0"
                max="32"
                value={glassParams.refractionStrength}
                onChange={onGlassParam("refractionStrength")}
              />
            </label>
            <label className="app__label">
              Edge soft
              <input
                type="number"
                step="0.1"
                min="0.2"
                max="4"
                value={glassParams.edgeSoftness}
                onChange={onGlassParam("edgeSoftness")}
              />
            </label>
            <label
              className="app__label"
              title="Rotates rainbow fringe hues around gray (radians)."
            >
              Fringe hue
              <input
                type="number"
                step="0.05"
                min="-3.15"
                max="3.15"
                value={glassParams.dispersionHueShift}
                onChange={onGlassParam("dispersionHueShift")}
              />
            </label>
            <label
              className="app__label"
              title="0 = faint gray fringes, 1 = full saturated rainbow."
            >
              Fringe vivid
              <input
                type="number"
                step="0.02"
                min="0"
                max="1"
                value={glassParams.dispersionSaturation}
                onChange={onGlassParam("dispersionSaturation")}
              />
            </label>
            <label
              className="app__label"
              title="How far apart the RGB background samples are spread (wider chromatic blur)."
            >
              Split width
              <input
                type="number"
                step="0.05"
                min="0.25"
                max="3"
                value={glassParams.dispersionSpread}
                onChange={onGlassParam("dispersionSpread")}
              />
            </label>
            <label
              className="app__label"
              title="Higher = punchier spectral bands; lower = softer, more blended fringes."
            >
              Band purity
              <input
                type="number"
                step="0.05"
                min="0"
                max="3"
                value={glassParams.dispersionSharpness}
                onChange={onGlassParam("dispersionSharpness")}
              />
            </label>
            <label
              className="app__label"
              title="Low = chroma visible toward face center. High = chroma mostly at glancing silhouette."
            >
              Edge chroma
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={glassParams.dispersionFocus}
                onChange={onGlassParam("dispersionFocus")}
              />
            </label>
            <label
              className="app__label"
              title="How much the existing fresnel dispersion color tints the specular highlight."
            >
              Spec disp amt
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={glassParams.specDispersionAmount}
                onChange={onGlassParam("specDispersionAmount")}
              />
            </label>
            <label
              className="app__label"
              title="Cubemap reflection strength (still ramps with Fresnel)."
            >
              Env refl
              <input
                type="number"
                step="0.05"
                min="0"
                max="3"
                value={glassParams.envReflection}
                onChange={onGlassParam("envReflection")}
              />
            </label>
            </div>
          </fieldset>
          <fieldset className="app__param-group">
            <legend>Bevel</legend>
            <div className="app__param-group__body">
            <label className="app__label">
              Bevel
              <input
                type="checkbox"
                checked={glassParams.bevelEnabled}
                onChange={onBevelEnabled}
              />
            </label>
            <label className="app__label">
              Bevel str
              <input
                type="number"
                step="0.02"
                min="0"
                max="1"
                value={glassParams.bevelStrength}
                onChange={onGlassParam("bevelStrength")}
              />
            </label>
            <label className="app__label">
              Bevel px
              <input
                type="number"
                step="0.5"
                min="1"
                max="32"
                value={glassParams.bevelWidthPx}
                onChange={onGlassParam("bevelWidthPx")}
              />
            </label>
            <label className="app__label">
              Bevel exp
              <input
                type="number"
                step="0.5"
                min="1"
                max="16"
                value={glassParams.bevelExponent}
                onChange={onGlassParam("bevelExponent")}
              />
            </label>
            </div>
          </fieldset>
          </>
          ) : null}
          {panelParticles ? (
          <>
          <fieldset className="app__param-group">
            <legend>Particles</legend>
            <div className="app__param-group__body">
            <label className="app__label">
              Enabled
              <input
                type="checkbox"
                defaultChecked={dataRef.current.boidEnabled}
                onChange={onBoidEnabled}
              />
            </label>
            <label className="app__label">
              Min live
              <input
                type="number"
                step="10"
                min="0"
                max="10000"
                value={boidParams.minLiveBoids}
                onChange={onBoidParam("minLiveBoids")}
              />
            </label>
            <label className="app__label">
              Stroke width
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                value={boidParams.v02BoidLength}
                onChange={onBoidParam("v02BoidLength")}
              />
            </label>
            <label className="app__label">
              Boid length
              <input
                type="number"
                step="0.5"
                min="1"
                max="40"
                value={boidParams.v02BoidLineLength}
                onChange={onBoidParam("v02BoidLineLength")}
              />
            </label>
            <label className="app__label">
              Seed color
              <input
                type="color"
                value={boidParams.themeSeedHex}
                onChange={onBoidSeedColor}
              />
            </label>
            <label className="app__label">
              Life frames
              <input
                type="number"
                step="10"
                min="10"
                max="2000"
                value={boidParams.v02LifeCycleFrames}
                onChange={onBoidParam("v02LifeCycleFrames")}
              />
            </label>
            <label className="app__label">
              Edge buffer
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={boidParams.deathDistancePx}
                onChange={onBoidParam("deathDistancePx")}
              />
            </label>
            </div>
          </fieldset>
          <fieldset className="app__param-group">
            <legend>Movement</legend>
            <div className="app__param-group__body">
            <label className="app__label">
              Mode
              <select
                value={boidParams.movementMode}
                onChange={onBoidMovementMode}
              >
                <option value="isocontour">isocontour</option>
                <option value="flow">flow</option>
              </select>
            </label>
            <label className="app__label">
              Constant speed
              <input
                type="checkbox"
                checked={boidParams.v02ConstantSpeedAtCenter}
                onChange={onBoidConstantSpeed}
              />
            </label>
            <label className="app__label">
              Center speed
              <input
                type="number"
                step="0.05"
                min="0"
                max="2"
                value={boidParams.v02CenterSpeed}
                onChange={onBoidParam("v02CenterSpeed")}
              />
            </label>
            <label className="app__label">
              Edge speed x
              <input
                type="number"
                step="0.1"
                min="0"
                max="4"
                value={boidParams.v02EdgeVelocityMultiplier}
                onChange={onBoidParam("v02EdgeVelocityMultiplier")}
              />
            </label>
            <label className="app__label">
              Inner exclusion (px)
              <input
                type="number"
                step="1"
                min="0"
                max="200"
                title="0 = off. Distance from the pill wall inward where boids are repelled and won't spawn."
                value={boidParams.v02InnerExclusionDepth}
                onChange={onBoidParam("v02InnerExclusionDepth")}
              />
            </label>
            <label className="app__label">
              Spawn margin
              <input
                type="number"
                step="1"
                min="1"
                max="100"
                value={boidParams.v02SpawnOuterMarginPx}
                onChange={onBoidParam("v02SpawnOuterMarginPx")}
              />
            </label>
            <label className="app__label">
              Blast radius
              <input
                type="number"
                step="5"
                min="1"
                max="500"
                value={boidParams.v02BlastRadius}
                onChange={onBoidParam("v02BlastRadius")}
              />
            </label>
            </div>
          </fieldset>
          <fieldset className="app__param-group">
            <legend>Flocking</legend>
            <div className="app__param-group__body">
            <label className="app__label">
              Sep radius
              <input
                type="number"
                step="1"
                min="1"
                max="400"
                value={boidParams.v02SepRadius}
                onChange={onBoidParam("v02SepRadius")}
              />
            </label>
            <label className="app__label">
              Sep weight
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={boidParams.v02SepWeight}
                onChange={onBoidParam("v02SepWeight")}
              />
            </label>
            <label className="app__label">
              Align radius
              <input
                type="number"
                step="1"
                min="1"
                max="400"
                value={boidParams.v02AlignRadius}
                onChange={onBoidParam("v02AlignRadius")}
              />
            </label>
            <label className="app__label">
              Align weight
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={boidParams.v02AlignWeight}
                onChange={onBoidParam("v02AlignWeight")}
              />
            </label>
            <label className="app__label">
              Cohesion radius
              <input
                type="number"
                step="1"
                min="1"
                max="400"
                value={boidParams.v02CohesionRadius}
                onChange={onBoidParam("v02CohesionRadius")}
              />
            </label>
            <label className="app__label">
              Cohesion weight
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={boidParams.v02CohesionWeight}
                onChange={onBoidParam("v02CohesionWeight")}
              />
            </label>
            </div>
          </fieldset>
          <fieldset className="app__param-group">
            <legend>Mouse</legend>
            <div className="app__param-group__body">
            <label className="app__label">
              Align radius
              <input
                type="number"
                step="5"
                min="1"
                max="600"
                value={boidParams.mouseAlignRadius}
                onChange={onBoidParam("mouseAlignRadius")}
              />
            </label>
            <label className="app__label">
              Align weight
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={boidParams.mouseAlignWeight}
                onChange={onBoidParam("mouseAlignWeight")}
              />
            </label>
            <label className="app__label">
              Attract radius
              <input
                type="number"
                step="5"
                min="1"
                max="600"
                value={boidParams.mouseAttractRadius}
                onChange={onBoidParam("mouseAttractRadius")}
              />
            </label>
            <label className="app__label">
              Attract weight
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={boidParams.mouseAttractWeight}
                onChange={onBoidParam("mouseAttractWeight")}
              />
            </label>
            <label className="app__label">
              Accel sensitivity
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={boidParams.mouseAccelSensitivity}
                onChange={onBoidParam("mouseAccelSensitivity")}
              />
            </label>
            <label className="app__label">
              Min speed
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={boidParams.mouseMinSpeed}
                onChange={onBoidParam("mouseMinSpeed")}
              />
            </label>
            <label className="app__label">
              Decay time (s)
              <input
                type="number"
                step="0.1"
                min="0.001"
                max="10"
                value={boidParams.mouseDecayRate}
                onChange={onBoidParam("mouseDecayRate")}
              />
            </label>
            <label className="app__label">
              Proximity lerp
              <input
                type="number"
                step="0.005"
                min="0.001"
                max="1"
                value={boidParams.mouseProximityLerpDown}
                onChange={onBoidParam("mouseProximityLerpDown")}
              />
            </label>
            </div>
          </fieldset>
          </>
          ) : null}
          {panelDebug ? (
          <fieldset className="app__param-group">
            <legend>Debug</legend>
            <div className="app__param-group__body">
            <label className="app__label">
              Debug shader
              <input
                type="checkbox"
                checked={showDebugShader}
                onChange={onDebugShader}
              />
            </label>
            <label className="app__label">
              Debug grid
              <input
                type="checkbox"
                checked={showDebugGrid}
                onChange={onDebugGrid}
              />
            </label>
            </div>
          </fieldset>
          ) : null}
        </div>
      </header>
      <div className="scene">
        <ResizableGridOverlay
          dataRef={dataRef}
          layout={PRESET_SINGLE}
          cellLabels={CELL_LABELS}
          showDebugShader={showDebugShader}
          showDebugGrid={showDebugGrid}
        />
      </div>
    </div>
  );
}

export default App;
