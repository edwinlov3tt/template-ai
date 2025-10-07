/**
 * SVG Effects Engine
 *
 * Public API for the effects system.
 * Exports all effect builders, utilities, and the effects manager.
 */

// Core manager
export { EffectsManager, effectsManager } from './EffectsManager'
export type { EffectParams, EffectType } from './EffectsManager'

// Effect builders
export { makeShadow } from './builders/shadow'
export type { ShadowParams } from './builders/shadow'

export { makeLift } from './builders/lift'
export type { LiftParams } from './builders/lift'

export { makeNeon } from './builders/neon'
export type { NeonParams } from './builders/neon'

export { makeEcho } from './builders/echo'
export type { EchoParams } from './builders/echo'

export { makeGlitch } from './builders/glitch'
export type { GlitchParams } from './builders/glitch'

export { makeCurvePath } from './builders/curve'
export type { CurveParams } from './builders/curve'

// Utilities
export {
  applyStroke,
  applyHollowStroke,
  applyOutlineStroke,
  removeStroke,
  hasStroke,
  getStrokeConfig
} from './stroke'
export type { StrokeConfig } from './stroke'

export {
  createHighlightRect,
  updateHighlightRect,
  createMultiLineHighlight,
  removeHighlight
} from './background'
export type { HighlightParams } from './background'

// Presets
export {
  EFFECT_PRESETS,
  getPreset,
  applyPreset,
  clearEffects,
  getPresetNames,
  hasEffects,
  getActiveEffects
} from './presets'
export type { EffectPresetName } from './presets'
