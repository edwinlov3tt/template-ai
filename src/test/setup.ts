// Vitest setup file
// Add global test utilities here

import '@testing-library/jest-dom'

/**
 * Polyfill for DOMMatrix in jsdom environment
 * DOMMatrix is used by CoordinateSystem for coordinate transformations
 */
class DOMMatrixPolyfill implements DOMMatrix {
  a = 1
  b = 0
  c = 0
  d = 1
  e = 0
  f = 0
  m11 = 1
  m12 = 0
  m13 = 0
  m14 = 0
  m21 = 0
  m22 = 1
  m23 = 0
  m24 = 0
  m31 = 0
  m32 = 0
  m33 = 1
  m34 = 0
  m41 = 0
  m42 = 0
  m43 = 0
  m44 = 1
  is2D = true
  isIdentity = true

  constructor(init?: string | number[]) {
    if (Array.isArray(init)) {
      if (init.length === 6) {
        ;[this.a, this.b, this.c, this.d, this.e, this.f] = init
        this.m11 = this.a
        this.m12 = this.b
        this.m21 = this.c
        this.m22 = this.d
        this.m41 = this.e
        this.m42 = this.f
      }
    }
    this.updateIsIdentity()
  }

  private updateIsIdentity() {
    this.isIdentity =
      this.a === 1 &&
      this.b === 0 &&
      this.c === 0 &&
      this.d === 1 &&
      this.e === 0 &&
      this.f === 0
  }

  translate(tx: number, ty: number): DOMMatrix {
    const result = new DOMMatrixPolyfill([this.a, this.b, this.c, this.d, this.e, this.f])
    result.e = this.a * tx + this.c * ty + this.e
    result.f = this.b * tx + this.d * ty + this.f
    result.m41 = result.e
    result.m42 = result.f
    result.updateIsIdentity()
    return result as DOMMatrix
  }

  scale(scaleX: number, scaleY?: number, scaleZ?: number, originX?: number, originY?: number, originZ?: number): DOMMatrix {
    const sy = scaleY ?? scaleX
    const result = new DOMMatrixPolyfill([this.a, this.b, this.c, this.d, this.e, this.f])
    result.a = this.a * scaleX
    result.b = this.b * scaleX
    result.c = this.c * sy
    result.d = this.d * sy
    result.m11 = result.a
    result.m12 = result.b
    result.m21 = result.c
    result.m22 = result.d
    result.updateIsIdentity()
    return result as DOMMatrix
  }

  rotate(rotX: number, rotY?: number, rotZ?: number): DOMMatrix {
    const angle = rotX * (Math.PI / 180)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const result = new DOMMatrixPolyfill([this.a, this.b, this.c, this.d, this.e, this.f])
    result.a = this.a * cos + this.c * sin
    result.b = this.b * cos + this.d * sin
    result.c = this.c * cos - this.a * sin
    result.d = this.d * cos - this.b * sin
    result.m11 = result.a
    result.m12 = result.b
    result.m21 = result.c
    result.m22 = result.d
    result.updateIsIdentity()
    return result as DOMMatrix
  }

  inverse(): DOMMatrix {
    const det = this.a * this.d - this.b * this.c
    if (det === 0) {
      throw new Error('Matrix is not invertible')
    }
    const result = new DOMMatrixPolyfill()
    result.a = this.d / det
    result.b = -this.b / det
    result.c = -this.c / det
    result.d = this.a / det
    result.e = (this.c * this.f - this.d * this.e) / det
    result.f = (this.b * this.e - this.a * this.f) / det
    result.m11 = result.a
    result.m12 = result.b
    result.m21 = result.c
    result.m22 = result.d
    result.m41 = result.e
    result.m42 = result.f
    result.updateIsIdentity()
    return result as DOMMatrix
  }

  multiply(other?: DOMMatrix): DOMMatrix {
    if (!other) return this as DOMMatrix
    const result = new DOMMatrixPolyfill()
    result.a = this.a * other.a + this.c * other.b
    result.b = this.b * other.a + this.d * other.b
    result.c = this.a * other.c + this.c * other.d
    result.d = this.b * other.c + this.d * other.d
    result.e = this.a * other.e + this.c * other.f + this.e
    result.f = this.b * other.e + this.d * other.f + this.f
    result.m11 = result.a
    result.m12 = result.b
    result.m21 = result.c
    result.m22 = result.d
    result.m41 = result.e
    result.m42 = result.f
    result.updateIsIdentity()
    return result as DOMMatrix
  }

  flipX(): DOMMatrix {
    throw new Error('Not implemented')
  }
  flipY(): DOMMatrix {
    throw new Error('Not implemented')
  }
  rotateAxisAngle(x?: number, y?: number, z?: number, angle?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  rotateFromVector(x?: number, y?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  scaleSelf(scaleX?: number, scaleY?: number, scaleZ?: number, originX?: number, originY?: number, originZ?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  scale3d(scale?: number, originX?: number, originY?: number, originZ?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  scale3dSelf(scale?: number, originX?: number, originY?: number, originZ?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  scaleNonUniform(scaleX?: number, scaleY?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  translateSelf(tx?: number, ty?: number, tz?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  skewX(sx?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  skewXSelf(sx?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  skewY(sy?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  skewYSelf(sy?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  invertSelf(): DOMMatrix {
    throw new Error('Not implemented')
  }
  setMatrixValue(transformList: string): DOMMatrix {
    throw new Error('Not implemented')
  }
  transformPoint(point?: DOMPointInit): DOMPoint {
    throw new Error('Use DOMPoint.matrixTransform instead')
  }
  toFloat32Array(): any {
    const buffer = new ArrayBuffer(64)
    const array = new Float32Array(buffer)
    array.set([this.a, this.b, 0, 0, this.c, this.d, 0, 0, 0, 0, 1, 0, this.e, this.f, 0, 1])
    return array
  }
  toFloat64Array(): any {
    const buffer = new ArrayBuffer(128)
    const array = new Float64Array(buffer)
    array.set([this.a, this.b, 0, 0, this.c, this.d, 0, 0, 0, 0, 1, 0, this.e, this.f, 0, 1])
    return array
  }
  toJSON(): any {
    return { a: this.a, b: this.b, c: this.c, d: this.d, e: this.e, f: this.f }
  }
  toString(): string {
    return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`
  }
  rotateSelf(rotX?: number, rotY?: number, rotZ?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  rotateAxisAngleSelf(x?: number, y?: number, z?: number, angle?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  rotateFromVectorSelf(x?: number, y?: number): DOMMatrix {
    throw new Error('Not implemented')
  }
  multiplySelf(other?: DOMMatrix): DOMMatrix {
    throw new Error('Not implemented')
  }
  preMultiplySelf(other?: DOMMatrix): DOMMatrix {
    throw new Error('Not implemented')
  }
}

/**
 * Polyfill for DOMPoint in jsdom environment
 */
class DOMPointPolyfill implements DOMPoint {
  x: number
  y: number
  z: number
  w: number

  constructor(x = 0, y = 0, z = 0, w = 1) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  matrixTransform(matrix?: DOMMatrix): DOMPoint {
    if (!matrix) return this as DOMPoint
    const x = this.x * matrix.a + this.y * matrix.c + matrix.e
    const y = this.x * matrix.b + this.y * matrix.d + matrix.f
    return new DOMPointPolyfill(x, y, this.z, this.w) as DOMPoint
  }

  toJSON(): any {
    return { x: this.x, y: this.y, z: this.z, w: this.w }
  }
}

// Add polyfills to global scope
if (typeof globalThis.DOMMatrix === 'undefined') {
  // @ts-expect-error - Adding polyfill
  globalThis.DOMMatrix = DOMMatrixPolyfill
}

if (typeof globalThis.DOMPoint === 'undefined') {
  // @ts-expect-error - Adding polyfill
  globalThis.DOMPoint = DOMPointPolyfill
}

/**
 * Canvas Mock for Text Measurement
 * Provides a simple mock for HTMLCanvasElement.getContext('2d')
 */
class CanvasRenderingContext2DMock {
  font = ''

  measureText(text: string) {
    // Simple approximation: average character width * text length
    // Assumes monospace-ish font with ~8px per character at 16px font size
    const fontSize = this.parseFontSize(this.font)
    const fontWeight = this.parseFontWeight(this.font)
    const weightMultiplier = fontWeight >= 700 ? 1.1 : 1.0
    const charWidth = fontSize * 0.5 * weightMultiplier
    const width = text.length * charWidth

    return {
      width,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: width,
      fontBoundingBoxAscent: fontSize * 0.8,
      fontBoundingBoxDescent: fontSize * 0.2,
      actualBoundingBoxAscent: fontSize * 0.8,
      actualBoundingBoxDescent: fontSize * 0.2,
      emHeightAscent: fontSize * 0.8,
      emHeightDescent: fontSize * 0.2,
      hangingBaseline: fontSize * 0.6,
      alphabeticBaseline: 0,
      ideographicBaseline: -fontSize * 0.2
    }
  }

  private parseFontSize(font: string): number {
    const match = font.match(/(\d+)px/)
    return match ? parseInt(match[1], 10) : 16
  }

  private parseFontWeight(font: string): number {
    const match = font.match(/^(\d+)\s/)
    return match ? parseInt(match[1], 10) : 400
  }
}

// Mock HTMLCanvasElement.getContext for tests
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext

  // @ts-expect-error - Mocking for tests
  HTMLCanvasElement.prototype.getContext = function (contextType: string, options?: any) {
    if (contextType === '2d') {
      return new CanvasRenderingContext2DMock() as any
    }
    return originalGetContext?.call(this, contextType, options) || null
  }
}
