export type V02MovementMode = 'isocontour' | 'flow'

export type V02SceneData = {
  containerRects: Map<string, { x: number; y: number; w: number; h: number }>
  lightPos: { x: number; y: number }
  pointerDown: boolean
  deathDistancePx: number
  minLiveBoids: number
  v02BoidLength: number
  v02BoidLineLength: number
  v02MovementMode: V02MovementMode
  v02EdgeVelocityMultiplier: number
  v02InnerExclusionPct: number
  v02SpawnOuterMarginPx: number
  v02BlastRadius: number
  v02CenterSpeed: number
  v02LifeCycleFrames: number
  v02SepRadius: number
  v02AlignRadius: number
  v02CohesionRadius: number
  v02SepWeight: number
  v02AlignWeight: number
  v02CohesionWeight: number
  labelRect: { x: number; y: number; w: number; h: number } | null
  lastDirection: { x: number; y: number }
  themeSeedHex: string
  invertSpeedProfile: boolean
  v02ConstantSpeedAtCenter: boolean
  v02ConstantDirectionDeg: number
  mouseRawVelX: number
  mouseRawVelY: number
  mouseAlignRadius: number
  mouseAttractRadius: number
  mouseAlignWeight: number
  mouseAttractWeight: number
  mouseAccelSensitivity: number
  mouseMinSpeed: number
  mouseDecayRate: number
  mouseProximityLerpDown: number
}
