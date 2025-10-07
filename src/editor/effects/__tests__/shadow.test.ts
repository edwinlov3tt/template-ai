import { describe, it, expect } from 'vitest'
import { makeShadow, type ShadowParams } from '../builders/shadow'

describe('makeShadow', () => {
  it('should create filter element', () => {
    const params: ShadowParams = {
      dx: 0,
      dy: 4,
      blur: 8,
      color: '#000000',
      alpha: 0.3
    }

    const { node } = makeShadow(params)

    expect(node.tagName).toBe('filter')
    expect(node.namespaceURI).toBe('http://www.w3.org/2000/svg')
  })

  it('should generate stable ID for same parameters', () => {
    const params: ShadowParams = {
      dx: 0,
      dy: 4,
      blur: 8,
      color: '#000000',
      alpha: 0.3
    }

    const { id: id1 } = makeShadow(params)
    const { id: id2 } = makeShadow(params)

    expect(id1).toBe(id2)
  })

  it('should generate different IDs for different parameters', () => {
    const params1: ShadowParams = {
      dx: 0,
      dy: 4,
      blur: 8,
      color: '#000000',
      alpha: 0.3
    }

    const params2: ShadowParams = {
      dx: 2,
      dy: 4,
      blur: 8,
      color: '#000000',
      alpha: 0.3
    }

    const { id: id1 } = makeShadow(params1)
    const { id: id2 } = makeShadow(params2)

    expect(id1).not.toBe(id2)
  })

  it('should include shadow type in ID', () => {
    const params: ShadowParams = {
      dx: 0,
      dy: 4,
      blur: 8,
      color: '#000000',
      alpha: 0.3
    }

    const { id } = makeShadow(params)

    expect(id).toMatch(/^effect-shadow-/)
  })

  it('should create filter with correct structure', () => {
    const params: ShadowParams = {
      dx: 0,
      dy: 4,
      blur: 8,
      color: '#000000',
      alpha: 0.3
    }

    const { node } = makeShadow(params)

    // Check for required filter primitives
    expect(node.querySelector('feGaussianBlur')).toBeDefined()
    expect(node.querySelector('feOffset')).toBeDefined()
    expect(node.querySelector('feFlood')).toBeDefined()
    expect(node.querySelector('feComposite')).toBeDefined()
    expect(node.querySelector('feMerge')).toBeDefined()
  })

  it('should set correct blur value', () => {
    const params: ShadowParams = {
      dx: 0,
      dy: 4,
      blur: 12,
      color: '#000000',
      alpha: 0.3
    }

    const { node } = makeShadow(params)
    const blur = node.querySelector('feGaussianBlur')

    expect(blur?.getAttribute('stdDeviation')).toBe('12')
  })

  it('should set correct offset values', () => {
    const params: ShadowParams = {
      dx: 3,
      dy: 5,
      blur: 8,
      color: '#000000',
      alpha: 0.3
    }

    const { node } = makeShadow(params)
    const offset = node.querySelector('feOffset')

    expect(offset?.getAttribute('dx')).toBe('3')
    expect(offset?.getAttribute('dy')).toBe('5')
  })

  it('should set correct color and alpha', () => {
    const params: ShadowParams = {
      dx: 0,
      dy: 4,
      blur: 8,
      color: '#FF0000',
      alpha: 0.5
    }

    const { node } = makeShadow(params)
    const flood = node.querySelector('feFlood')

    expect(flood?.getAttribute('flood-color')).toBe('#FF0000')
    expect(flood?.getAttribute('flood-opacity')).toBe('0.5')
  })

  it('should merge shadow under original', () => {
    const params: ShadowParams = {
      dx: 0,
      dy: 4,
      blur: 8,
      color: '#000000',
      alpha: 0.3
    }

    const { node } = makeShadow(params)
    const merge = node.querySelector('feMerge')
    const mergeNodes = merge?.querySelectorAll('feMergeNode')

    expect(mergeNodes?.length).toBe(2)
    expect(mergeNodes?.[0].getAttribute('in')).toBe('shadow')
    expect(mergeNodes?.[1].getAttribute('in')).toBe('SourceGraphic')
  })

  it('should set filter region to prevent clipping', () => {
    const params: ShadowParams = {
      dx: 0,
      dy: 4,
      blur: 8,
      color: '#000000',
      alpha: 0.3
    }

    const { node } = makeShadow(params)

    expect(node.getAttribute('x')).toBe('-50%')
    expect(node.getAttribute('y')).toBe('-50%')
    expect(node.getAttribute('width')).toBe('200%')
    expect(node.getAttribute('height')).toBe('200%')
  })
})
