import { describe, it, expect } from 'vitest'
import { makeGlitch, type GlitchParams } from '../builders/glitch'

describe('makeGlitch', () => {
  it('should create filter element', () => {
    const params: GlitchParams = {
      slices: 5,
      amplitude: 3,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { node } = makeGlitch(params)

    expect(node.tagName).toBe('filter')
    expect(node.namespaceURI).toBe('http://www.w3.org/2000/svg')
  })

  it('should generate stable ID for same parameters', () => {
    const params: GlitchParams = {
      slices: 5,
      amplitude: 3,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { id: id1 } = makeGlitch(params)
    const { id: id2 } = makeGlitch(params)

    expect(id1).toBe(id2)
  })

  it('should generate deterministic output with same seed', () => {
    const params1: GlitchParams = {
      slices: 5,
      amplitude: 3,
      seed: 42,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const params2: GlitchParams = {
      slices: 5,
      amplitude: 3,
      seed: 42,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { id: id1, node: node1 } = makeGlitch(params1)
    const { id: id2, node: node2 } = makeGlitch(params2)

    expect(id1).toBe(id2)

    const turbulence1 = node1.querySelector('feTurbulence')
    const turbulence2 = node2.querySelector('feTurbulence')

    expect(turbulence1?.getAttribute('seed')).toBe(turbulence2?.getAttribute('seed'))
  })

  it('should generate different output with different seeds', () => {
    const params1: GlitchParams = {
      slices: 5,
      amplitude: 3,
      seed: 42,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const params2: GlitchParams = {
      slices: 5,
      amplitude: 3,
      seed: 99,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { id: id1, node: node1 } = makeGlitch(params1)
    const { id: id2, node: node2 } = makeGlitch(params2)

    expect(id1).not.toBe(id2)

    const turbulence1 = node1.querySelector('feTurbulence')
    const turbulence2 = node2.querySelector('feTurbulence')

    expect(turbulence1?.getAttribute('seed')).not.toBe(turbulence2?.getAttribute('seed'))
  })

  it('should include glitch type in ID', () => {
    const params: GlitchParams = {
      slices: 5,
      amplitude: 3,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { id } = makeGlitch(params)

    expect(id).toMatch(/^effect-glitch-/)
  })

  it('should create turbulence for slicing', () => {
    const params: GlitchParams = {
      slices: 10,
      amplitude: 3,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { node } = makeGlitch(params)
    const turbulence = node.querySelector('feTurbulence')

    expect(turbulence).toBeDefined()
    expect(turbulence?.getAttribute('type')).toBe('fractalNoise')
  })

  it('should set correct slice frequency', () => {
    const params: GlitchParams = {
      slices: 8,
      amplitude: 3,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { node } = makeGlitch(params)
    const turbulence = node.querySelector('feTurbulence')

    // Frequency should be based on slices
    const freq = turbulence?.getAttribute('baseFrequency')
    expect(freq).toContain('0.08') // slices * 0.01
  })

  it('should create displacement map', () => {
    const params: GlitchParams = {
      slices: 5,
      amplitude: 3,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { node } = makeGlitch(params)
    const displace = node.querySelector('feDisplacementMap')

    expect(displace).toBeDefined()
    expect(displace?.getAttribute('scale')).toBe('3')
  })

  it('should create RGB channel offsets', () => {
    const params: GlitchParams = {
      slices: 5,
      amplitude: 6,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { node } = makeGlitch(params)
    const offsets = node.querySelectorAll('feOffset')

    // Should have 2 offsets for RGB channels
    expect(offsets.length).toBeGreaterThanOrEqual(2)

    // Check amplitude-based offsets
    const offset1 = offsets[0]
    const offset2 = offsets[1]

    expect(offset1.getAttribute('dx')).toBe('-3') // -amplitude * 0.5
    expect(offset2.getAttribute('dx')).toBe('3')  // amplitude * 0.5
  })

  it('should apply color matrices', () => {
    const params: GlitchParams = {
      slices: 5,
      amplitude: 3,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { node } = makeGlitch(params)
    const matrices = node.querySelectorAll('feColorMatrix')

    // Should have 2 color matrices for RGB channels
    expect(matrices.length).toBe(2)
  })

  it('should blend channels using screen mode', () => {
    const params: GlitchParams = {
      slices: 5,
      amplitude: 3,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { node } = makeGlitch(params)
    const blend = node.querySelector('feBlend')

    expect(blend).toBeDefined()
    expect(blend?.getAttribute('mode')).toBe('screen')
  })

  it('should use default seed if not provided', () => {
    const params: GlitchParams = {
      slices: 5,
      amplitude: 3,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
      // seed not provided
    }

    const { node } = makeGlitch(params)
    const turbulence = node.querySelector('feTurbulence')

    expect(turbulence?.getAttribute('seed')).toBe('12345')
  })

  it('should set correct filter region', () => {
    const params: GlitchParams = {
      slices: 5,
      amplitude: 3,
      colorA: '#FF00FF',
      colorB: '#00FFFF'
    }

    const { node } = makeGlitch(params)

    expect(node.getAttribute('x')).toBe('-50%')
    expect(node.getAttribute('y')).toBe('-50%')
    expect(node.getAttribute('width')).toBe('200%')
    expect(node.getAttribute('height')).toBe('200%')
  })
})
