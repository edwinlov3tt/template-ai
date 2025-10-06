import { describe, it, expect } from 'vitest'
import {
  EFFECT_PRESETS,
  getPreset,
  applyPreset,
  clearEffects,
  getPresetNames,
  hasEffects,
  getActiveEffects,
  type EffectPresetName
} from '../presets'
import type { Slot } from '../../../schema/types'

describe('Effect Presets', () => {
  describe('EFFECT_PRESETS', () => {
    it('should have all preset definitions', () => {
      expect(EFFECT_PRESETS.none).toBeDefined()
      expect(EFFECT_PRESETS.shadow).toBeDefined()
      expect(EFFECT_PRESETS.lift).toBeDefined()
      expect(EFFECT_PRESETS.hollow).toBeDefined()
      expect(EFFECT_PRESETS.outline).toBeDefined()
      expect(EFFECT_PRESETS.echo).toBeDefined()
      expect(EFFECT_PRESETS.glitch).toBeDefined()
      expect(EFFECT_PRESETS.neon).toBeDefined()
      expect(EFFECT_PRESETS.background).toBeDefined()
    })

    it('should clear all effects in none preset', () => {
      const preset = EFFECT_PRESETS.none

      expect(preset.shadow).toBeUndefined()
      expect(preset.lift).toBeUndefined()
      expect(preset.neon).toBeUndefined()
      expect(preset.echo).toBeUndefined()
      expect(preset.glitch).toBeUndefined()
      expect(preset.highlight).toBeUndefined()
      expect(preset.strokeConfig).toBeUndefined()
    })

    it('should define shadow effect in shadow preset', () => {
      const preset = EFFECT_PRESETS.shadow

      expect(preset.shadow).toBeDefined()
      expect(preset.shadow?.dx).toBe(0)
      expect(preset.shadow?.dy).toBe(4)
      expect(preset.shadow?.blur).toBe(8)
      expect(preset.shadow?.color).toBe('#000000')
      expect(preset.shadow?.alpha).toBe(0.3)
    })

    it('should define lift effect in lift preset', () => {
      const preset = EFFECT_PRESETS.lift

      expect(preset.lift).toBeDefined()
      expect(preset.lift?.blur).toBe(12)
      expect(preset.lift?.alpha).toBe(0.2)
    })

    it('should define hollow stroke in hollow preset', () => {
      const preset = EFFECT_PRESETS.hollow

      expect(preset.fill).toBe('none')
      expect(preset.strokeConfig).toBeDefined()
      expect(preset.strokeConfig?.width).toBe(2)
      expect(preset.strokeConfig?.color).toBe('#000000')
    })

    it('should define outline stroke in outline preset', () => {
      const preset = EFFECT_PRESETS.outline

      expect(preset.strokeConfig).toBeDefined()
      expect(preset.strokeConfig?.width).toBe(3)
      expect(preset.strokeConfig?.color).toBe('#000000')
      expect(preset.strokeConfig?.paintOrder).toBe('stroke fill')
    })

    it('should define echo effect in echo preset', () => {
      const preset = EFFECT_PRESETS.echo

      expect(preset.echo).toBeDefined()
      expect(preset.echo?.count).toBe(3)
      expect(preset.echo?.dx).toBe(2)
      expect(preset.echo?.dy).toBe(2)
      expect(preset.echo?.blur).toBe(0)
      expect(preset.echo?.color).toBe('#000000')
      expect(preset.echo?.alpha).toBe(0.4)
    })

    it('should define glitch effect in glitch preset', () => {
      const preset = EFFECT_PRESETS.glitch

      expect(preset.glitch).toBeDefined()
      expect(preset.glitch?.slices).toBe(5)
      expect(preset.glitch?.amplitude).toBe(3)
      expect(preset.glitch?.colorA).toBe('#FF00FF')
      expect(preset.glitch?.colorB).toBe('#00FFFF')
    })

    it('should define neon effect in neon preset', () => {
      const preset = EFFECT_PRESETS.neon

      expect(preset.neon).toBeDefined()
      expect(preset.neon?.stroke).toBe(2)
      expect(preset.neon?.glow).toBe(10)
      expect(preset.neon?.color).toBe('#FF00FF')
    })

    it('should define highlight in background preset', () => {
      const preset = EFFECT_PRESETS.background

      expect(preset.highlight).toBeDefined()
      expect(preset.highlight?.fill).toBe('#000000')
      expect(preset.highlight?.padding).toEqual([8, 4])
    })
  })

  describe('getPreset', () => {
    it('should return correct preset by name', () => {
      const shadow = getPreset('shadow')
      expect(shadow.shadow).toBeDefined()
    })

    it('should return none preset for invalid name', () => {
      const invalid = getPreset('invalid' as EffectPresetName)
      expect(invalid).toBe(EFFECT_PRESETS.none)
    })
  })

  describe('applyPreset', () => {
    it('should apply preset to slot', () => {
      const baseSlot: Slot = {
        name: 'headline',
        type: 'text',
        z: 1
      }

      const withShadow = applyPreset(baseSlot, 'shadow')

      expect(withShadow.shadow).toBeDefined()
      expect(withShadow.shadow?.dy).toBe(4)
    })

    it('should preserve existing slot properties', () => {
      const baseSlot: Slot = {
        name: 'headline',
        type: 'text',
        z: 1,
        fill: '#FF0000',
        fontSize: 24
      }

      const withEffect = applyPreset(baseSlot, 'neon')

      expect(withEffect.name).toBe('headline')
      expect(withEffect.type).toBe('text')
      expect(withEffect.z).toBe(1)
      expect(withEffect.fill).toBe('#FF0000')
      expect(withEffect.fontSize).toBe(24)
      expect(withEffect.neon).toBeDefined()
    })

    it('should override existing effects', () => {
      const slotWithShadow: Slot = {
        name: 'headline',
        type: 'text',
        z: 1,
        shadow: { dx: 0, dy: 2, blur: 4, color: '#000000', alpha: 0.5 }
      }

      const withLift = applyPreset(slotWithShadow, 'lift')

      expect(withLift.lift).toBeDefined()
      // Note: shadow is still there because lift preset doesn't clear it
      // To clear all, use 'none' first
    })
  })

  describe('clearEffects', () => {
    it('should remove all effects from slot', () => {
      const slotWithEffects: Slot = {
        name: 'headline',
        type: 'text',
        z: 1,
        shadow: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 },
        neon: { stroke: 2, glow: 10, color: '#FF00FF' }
      }

      const cleared = clearEffects(slotWithEffects)

      expect(cleared.shadow).toBeUndefined()
      expect(cleared.neon).toBeUndefined()
    })

    it('should preserve non-effect properties', () => {
      const slot: Slot = {
        name: 'headline',
        type: 'text',
        z: 1,
        fill: '#FF0000',
        shadow: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
      }

      const cleared = clearEffects(slot)

      expect(cleared.name).toBe('headline')
      expect(cleared.type).toBe('text')
      expect(cleared.z).toBe(1)
      expect(cleared.fill).toBe('#FF0000')
    })
  })

  describe('getPresetNames', () => {
    it('should return all preset names', () => {
      const names = getPresetNames()

      expect(names).toContain('none')
      expect(names).toContain('shadow')
      expect(names).toContain('lift')
      expect(names).toContain('hollow')
      expect(names).toContain('outline')
      expect(names).toContain('echo')
      expect(names).toContain('glitch')
      expect(names).toContain('neon')
      expect(names).toContain('background')
      expect(names.length).toBe(9)
    })
  })

  describe('hasEffects', () => {
    it('should return true when slot has effects', () => {
      const slot: Slot = {
        name: 'headline',
        type: 'text',
        z: 1,
        shadow: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 }
      }

      expect(hasEffects(slot)).toBe(true)
    })

    it('should return false when slot has no effects', () => {
      const slot: Slot = {
        name: 'headline',
        type: 'text',
        z: 1,
        fill: '#FF0000'
      }

      expect(hasEffects(slot)).toBe(false)
    })

    it('should detect any effect type', () => {
      const slotWithLift: Slot = { name: 'test', type: 'text', z: 1, lift: { blur: 12, alpha: 0.2 } }
      const slotWithNeon: Slot = { name: 'test', type: 'text', z: 1, neon: { stroke: 2, glow: 10, color: '#FF00FF' } }
      const slotWithEcho: Slot = { name: 'test', type: 'text', z: 1, echo: { count: 3, dx: 2, dy: 2, blur: 0, color: '#000000', alpha: 0.4 } }

      expect(hasEffects(slotWithLift)).toBe(true)
      expect(hasEffects(slotWithNeon)).toBe(true)
      expect(hasEffects(slotWithEcho)).toBe(true)
    })
  })

  describe('getActiveEffects', () => {
    it('should return list of active effects', () => {
      const slot: Slot = {
        name: 'headline',
        type: 'text',
        z: 1,
        shadow: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 },
        neon: { stroke: 2, glow: 10, color: '#FF00FF' }
      }

      const active = getActiveEffects(slot)

      expect(active).toContain('shadow')
      expect(active).toContain('neon')
      expect(active.length).toBe(2)
    })

    it('should return empty array when no effects', () => {
      const slot: Slot = {
        name: 'headline',
        type: 'text',
        z: 1
      }

      const active = getActiveEffects(slot)

      expect(active).toEqual([])
    })

    it('should detect all effect types', () => {
      const slot: Slot = {
        name: 'headline',
        type: 'text',
        z: 1,
        shadow: { dx: 0, dy: 4, blur: 8, color: '#000000', alpha: 0.3 },
        lift: { blur: 12, alpha: 0.2 },
        neon: { stroke: 2, glow: 10, color: '#FF00FF' },
        echo: { count: 3, dx: 2, dy: 2, blur: 0, color: '#000000', alpha: 0.4 },
        glitch: { slices: 5, amplitude: 3, colorA: '#FF00FF', colorB: '#00FFFF' },
        curve: { radius: 100 },
        highlight: { fill: '#000000', padding: [8, 4] },
        strokeConfig: { width: 2, color: '#000000' }
      }

      const active = getActiveEffects(slot)

      expect(active).toContain('shadow')
      expect(active).toContain('lift')
      expect(active).toContain('neon')
      expect(active).toContain('echo')
      expect(active).toContain('glitch')
      expect(active).toContain('curve')
      expect(active).toContain('highlight')
      expect(active).toContain('stroke')
      expect(active.length).toBe(8)
    })
  })
})
