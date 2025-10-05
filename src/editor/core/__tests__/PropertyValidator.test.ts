import { describe, it, expect } from 'vitest'
import {
  validateColor,
  validateOpacity,
  validateStroke,
  validateTextProperties,
  validateFontSize,
  validateCornerRadius,
  validationResultToWarning,
  validationResultsToWarnings,
  getFontSizeClampMessage,
  getCornerRadiusClampMessage,
  type StrokeProperties,
  type TextProperties,
  type CornerRadiusConstraints,
} from '../PropertyValidator'

// ============================================================================
// Color Validation Tests
// ============================================================================

describe('validateColor', () => {
  describe('Hex colors', () => {
    it('validates 3-digit hex and expands to 6-digit', () => {
      const result = validateColor('#abc')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#AABBCC')
      }
    })

    it('validates 6-digit hex', () => {
      const result = validateColor('#ff5733')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#FF5733')
      }
    })

    it('validates 8-digit hex with alpha', () => {
      const result = validateColor('#ff5733aa')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#FF5733AA')
      }
    })

    it('normalizes to uppercase', () => {
      const result = validateColor('#abc123')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#ABC123')
      }
    })

    it('rejects invalid hex format', () => {
      const result = validateColor('#xyz')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Invalid hex color format')
      }
    })

    it('rejects invalid hex length', () => {
      const result = validateColor('#abcd')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Invalid hex color format')
      }
    })
  })

  describe('RGB colors', () => {
    it('converts rgb to hex', () => {
      const result = validateColor('rgb(255, 87, 51)')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#FF5733')
      }
    })

    it('converts rgba to hex with alpha', () => {
      const result = validateColor('rgba(255, 87, 51, 0.5)')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#FF573380')
      }
    })

    it('converts rgb(0, 0, 0) to #000000', () => {
      const result = validateColor('rgb(0, 0, 0)')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#000000')
      }
    })

    it('converts rgb(255, 255, 255) to #FFFFFF', () => {
      const result = validateColor('rgb(255, 255, 255)')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#FFFFFF')
      }
    })

    it('rejects RGB values out of range', () => {
      const result = validateColor('rgb(300, 0, 0)')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('RGB values must be 0-255')
      }
    })

    it('rejects invalid alpha value', () => {
      const result = validateColor('rgba(255, 87, 51, 1.5)')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Alpha must be 0-1')
      }
    })

    it('rejects invalid RGB format', () => {
      const result = validateColor('rgb(255, 87)')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Invalid RGB format')
      }
    })
  })

  describe('HSL colors', () => {
    it('converts hsl to hex', () => {
      const result = validateColor('hsl(0, 100%, 50%)')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#FF0000')
      }
    })

    it('converts hsl(120, 100%, 50%) to green', () => {
      const result = validateColor('hsl(120, 100%, 50%)')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#00FF00')
      }
    })

    it('converts hsl(240, 100%, 50%) to blue', () => {
      const result = validateColor('hsl(240, 100%, 50%)')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#0000FF')
      }
    })

    it('converts hsla to hex with alpha', () => {
      const result = validateColor('hsla(0, 100%, 50%, 0.5)')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#FF000080')
      }
    })

    it('handles hue wrapping (360+ degrees)', () => {
      const result = validateColor('hsl(360, 100%, 50%)')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#FF0000')
      }
    })

    it('rejects saturation out of range', () => {
      const result = validateColor('hsl(0, 150%, 50%)')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Saturation and lightness must be 0-100%')
      }
    })

    it('rejects invalid HSL format', () => {
      const result = validateColor('hsl(0, 100%)')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Invalid HSL format')
      }
    })
  })

  describe('Edge cases', () => {
    it('rejects non-string input', () => {
      const result = validateColor(123 as any)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Color must be a string')
      }
    })

    it('rejects unsupported color format', () => {
      const result = validateColor('red')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('Unsupported color format')
      }
    })

    it('handles whitespace in color strings', () => {
      const result = validateColor('  #ff5733  ')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.value).toBe('#FF5733')
      }
    })
  })
})

// ============================================================================
// Opacity Validation Tests
// ============================================================================

describe('validateOpacity', () => {
  it('accepts valid opacity values', () => {
    const result = validateOpacity(0.5)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value).toBe(0.5)
    }
  })

  it('clamps opacity below 0 to 0', () => {
    const result = validateOpacity(-0.5)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value).toBe(0)
    }
  })

  it('clamps opacity above 1 to 1', () => {
    const result = validateOpacity(1.5)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value).toBe(1)
    }
  })

  it('accepts string numbers', () => {
    const result = validateOpacity('0.75')
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value).toBe(0.75)
    }
  })

  it('rejects non-numeric strings', () => {
    const result = validateOpacity('abc')
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toBe('Opacity must be a number')
    }
  })

  it('accepts boundary values 0 and 1', () => {
    const result0 = validateOpacity(0)
    expect(result0.valid).toBe(true)
    if (result0.valid) {
      expect(result0.value).toBe(0)
    }

    const result1 = validateOpacity(1)
    expect(result1.valid).toBe(true)
    if (result1.valid) {
      expect(result1.value).toBe(1)
    }
  })
})

// ============================================================================
// Stroke Validation Tests
// ============================================================================

describe('validateStroke', () => {
  it('validates valid stroke properties', () => {
    const stroke: Partial<StrokeProperties> = {
      width: 2,
      join: 'round',
      cap: 'round',
    }
    const result = validateStroke(stroke)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.width).toBe(2)
      expect(result.value.join).toBe('round')
      expect(result.value.cap).toBe('round')
    }
  })

  it('validates stroke with only width', () => {
    const stroke: Partial<StrokeProperties> = { width: 1 }
    const result = validateStroke(stroke)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.width).toBe(1)
      expect(result.value.join).toBeUndefined()
      expect(result.value.cap).toBeUndefined()
    }
  })

  it('rejects missing width', () => {
    const stroke: Partial<StrokeProperties> = {}
    const result = validateStroke(stroke)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Stroke width is required')
    }
  })

  it('rejects negative width', () => {
    const stroke: Partial<StrokeProperties> = { width: -1 }
    const result = validateStroke(stroke)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Stroke width must be a non-negative number')
    }
  })

  it('rejects invalid join value', () => {
    const stroke: Partial<StrokeProperties> = { width: 2, join: 'invalid' as any }
    const result = validateStroke(stroke)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Stroke join must be one of')
    }
  })

  it('rejects invalid cap value', () => {
    const stroke: Partial<StrokeProperties> = { width: 2, cap: 'invalid' as any }
    const result = validateStroke(stroke)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Stroke cap must be one of')
    }
  })

  it('accepts all valid join values', () => {
    const joins: Array<'miter' | 'round' | 'bevel'> = ['miter', 'round', 'bevel']
    joins.forEach((join) => {
      const result = validateStroke({ width: 1, join })
      expect(result.valid).toBe(true)
    })
  })

  it('accepts all valid cap values', () => {
    const caps: Array<'butt' | 'round' | 'square'> = ['butt', 'round', 'square']
    caps.forEach((cap) => {
      const result = validateStroke({ width: 1, cap })
      expect(result.valid).toBe(true)
    })
  })
})

// ============================================================================
// Text Properties Validation Tests
// ============================================================================

describe('validateTextProperties', () => {
  it('validates all text properties', () => {
    const text: Partial<TextProperties> = {
      fontFamily: 'Arial',
      fontWeight: 700,
      fontSize: 16,
      lineHeight: 1.5,
      letterSpacing: '0.5px',
      textAlign: 'center',
    }
    const result = validateTextProperties(text)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.fontFamily).toBe('Arial')
      expect(result.value.fontWeight).toBe(700)
      expect(result.value.fontSize).toBe(16)
    }
  })

  it('validates empty object', () => {
    const result = validateTextProperties({})
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value).toEqual({})
    }
  })

  it('trims font family whitespace', () => {
    const text: Partial<TextProperties> = { fontFamily: '  Arial  ' }
    const result = validateTextProperties(text)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.fontFamily).toBe('Arial')
    }
  })

  it('rejects empty font family', () => {
    const text: Partial<TextProperties> = { fontFamily: '   ' }
    const result = validateTextProperties(text)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Font family must be a non-empty string')
    }
  })

  it('validates numeric font weight', () => {
    const result = validateTextProperties({ fontWeight: 400 })
    expect(result.valid).toBe(true)
  })

  it('validates string font weight', () => {
    const result = validateTextProperties({ fontWeight: 'bold' })
    expect(result.valid).toBe(true)
  })

  it('rejects invalid font weight', () => {
    const result = validateTextProperties({ fontWeight: 550 as any })
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Font weight must be one of')
    }
  })

  it('clamps font size to minimum', () => {
    const result = validateTextProperties({ fontSize: 2 })
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.fontSize).toBe(6)
    }
  })

  it('clamps font size to maximum', () => {
    const result = validateTextProperties({ fontSize: 1000 })
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.fontSize).toBe(500)
    }
  })

  it('accepts numeric line height', () => {
    const result = validateTextProperties({ lineHeight: 1.5 })
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.lineHeight).toBe(1.5)
    }
  })

  it('accepts string line height', () => {
    const result = validateTextProperties({ lineHeight: '24px' })
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.lineHeight).toBe('24px')
    }
  })

  it('rejects negative line height', () => {
    const result = validateTextProperties({ lineHeight: -1 })
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Line height must be non-negative')
    }
  })

  it('accepts all valid text align values', () => {
    const aligns: Array<'left' | 'center' | 'right' | 'justify'> = ['left', 'center', 'right', 'justify']
    aligns.forEach((align) => {
      const result = validateTextProperties({ textAlign: align })
      expect(result.valid).toBe(true)
    })
  })

  it('rejects invalid text align', () => {
    const result = validateTextProperties({ textAlign: 'invalid' as any })
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toContain('Text align must be one of')
    }
  })
})

// ============================================================================
// Font Size Validation Tests
// ============================================================================

describe('validateFontSize', () => {
  it('validates font size within range', () => {
    const result = validateFontSize(16)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value).toBe(16)
    }
  })

  it('clamps font size below minimum (6)', () => {
    const result = validateFontSize(2)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value).toBe(6)
    }
  })

  it('clamps font size above maximum (500)', () => {
    const result = validateFontSize(1000)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value).toBe(500)
    }
  })

  it('rejects non-numeric input', () => {
    const result = validateFontSize('abc' as any)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toBe('Font size must be a number')
    }
  })

  it('rejects NaN', () => {
    const result = validateFontSize(NaN)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toBe('Font size must be a number')
    }
  })

  it('accepts boundary values', () => {
    const result6 = validateFontSize(6)
    expect(result6.valid).toBe(true)
    if (result6.valid) {
      expect(result6.value).toBe(6)
    }

    const result500 = validateFontSize(500)
    expect(result500.valid).toBe(true)
    if (result500.valid) {
      expect(result500.value).toBe(500)
    }
  })
})

// ============================================================================
// Corner Radius Validation Tests
// ============================================================================

describe('validateCornerRadius', () => {
  it('validates corner radius within bounds', () => {
    const constraints: CornerRadiusConstraints = { width: 100, height: 100 }
    const result = validateCornerRadius(10, 10, constraints)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.rx).toBe(10)
      expect(result.value.ry).toBe(10)
    }
  })

  it('clamps corner radius to max (min(w,h)/2)', () => {
    const constraints: CornerRadiusConstraints = { width: 100, height: 100 }
    const result = validateCornerRadius(60, 60, constraints)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.rx).toBe(50)
      expect(result.value.ry).toBe(50)
    }
  })

  it('clamps negative corner radius to 0', () => {
    const constraints: CornerRadiusConstraints = { width: 100, height: 100 }
    const result = validateCornerRadius(-10, -10, constraints)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.rx).toBe(0)
      expect(result.value.ry).toBe(0)
    }
  })

  it('handles different width and height', () => {
    const constraints: CornerRadiusConstraints = { width: 200, height: 100 }
    // Max radius should be min(200, 100) / 2 = 50
    const result = validateCornerRadius(60, 60, constraints)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.rx).toBe(50)
      expect(result.value.ry).toBe(50)
    }
  })

  it('handles different rx and ry values', () => {
    const constraints: CornerRadiusConstraints = { width: 100, height: 100 }
    const result = validateCornerRadius(20, 30, constraints)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.rx).toBe(20)
      expect(result.value.ry).toBe(30)
    }
  })

  it('rejects zero or negative width', () => {
    const constraints: CornerRadiusConstraints = { width: 0, height: 100 }
    const result = validateCornerRadius(10, 10, constraints)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toBe('Width and height must be positive')
    }
  })

  it('rejects zero or negative height', () => {
    const constraints: CornerRadiusConstraints = { width: 100, height: -10 }
    const result = validateCornerRadius(10, 10, constraints)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.error).toBe('Width and height must be positive')
    }
  })

  it('clamps only rx when rx exceeds max', () => {
    const constraints: CornerRadiusConstraints = { width: 100, height: 100 }
    const result = validateCornerRadius(60, 20, constraints)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.rx).toBe(50)
      expect(result.value.ry).toBe(20)
    }
  })

  it('clamps only ry when ry exceeds max', () => {
    const constraints: CornerRadiusConstraints = { width: 100, height: 100 }
    const result = validateCornerRadius(20, 60, constraints)
    expect(result.valid).toBe(true)
    if (result.valid) {
      expect(result.value.rx).toBe(20)
      expect(result.value.ry).toBe(50)
    }
  })
})

// ============================================================================
// Error Helper Tests
// ============================================================================

describe('validationResultToWarning', () => {
  it('returns null for valid results', () => {
    const result = { valid: true as const, value: '#FF0000' }
    const warning = validationResultToWarning(result, 'color')
    expect(warning).toBeNull()
  })

  it('creates warning for invalid results', () => {
    const result = { valid: false as const, error: 'Invalid color', attempted: 'red' }
    const warning = validationResultToWarning(result, 'color')
    expect(warning).not.toBeNull()
    expect(warning?.property).toBe('color')
    expect(warning?.message).toBe('Invalid color')
    expect(warning?.severity).toBe('error')
  })

  it('supports custom severity', () => {
    const result = { valid: false as const, error: 'Invalid color' }
    const warning = validationResultToWarning(result, 'color', 'warning')
    expect(warning?.severity).toBe('warning')
  })
})

describe('validationResultsToWarnings', () => {
  it('filters out valid results', () => {
    const results = [
      { result: { valid: true as const, value: '#FF0000' }, propertyName: 'color' },
      { result: { valid: false as const, error: 'Invalid size' }, propertyName: 'fontSize' },
    ]
    const warnings = validationResultsToWarnings(results)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].property).toBe('fontSize')
  })

  it('returns empty array when all valid', () => {
    const results = [
      { result: { valid: true as const, value: '#FF0000' }, propertyName: 'color' },
      { result: { valid: true as const, value: 16 }, propertyName: 'fontSize' },
    ]
    const warnings = validationResultsToWarnings(results)
    expect(warnings).toHaveLength(0)
  })
})

describe('getFontSizeClampMessage', () => {
  it('returns null when no clamping occurred', () => {
    const message = getFontSizeClampMessage(16, 16)
    expect(message).toBeNull()
  })

  it('returns minimum clamp message', () => {
    const message = getFontSizeClampMessage(2, 6)
    expect(message).toBe('Font size clamped to minimum (6px)')
  })

  it('returns maximum clamp message', () => {
    const message = getFontSizeClampMessage(1000, 500)
    expect(message).toBe('Font size clamped to maximum (500px)')
  })
})

describe('getCornerRadiusClampMessage', () => {
  it('returns null when no clamping occurred', () => {
    const constraints: CornerRadiusConstraints = { width: 100, height: 100 }
    const message = getCornerRadiusClampMessage(
      { rx: 10, ry: 10 },
      { rx: 10, ry: 10 },
      constraints
    )
    expect(message).toBeNull()
  })

  it('returns message when rx was clamped', () => {
    const constraints: CornerRadiusConstraints = { width: 100, height: 100 }
    const message = getCornerRadiusClampMessage(
      { rx: 60, ry: 10 },
      { rx: 50, ry: 10 },
      constraints
    )
    expect(message).toContain('rx clamped to 50px')
  })

  it('returns message when ry was clamped', () => {
    const constraints: CornerRadiusConstraints = { width: 100, height: 100 }
    const message = getCornerRadiusClampMessage(
      { rx: 10, ry: 60 },
      { rx: 10, ry: 50 },
      constraints
    )
    expect(message).toContain('ry clamped to 50px')
  })

  it('returns message when both rx and ry were clamped', () => {
    const constraints: CornerRadiusConstraints = { width: 100, height: 100 }
    const message = getCornerRadiusClampMessage(
      { rx: 60, ry: 60 },
      { rx: 50, ry: 50 },
      constraints
    )
    expect(message).toContain('rx clamped to 50px')
    expect(message).toContain('ry clamped to 50px')
  })
})
