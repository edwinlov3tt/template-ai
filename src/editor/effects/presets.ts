/**
 * Effect Presets
 *
 * Pre-configured effect bundles for quick application to slots.
 * Each preset defines a partial Slot configuration with effect properties.
 */

import type { Slot } from '../../schema/types'

export type EffectPresetName =
  | 'none'
  | 'shadow'
  | 'lift'
  | 'hollow'
  | 'outline'
  | 'echo'
  | 'glitch'
  | 'neon'
  | 'background'

/**
 * Effect preset definitions
 *
 * Usage:
 *   const slot = { ...baseSlot, ...EFFECT_PRESETS.shadow }
 */
export const EFFECT_PRESETS: Record<EffectPresetName, Partial<Slot>> = {
  // No effect (clear all effects)
  none: {
    shadow: undefined,
    lift: undefined,
    neon: undefined,
    echo: undefined,
    glitch: undefined,
    curve: undefined,
    highlight: undefined,
    strokeConfig: undefined
  },

  // Drop shadow effect
  shadow: {
    shadow: {
      dx: 0,
      dy: 4,
      blur: 8,
      color: '#000000',
      alpha: 0.3
    }
  },

  // Ambient lift/elevation effect
  lift: {
    lift: {
      blur: 12,
      alpha: 0.2
    }
  },

  // Hollow text (stroke only, no fill)
  hollow: {
    fill: 'none',
    strokeConfig: {
      width: 2,
      color: '#000000'
    }
  },

  // Outlined text (stroke behind fill)
  outline: {
    strokeConfig: {
      width: 3,
      color: '#000000',
      paintOrder: 'stroke fill'
    }
  },

  // Echo/trail effect
  echo: {
    echo: {
      count: 3,
      dx: 2,
      dy: 2,
      blur: 0,
      color: '#000000',
      alpha: 0.4
    }
  },

  // RGB glitch effect
  glitch: {
    glitch: {
      slices: 5,
      amplitude: 3,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }
  },

  // Neon glow effect
  neon: {
    neon: {
      stroke: 2,
      glow: 10,
      color: '#FF00FF'
    }
  },

  // Background highlight
  background: {
    highlight: {
      fill: '#000000',
      padding: [8, 4]
    }
  }
}

/**
 * Get effect preset by name
 */
export function getPreset(name: EffectPresetName): Partial<Slot> {
  return EFFECT_PRESETS[name] || EFFECT_PRESETS.none
}

/**
 * Apply preset to slot (returns new slot object)
 */
export function applyPreset(slot: Slot, preset: EffectPresetName): Slot {
  return {
    ...slot,
    ...EFFECT_PRESETS[preset]
  }
}

/**
 * Clear all effects from slot (returns new slot object)
 */
export function clearEffects(slot: Slot): Slot {
  return applyPreset(slot, 'none')
}

/**
 * Get all available preset names
 */
export function getPresetNames(): EffectPresetName[] {
  return Object.keys(EFFECT_PRESETS) as EffectPresetName[]
}

/**
 * Check if slot has any effects applied
 */
export function hasEffects(slot: Slot): boolean {
  return !!(
    slot.shadow ||
    slot.lift ||
    slot.neon ||
    slot.echo ||
    slot.glitch ||
    slot.curve ||
    slot.highlight ||
    slot.strokeConfig
  )
}

/**
 * Get list of active effects on slot
 */
export function getActiveEffects(slot: Slot): string[] {
  const active: string[] = []

  if (slot.shadow) active.push('shadow')
  if (slot.lift) active.push('lift')
  if (slot.neon) active.push('neon')
  if (slot.echo) active.push('echo')
  if (slot.glitch) active.push('glitch')
  if (slot.curve) active.push('curve')
  if (slot.highlight) active.push('highlight')
  if (slot.strokeConfig) active.push('stroke')

  return active
}
