import { describe, it, expect } from 'vitest'
import {
  validateFontFamily,
  validateFontWeight,
  validateFontStyle,
  validateFontSize,
  validateTextTransform,
  validateLetterSpacing,
  validateLineHeight,
  validateTextAlign,
  validateAnchorBox,
  validateAutoFit,
  validateTextColor
} from '../PropertyValidator'

describe('PropertyValidator - Typography', () => {
  describe('validateFontFamily', () => {
    it('should accept valid font family names', () => {
      const result = validateFontFamily('Inter')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('Inter')
    })

    it('should trim whitespace', () => {
      const result = validateFontFamily('  Arial  ')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('Arial')
    })

    it('should reject empty string', () => {
      const result = validateFontFamily('')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('cannot be empty')
    })

    it('should reject whitespace-only string', () => {
      const result = validateFontFamily('   ')
      expect(result.valid).toBe(false)
    })

    it('should reject non-string values', () => {
      const result = validateFontFamily(123 as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be a string')
    })

    it('should accept font families with spaces', () => {
      const result = validateFontFamily('Times New Roman')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('Times New Roman')
    })
  })

  describe('validateFontWeight', () => {
    describe('numeric weights', () => {
      it('should accept valid numeric weights', () => {
        const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900]
        weights.forEach((weight) => {
          const result = validateFontWeight(weight)
          expect(result.valid).toBe(true)
          expect(result.value).toBe(weight)
        })
      })

      it('should round to nearest 100', () => {
        const result = validateFontWeight(450)
        expect(result.valid).toBe(true)
        expect(result.value).toBe(500) // 450 rounds to 500
      })

      it('should clamp to 100-900 range', () => {
        const tooLow = validateFontWeight(50)
        expect(tooLow.valid).toBe(true)
        expect(tooLow.value).toBe(100)

        const tooHigh = validateFontWeight(1000)
        expect(tooHigh.valid).toBe(true)
        expect(tooHigh.value).toBe(900)
      })
    })

    describe('named weights', () => {
      it('should accept "normal" as 400', () => {
        const result = validateFontWeight('normal')
        expect(result.valid).toBe(true)
        expect(result.value).toBe(400)
      })

      it('should accept "bold" as 700', () => {
        const result = validateFontWeight('bold')
        expect(result.valid).toBe(true)
        expect(result.value).toBe(700)
      })

      it('should accept "medium" as 500', () => {
        const result = validateFontWeight('medium')
        expect(result.valid).toBe(true)
        expect(result.value).toBe(500)
      })

      it('should accept "semibold" as 600', () => {
        const result = validateFontWeight('semibold')
        expect(result.valid).toBe(true)
        expect(result.value).toBe(600)
      })

      it('should accept "light" as 300', () => {
        const result = validateFontWeight('light')
        expect(result.valid).toBe(true)
        expect(result.value).toBe(300)
      })

      it('should handle case-insensitive named weights', () => {
        const result = validateFontWeight('BOLD')
        expect(result.valid).toBe(true)
        expect(result.value).toBe(700)
      })

      it('should parse numeric strings', () => {
        const result = validateFontWeight('600')
        expect(result.valid).toBe(true)
        expect(result.value).toBe(600)
      })

      it('should reject invalid named weights', () => {
        const result = validateFontWeight('ultra-bold')
        expect(result.valid).toBe(false)
        expect(result.error).toContain('Invalid font weight')
      })
    })

    describe('edge cases', () => {
      it('should reject non-numeric, non-string values', () => {
        const result = validateFontWeight({} as any)
        expect(result.valid).toBe(false)
      })
    })
  })

  describe('validateFontStyle', () => {
    it('should accept "normal"', () => {
      const result = validateFontStyle('normal')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('normal')
    })

    it('should accept "italic"', () => {
      const result = validateFontStyle('italic')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('italic')
    })

    it('should reject invalid styles', () => {
      const result = validateFontStyle('oblique')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be one of')
    })
  })

  describe('validateFontSize', () => {
    it('should accept valid font sizes', () => {
      const result = validateFontSize(16)
      expect(result.valid).toBe(true)
      expect(result.value).toBe(16)
    })

    it('should clamp to default min (6)', () => {
      const result = validateFontSize(2)
      expect(result.valid).toBe(true)
      expect(result.value).toBe(6)
    })

    it('should clamp to default max (500)', () => {
      const result = validateFontSize(1000)
      expect(result.valid).toBe(true)
      expect(result.value).toBe(500)
    })

    it('should respect custom min constraint', () => {
      const result = validateFontSize(5, { min: 10 })
      expect(result.valid).toBe(true)
      expect(result.value).toBe(10)
    })

    it('should respect custom max constraint', () => {
      const result = validateFontSize(100, { max: 50 })
      expect(result.valid).toBe(true)
      expect(result.value).toBe(50)
    })

    it('should reject non-numeric values', () => {
      const result = validateFontSize('large' as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be a number')
    })

    it('should reject NaN', () => {
      const result = validateFontSize(NaN)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateTextTransform', () => {
    it('should accept "none"', () => {
      const result = validateTextTransform('none')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('none')
    })

    it('should accept "uppercase"', () => {
      const result = validateTextTransform('uppercase')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('uppercase')
    })

    it('should accept "title"', () => {
      const result = validateTextTransform('title')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('title')
    })

    it('should accept "sentence"', () => {
      const result = validateTextTransform('sentence')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('sentence')
    })

    it('should reject invalid transforms', () => {
      const result = validateTextTransform('capitalize')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be one of')
    })
  })

  describe('validateLetterSpacing', () => {
    it('should accept positive spacing', () => {
      const result = validateLetterSpacing(2)
      expect(result.valid).toBe(true)
      expect(result.value).toBe(2)
    })

    it('should accept negative spacing', () => {
      const result = validateLetterSpacing(-1.5)
      expect(result.valid).toBe(true)
      expect(result.value).toBe(-1.5)
    })

    it('should accept zero spacing', () => {
      const result = validateLetterSpacing(0)
      expect(result.valid).toBe(true)
      expect(result.value).toBe(0)
    })

    it('should reject non-numeric values', () => {
      const result = validateLetterSpacing('wide' as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be a number')
    })

    it('should reject NaN', () => {
      const result = validateLetterSpacing(NaN)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateLineHeight', () => {
    it('should accept valid line heights', () => {
      const result = validateLineHeight(1.5)
      expect(result.valid).toBe(true)
      expect(result.value).toBe(1.5)
    })

    it('should clamp to min (0.5)', () => {
      const result = validateLineHeight(0.2)
      expect(result.valid).toBe(true)
      expect(result.value).toBe(0.5)
    })

    it('should clamp to max (3.0)', () => {
      const result = validateLineHeight(5.0)
      expect(result.valid).toBe(true)
      expect(result.value).toBe(3.0)
    })

    it('should accept edge values', () => {
      const min = validateLineHeight(0.5)
      expect(min.valid).toBe(true)
      expect(min.value).toBe(0.5)

      const max = validateLineHeight(3.0)
      expect(max.valid).toBe(true)
      expect(max.value).toBe(3.0)
    })

    it('should reject non-numeric values', () => {
      const result = validateLineHeight('normal' as any)
      expect(result.valid).toBe(false)
    })

    it('should reject NaN', () => {
      const result = validateLineHeight(NaN)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateTextAlign', () => {
    it('should accept "left"', () => {
      const result = validateTextAlign('left')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('left')
    })

    it('should accept "center"', () => {
      const result = validateTextAlign('center')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('center')
    })

    it('should accept "right"', () => {
      const result = validateTextAlign('right')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('right')
    })

    it('should accept "justify"', () => {
      const result = validateTextAlign('justify')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('justify')
    })

    it('should reject invalid alignments', () => {
      const result = validateTextAlign('start')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be one of')
    })
  })

  describe('validateAnchorBox', () => {
    it('should accept "auto"', () => {
      const result = validateAnchorBox('auto')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('auto')
    })

    it('should accept "fixed"', () => {
      const result = validateAnchorBox('fixed')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('fixed')
    })

    it('should reject invalid modes', () => {
      const result = validateAnchorBox('flexible')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be one of')
    })
  })

  describe('validateAutoFit', () => {
    it('should accept true', () => {
      const result = validateAutoFit(true)
      expect(result.valid).toBe(true)
      expect(result.value).toBe(true)
    })

    it('should accept false', () => {
      const result = validateAutoFit(false)
      expect(result.valid).toBe(true)
      expect(result.value).toBe(false)
    })

    it('should reject non-boolean values', () => {
      const result = validateAutoFit('yes' as any)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('must be a boolean')
    })

    it('should reject numbers', () => {
      const result = validateAutoFit(1 as any)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateTextColor', () => {
    it('should accept hex colors', () => {
      const result = validateTextColor('#FF0000')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('#FF0000')
    })

    it('should accept short hex colors', () => {
      const result = validateTextColor('#F00')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('#FF0000')
    })

    it('should accept RGB colors', () => {
      const result = validateTextColor('rgb(255, 0, 0)')
      expect(result.valid).toBe(true)
      expect(result.value).toBe('#FF0000')
    })

    it('should accept RGBA colors', () => {
      const result = validateTextColor('rgba(255, 0, 0, 0.5)')
      expect(result.valid).toBe(true)
      // Should include alpha
      expect(result.value).toContain('#FF0000')
    })

    it('should reject invalid colors', () => {
      const result = validateTextColor('red')
      expect(result.valid).toBe(false)
    })
  })
})
