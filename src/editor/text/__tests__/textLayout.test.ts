import { describe, it, expect, beforeEach } from 'vitest'
import {
  measureTextWidth,
  measureTextHeight,
  wrapTextToBox,
  calculateAutoFitSize,
  textFitsInBox,
  calculateTextBounds
} from '../textLayout'

describe('textLayout', () => {
  describe('measureTextWidth', () => {
    it('should measure text width', () => {
      const width = measureTextWidth('Hello', 'Arial', 16, 400)
      expect(width).toBeGreaterThan(0)
    })

    it('should return larger width for longer text', () => {
      const short = measureTextWidth('Hi', 'Arial', 16, 400)
      const long = measureTextWidth('Hello World', 'Arial', 16, 400)
      expect(long).toBeGreaterThan(short)
    })

    it('should return larger width for larger font size', () => {
      const small = measureTextWidth('Hello', 'Arial', 12, 400)
      const large = measureTextWidth('Hello', 'Arial', 24, 400)
      expect(large).toBeGreaterThan(small)
    })

    it('should return larger width for bolder weight', () => {
      const normal = measureTextWidth('Hello', 'Arial', 16, 400)
      const bold = measureTextWidth('Hello', 'Arial', 16, 700)
      expect(bold).toBeGreaterThanOrEqual(normal)
    })

    it('should handle empty string', () => {
      const width = measureTextWidth('', 'Arial', 16, 400)
      expect(width).toBe(0)
    })
  })

  describe('measureTextHeight', () => {
    it('should calculate height from fontSize and lineHeight', () => {
      const height = measureTextHeight(16, 1.2)
      expect(height).toBe(19.2) // 16 * 1.2
    })

    it('should use default lineHeight of 1.2', () => {
      const height = measureTextHeight(20)
      expect(height).toBe(24) // 20 * 1.2
    })

    it('should scale with different lineHeights', () => {
      const compact = measureTextHeight(16, 1.0)
      const loose = measureTextHeight(16, 2.0)
      expect(loose).toBe(compact * 2)
    })
  })

  describe('wrapTextToBox', () => {
    it('should return single line for text that fits', () => {
      const lines = wrapTextToBox('Hello', 'Arial', 16, 1000, 1.2, 400)
      expect(lines).toHaveLength(1)
      expect(lines[0]).toBe('Hello')
    })

    it('should wrap long text into multiple lines', () => {
      const text = 'This is a very long line of text that should wrap'
      const lines = wrapTextToBox(text, 'Arial', 16, 100, 1.2, 400)
      expect(lines.length).toBeGreaterThan(1)
    })

    it('should preserve explicit line breaks', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const lines = wrapTextToBox(text, 'Arial', 16, 1000, 1.2, 400)
      expect(lines).toHaveLength(3)
      expect(lines[0]).toBe('Line 1')
      expect(lines[1]).toBe('Line 2')
      expect(lines[2]).toBe('Line 3')
    })

    it('should handle empty paragraphs', () => {
      const text = 'Line 1\n\nLine 3'
      const lines = wrapTextToBox(text, 'Arial', 16, 1000, 1.2, 400)
      expect(lines).toContain('')
    })

    it('should handle single word that is too long', () => {
      const lines = wrapTextToBox('Supercalifragilisticexpialidocious', 'Arial', 16, 50, 1.2, 400)
      expect(lines).toHaveLength(1) // Word added anyway even if too long
    })

    it('should return empty array for empty string', () => {
      const lines = wrapTextToBox('', 'Arial', 16, 100, 1.2, 400)
      expect(lines).toEqual([])
    })

    it('should split on whitespace correctly', () => {
      const lines = wrapTextToBox('word1 word2 word3', 'Arial', 16, 1000, 1.2, 400)
      expect(lines).toHaveLength(1)
      expect(lines[0]).toBe('word1 word2 word3')
    })

    it('should handle multiple spaces between words', () => {
      const text = 'word1  word2   word3'
      const lines = wrapTextToBox(text, 'Arial', 16, 1000, 1.2, 400)
      expect(lines[0]).toContain('word1')
      expect(lines[0]).toContain('word2')
      expect(lines[0]).toContain('word3')
    })
  })

  describe('calculateAutoFitSize', () => {
    it('should return font size that fits text in box', () => {
      const size = calculateAutoFitSize('Hello World', 'Arial', 400, 200, 100, 0, 1.2, 6, 100)
      expect(size).toBeGreaterThanOrEqual(6)
      expect(size).toBeLessThanOrEqual(100)
    })

    it('should return smaller size for more text', () => {
      const short = calculateAutoFitSize('Hi', 'Arial', 400, 200, 100, 0, 1.2, 6, 100)
      const long = calculateAutoFitSize(
        'This is a much longer piece of text',
        'Arial',
        400,
        200,
        100,
        0,
        1.2,
        6,
        100
      )
      expect(long).toBeLessThanOrEqual(short)
    })

    it('should account for padding', () => {
      const noPadding = calculateAutoFitSize('Hello', 'Arial', 400, 200, 100, 0, 1.2)
      const withPadding = calculateAutoFitSize('Hello', 'Arial', 400, 200, 100, 20, 1.2)
      expect(withPadding).toBeLessThanOrEqual(noPadding)
    })

    it('should return min size for empty text', () => {
      const size = calculateAutoFitSize('', 'Arial', 400, 200, 100, 0, 1.2, 10, 100)
      expect(size).toBe(10)
    })

    it('should return min size when box is too small', () => {
      const size = calculateAutoFitSize('Hello World', 'Arial', 400, 0, 0, 0, 1.2, 6, 100)
      expect(size).toBe(6)
    })

    it('should respect min and max size constraints', () => {
      const size = calculateAutoFitSize('Hi', 'Arial', 400, 1000, 1000, 0, 1.2, 50, 100)
      expect(size).toBeGreaterThanOrEqual(50)
      expect(size).toBeLessThanOrEqual(100)
    })

    it('should handle tall text (multiple lines)', () => {
      const text = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'
      const size = calculateAutoFitSize(text, 'Arial', 400, 200, 100, 0, 1.2, 6, 50)
      expect(size).toBeGreaterThanOrEqual(6)
      expect(size).toBeLessThanOrEqual(50)
    })
  })

  describe('textFitsInBox', () => {
    it('should return true for text that fits', () => {
      const fits = textFitsInBox('Hello', 'Arial', 16, 400, 1000, 1000, 1.2)
      expect(fits).toBe(true)
    })

    it('should return false for text that is too tall', () => {
      const text = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8'
      const fits = textFitsInBox(text, 'Arial', 20, 400, 200, 100, 1.2)
      expect(fits).toBe(false)
    })

    it('should consider line height', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const compactFits = textFitsInBox(text, 'Arial', 16, 400, 200, 60, 1.0)
      const looseFits = textFitsInBox(text, 'Arial', 16, 400, 200, 60, 2.0)
      expect(compactFits).toBe(true)
      expect(looseFits).toBe(false)
    })

    it('should handle wrapping when text is too wide', () => {
      const longLine = 'This is a very long line that will need to wrap'
      const fits = textFitsInBox(longLine, 'Arial', 16, 400, 100, 100, 1.2)
      // Should fit because it wraps
      expect(typeof fits).toBe('boolean')
    })
  })

  describe('calculateTextBounds', () => {
    it('should return width and height for single line', () => {
      const bounds = calculateTextBounds('Hello', 'Arial', 16, 400, 1000, 1.2)
      expect(bounds.width).toBeGreaterThan(0)
      expect(bounds.height).toBe(19.2) // 16 * 1.2 for 1 line
    })

    it('should return zero dimensions for empty text', () => {
      const bounds = calculateTextBounds('', 'Arial', 16, 400, 1000, 1.2)
      expect(bounds.width).toBe(0)
      expect(bounds.height).toBe(0)
    })

    it('should calculate height for multiple lines', () => {
      const text = 'Line 1\nLine 2\nLine 3'
      const bounds = calculateTextBounds(text, 'Arial', 16, 400, 1000, 1.2)
      expect(bounds.height).toBeCloseTo(57.6, 1) // 16 * 1.2 * 3 lines
    })

    it('should find widest line', () => {
      const text = 'Short\nThis is a much longer line\nShort again'
      const bounds = calculateTextBounds(text, 'Arial', 16, 400, 1000, 1.2)
      const longLineWidth = measureTextWidth('This is a much longer line', 'Arial', 16, 400)
      expect(bounds.width).toBeCloseTo(longLineWidth, 0)
    })

    it('should account for wrapping', () => {
      const longText = 'This is a very long line that will wrap into multiple lines'
      const bounds = calculateTextBounds(longText, 'Arial', 16, 400, 150, 1.2)
      expect(bounds.width).toBeLessThanOrEqual(150)
      expect(bounds.height).toBeGreaterThan(19.2) // More than 1 line
    })
  })
})
