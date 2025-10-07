import { describe, it, expect } from 'vitest'
import { makeNeon, type NeonParams } from '../builders/neon'

describe('makeNeon', () => {
  it('should create filter element', () => {
    const params: NeonParams = {
      stroke: 2,
      glow: 10,
      color: '#FF00FF'
    }

    const { node } = makeNeon(params)

    expect(node.tagName).toBe('filter')
    expect(node.namespaceURI).toBe('http://www.w3.org/2000/svg')
  })

  it('should generate stable ID for same parameters', () => {
    const params: NeonParams = {
      stroke: 2,
      glow: 10,
      color: '#FF00FF'
    }

    const { id: id1 } = makeNeon(params)
    const { id: id2 } = makeNeon(params)

    expect(id1).toBe(id2)
  })

  it('should include neon type in ID', () => {
    const params: NeonParams = {
      stroke: 2,
      glow: 10,
      color: '#FF00FF'
    }

    const { id } = makeNeon(params)

    expect(id).toMatch(/^effect-neon-/)
  })

  it('should create multi-layer glow structure', () => {
    const params: NeonParams = {
      stroke: 2,
      glow: 10,
      color: '#FF00FF'
    }

    const { node } = makeNeon(params)

    // Check for morphology (stroke effect)
    expect(node.querySelector('feMorphology')).toBeDefined()

    // Check for multiple blur layers
    const blurs = node.querySelectorAll('feGaussianBlur')
    expect(blurs.length).toBeGreaterThanOrEqual(2)
  })

  it('should set correct stroke width', () => {
    const params: NeonParams = {
      stroke: 4,
      glow: 10,
      color: '#FF00FF'
    }

    const { node } = makeNeon(params)
    const morphology = node.querySelector('feMorphology')

    expect(morphology?.getAttribute('radius')).toBe('2') // stroke / 2
  })

  it('should set correct glow blur values', () => {
    const params: NeonParams = {
      stroke: 2,
      glow: 20,
      color: '#FF00FF'
    }

    const { node } = makeNeon(params)
    const blurs = node.querySelectorAll('feGaussianBlur')

    // Outer glow should use full glow value
    const outerGlow = Array.from(blurs).find(b => b.getAttribute('stdDeviation') === '20')
    expect(outerGlow).toBeDefined()

    // Inner glow should use half glow value
    const innerGlow = Array.from(blurs).find(b => b.getAttribute('stdDeviation') === '10')
    expect(innerGlow).toBeDefined()
  })

  it('should apply neon color', () => {
    const params: NeonParams = {
      stroke: 2,
      glow: 10,
      color: '#00FFFF'
    }

    const { node } = makeNeon(params)
    const flood = node.querySelector('feFlood')

    expect(flood?.getAttribute('flood-color')).toBe('#00FFFF')
  })

  it('should merge all layers correctly', () => {
    const params: NeonParams = {
      stroke: 2,
      glow: 10,
      color: '#FF00FF'
    }

    const { node } = makeNeon(params)
    const merge = node.querySelector('feMerge')
    const mergeNodes = merge?.querySelectorAll('feMergeNode')

    // Should merge: outer glow + inner glow + stroke + original
    expect(mergeNodes?.length).toBe(4)

    const inputs = Array.from(mergeNodes || []).map(n => n.getAttribute('in'))
    expect(inputs).toContain('outerGlow')
    expect(inputs).toContain('innerGlowColor')
    expect(inputs).toContain('stroke')
    expect(inputs).toContain('SourceGraphic')
  })

  it('should set correct filter region', () => {
    const params: NeonParams = {
      stroke: 2,
      glow: 10,
      color: '#FF00FF'
    }

    const { node } = makeNeon(params)

    expect(node.getAttribute('x')).toBe('-50%')
    expect(node.getAttribute('y')).toBe('-50%')
    expect(node.getAttribute('width')).toBe('200%')
    expect(node.getAttribute('height')).toBe('200%')
  })
})
