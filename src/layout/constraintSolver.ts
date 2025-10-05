import * as kiwi from 'kiwi.js'
import type { Template, Slot } from '../schema/types'
import { parseConstraints, type ParsedConstraint } from './constraintParser'

export interface FrameMap {
  [slotName: string]: {
    x: number
    y: number
    width: number
    height: number
    fontSize?: number
  }
}

interface SlotVariables {
  left: kiwi.Variable
  right: kiwi.Variable
  top: kiwi.Variable
  bottom: kiwi.Variable
  width: kiwi.Variable
  height: kiwi.Variable
  centerX: kiwi.Variable
  centerY: kiwi.Variable
}

/**
 * Apply constraints using kiwi.js Cassowary solver
 * Returns frame positions for all slots
 *
 * DEPRECATED: This is a legacy function for single-page templates.
 * Multi-page templates should use page.frames[ratioId] directly.
 */
export function applyConstraints(
  template: Template,
  canvasWidth: number,
  canvasHeight: number,
  currentRatio?: string
): FrameMap {
  console.warn('[constraintSolver] DEPRECATED: Using legacy constraint solver. Multi-page templates should use page.frames directly.')

  // Get slots from first page if using multi-page structure, otherwise use legacy slots
  const slots: Slot[] = template.pages && template.pages.length > 0
    ? template.pages[0].slots
    : []

  if (slots.length === 0) {
    console.warn('[constraintSolver] No slots found to apply constraints to')
    return {}
  }

  const solver = new kiwi.Solver()
  const slotVars: Record<string, SlotVariables> = {}

  // Create variables for canvas
  const canvasVars: SlotVariables = {
    left: new kiwi.Variable('canvas.left'),
    right: new kiwi.Variable('canvas.right'),
    top: new kiwi.Variable('canvas.top'),
    bottom: new kiwi.Variable('canvas.bottom'),
    width: new kiwi.Variable('canvas.width'),
    height: new kiwi.Variable('canvas.height'),
    centerX: new kiwi.Variable('canvas.centerX'),
    centerY: new kiwi.Variable('canvas.centerY')
  }
  slotVars['canvas'] = canvasVars

  // Set canvas constraints (these are fixed)
  solver.addConstraint(new kiwi.Constraint(canvasVars.left, kiwi.Operator.Eq, 0, kiwi.Strength.required))
  solver.addConstraint(new kiwi.Constraint(canvasVars.top, kiwi.Operator.Eq, 0, kiwi.Strength.required))
  solver.addConstraint(new kiwi.Constraint(canvasVars.width, kiwi.Operator.Eq, canvasWidth, kiwi.Strength.required))
  solver.addConstraint(new kiwi.Constraint(canvasVars.height, kiwi.Operator.Eq, canvasHeight, kiwi.Strength.required))
  solver.addConstraint(new kiwi.Constraint(canvasVars.right, kiwi.Operator.Eq, canvasWidth, kiwi.Strength.required))
  solver.addConstraint(new kiwi.Constraint(canvasVars.bottom, kiwi.Operator.Eq, canvasHeight, kiwi.Strength.required))
  solver.addConstraint(new kiwi.Constraint(canvasVars.centerX, kiwi.Operator.Eq, canvasWidth / 2, kiwi.Strength.required))
  solver.addConstraint(new kiwi.Constraint(canvasVars.centerY, kiwi.Operator.Eq, canvasHeight / 2, kiwi.Strength.required))

  // Create variables for each slot
  for (const slot of slots) {
    const vars: SlotVariables = {
      left: new kiwi.Variable(`${slot.name}.left`),
      right: new kiwi.Variable(`${slot.name}.right`),
      top: new kiwi.Variable(`${slot.name}.top`),
      bottom: new kiwi.Variable(`${slot.name}.bottom`),
      width: new kiwi.Variable(`${slot.name}.width`),
      height: new kiwi.Variable(`${slot.name}.height`),
      centerX: new kiwi.Variable(`${slot.name}.centerX`),
      centerY: new kiwi.Variable(`${slot.name}.centerY`)
    }
    slotVars[slot.name] = vars

    // Add basic geometric constraints (these always hold)
    solver.addConstraint(new kiwi.Constraint(vars.right, kiwi.Operator.Eq, new kiwi.Expression(vars.left, vars.width), kiwi.Strength.required))
    solver.addConstraint(new kiwi.Constraint(vars.bottom, kiwi.Operator.Eq, new kiwi.Expression(vars.top, vars.height), kiwi.Strength.required))
    solver.addConstraint(new kiwi.Constraint(vars.centerX, kiwi.Operator.Eq, new kiwi.Expression([1, vars.left], [0.5, vars.width]), kiwi.Strength.required))
    solver.addConstraint(new kiwi.Constraint(vars.centerY, kiwi.Operator.Eq, new kiwi.Expression([1, vars.top], [0.5, vars.height]), kiwi.Strength.required))

    // Minimum size constraints (prevent negative sizes)
    solver.addConstraint(new kiwi.Constraint(vars.width, kiwi.Operator.Ge, 10, kiwi.Strength.required))
    solver.addConstraint(new kiwi.Constraint(vars.height, kiwi.Operator.Ge, 10, kiwi.Strength.required))

    // Default size suggestions (weak strength, can be overridden)
    const defaultWidth = slot.type === 'text' ? 300 : 100
    const defaultHeight = slot.type === 'text' ? 50 : 100
    solver.addConstraint(new kiwi.Constraint(vars.width, kiwi.Operator.Eq, defaultWidth, kiwi.Strength.weak))
    solver.addConstraint(new kiwi.Constraint(vars.height, kiwi.Operator.Eq, defaultHeight, kiwi.Strength.weak))
  }

  // Parse and add template constraints
  const parsed = parseConstraints(template.constraints)

  // Add global constraints
  for (const constraint of parsed.global) {
    addConstraintToSolver(solver, slotVars, constraint)
  }

  // Add ratio-specific constraints
  if (currentRatio && parsed.byRatio[currentRatio]) {
    for (const constraint of parsed.byRatio[currentRatio]) {
      addConstraintToSolver(solver, slotVars, constraint)
    }
  }

  // Solve the system
  solver.updateVariables()

  // Extract results
  const frames: FrameMap = {}
  for (const slot of slots) {
    const vars = slotVars[slot.name]
    const frame = {
      x: vars.left.value(),
      y: vars.top.value(),
      width: vars.width.value(),
      height: vars.height.value()
    }
    frames[slot.name] = frame

    console.log(`[constraintSolver] ${slot.name}:`, frame)

    // Calculate font size for text slots based on height
    if (slot.type === 'text') {
      const heightRatio = canvasHeight / 1080 // Normalize to base 1080
      const baseSize = slot.style === 'heading' ? 48 : slot.style === 'subhead' ? 24 : 16
      frames[slot.name].fontSize = Math.round(baseSize * heightRatio)
    }
  }

  return frames
}

/**
 * Add a parsed constraint to the kiwi solver
 */
function addConstraintToSolver(
  solver: kiwi.Solver,
  slotVars: Record<string, SlotVariables>,
  constraint: ParsedConstraint
) {
  const leftVars = slotVars[constraint.left.slot]
  const rightVars = slotVars[constraint.right.slot]

  if (!leftVars || !rightVars) {
    console.warn(`Cannot add constraint: unknown slot ${constraint.left.slot} or ${constraint.right.slot}`)
    return
  }

  const leftVar = leftVars[constraint.left.property]
  const rightVar = rightVars[constraint.right.property]

  // Build right-hand expression
  let rightExpr: kiwi.Expression = new kiwi.Expression(rightVar)

  // Apply multiplier first
  if (constraint.right.multiplier !== undefined) {
    rightExpr = new kiwi.Expression([constraint.right.multiplier, rightVar])
  }

  // Apply offset
  if (constraint.right.offset !== undefined) {
    rightExpr = new kiwi.Expression(rightExpr, constraint.right.offset)
  }

  // Map operator
  const operator = constraint.operator === '=' ? kiwi.Operator.Eq
    : constraint.operator === '>=' ? kiwi.Operator.Ge
    : constraint.operator === '<=' ? kiwi.Operator.Le
    : constraint.operator === '>' ? kiwi.Operator.Ge
    : kiwi.Operator.Le

  // Create and add constraint
  const strength = constraint.type === 'equality' ? kiwi.Strength.strong : kiwi.Strength.medium
  const kiwiConstraint = new kiwi.Constraint(leftVar, operator, rightExpr, strength)

  try {
    solver.addConstraint(kiwiConstraint)
  } catch (error) {
    console.warn(`Failed to add constraint: ${error}`)
  }
}
