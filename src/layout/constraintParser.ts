/**
 * Parse constraint DSL strings into structured constraint objects
 *
 * Supported formats:
 * - Equality: "cta.bottom = canvas.bottom - 32"
 * - Inequality: "headline.top >= logo.bottom + 12"
 * - Expressions: "subject.height <= canvas.height * 0.45"
 */

export interface ParsedConstraint {
  type: 'equality' | 'inequality'
  left: {
    slot: string
    property: 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height' | 'centerX' | 'centerY'
  }
  operator: '=' | '>=' | '<=' | '>' | '<'
  right: {
    slot: string
    property: 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height' | 'centerX' | 'centerY'
    offset?: number
    multiplier?: number
  }
}

/**
 * Parse a constraint string like "cta.bottom = canvas.bottom - 32"
 */
export function parseConstraintString(constraint: string): ParsedConstraint | null {
  // Clean whitespace
  const cleaned = constraint.trim()

  // Match pattern: "slot.property operator slot.property [+/- number] [* number]"
  const pattern = /^(\w+)\.(\w+)\s*(=|>=|<=|>|<)\s*(\w+)\.(\w+)\s*([+\-]\s*[\d.]+)?\s*(\*\s*[\d.]+)?$/

  const match = cleaned.match(pattern)
  if (!match) {
    console.warn(`Failed to parse constraint: ${constraint}`)
    return null
  }

  const [, leftSlot, leftProp, operator, rightSlot, rightProp, offsetStr, multiplierStr] = match

  // Valid geometric properties for kiwi.js solver
  const validProps = new Set(['left', 'right', 'top', 'bottom', 'width', 'height', 'centerX', 'centerY'])

  // Skip constraints with non-geometric properties (fontSize, fontWeight, etc.)
  if (!validProps.has(leftProp) || !validProps.has(rightProp)) {
    console.warn(`Skipping non-geometric constraint: ${constraint}`)
    return null
  }

  const type = operator === '=' ? 'equality' : 'inequality'

  const result: ParsedConstraint = {
    type,
    left: {
      slot: leftSlot,
      property: leftProp as any
    },
    operator: operator as any,
    right: {
      slot: rightSlot,
      property: rightProp as any
    }
  }

  // Parse offset (e.g., "- 32" or "+ 12")
  if (offsetStr) {
    const offset = parseFloat(offsetStr.replace(/\s/g, ''))
    result.right.offset = offset
  }

  // Parse multiplier (e.g., "* 0.45")
  if (multiplierStr) {
    const multiplier = parseFloat(multiplierStr.replace(/[*\s]/g, ''))
    result.right.multiplier = multiplier
  }

  return result
}

/**
 * Parse all constraints from a template
 */
export function parseConstraints(constraints: {
  global?: Array<{ eq?: string; ineq?: string; [key: string]: any }>
  byRatio?: Record<string, Array<{ eq?: string; ineq?: string; [key: string]: any }>>
}): {
  global: ParsedConstraint[]
  byRatio: Record<string, ParsedConstraint[]>
} {
  const result = {
    global: [] as ParsedConstraint[],
    byRatio: {} as Record<string, ParsedConstraint[]>
  }

  // Parse global constraints
  if (constraints.global) {
    for (const c of constraints.global) {
      if (c.eq) {
        const parsed = parseConstraintString(c.eq)
        if (parsed) result.global.push(parsed)
      }
      if (c.ineq) {
        const parsed = parseConstraintString(c.ineq)
        if (parsed) result.global.push(parsed)
      }
    }
  }

  // Parse ratio-specific constraints
  if (constraints.byRatio) {
    for (const [ratio, ratioConstraints] of Object.entries(constraints.byRatio)) {
      result.byRatio[ratio] = []
      for (const c of ratioConstraints) {
        if (c.eq) {
          const parsed = parseConstraintString(c.eq)
          if (parsed) result.byRatio[ratio].push(parsed)
        }
        if (c.ineq) {
          const parsed = parseConstraintString(c.ineq)
          if (parsed) result.byRatio[ratio].push(parsed)
        }
      }
    }
  }

  return result
}
