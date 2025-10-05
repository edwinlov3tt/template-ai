/**
 * LayoutSolver: Safe constraint solving using Kiwi.js (Cassowary algorithm)
 *
 * Accepts pre-validated constraint sets and solves for optimal frame positions.
 * Never throws - returns original frames with error object on failure.
 */

import * as kiwi from '@lume/kiwi'
import type { ParsedConstraint } from '../../layout/constraintParser'

export interface Frame {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

export interface FrameMap {
  [slotName: string]: Frame
}

export interface SolverError {
  message: string
  details?: unknown
  failedConstraints?: ParsedConstraint[]
}

export interface SolverResult {
  frames: FrameMap
  error?: SolverError
}

export interface SlotVariables {
  left: kiwi.Variable
  right: kiwi.Variable
  top: kiwi.Variable
  bottom: kiwi.Variable
  width: kiwi.Variable
  height: kiwi.Variable
  centerX: kiwi.Variable
  centerY: kiwi.Variable
}

export interface SolverOptions {
  /** Canvas dimensions in viewBox units */
  canvasWidth: number
  canvasHeight: number
  /** Minimum allowed slot dimensions */
  minSlotWidth?: number
  minSlotHeight?: number
  /** Slot names to create variables for */
  slotNames: string[]
  /** Default dimensions for slots without constraints */
  defaultDimensions?: {
    width: number
    height: number
  }
}

/**
 * Solve layout constraints and return updated frame positions
 *
 * @param inputFrames - Current frame positions (returned unchanged on error)
 * @param constraints - Pre-validated constraint set from parser
 * @param options - Canvas dimensions and slot configuration
 * @returns Result containing updated frames or original frames + error
 */
export function solveLayout(
  inputFrames: FrameMap,
  constraints: ParsedConstraint[],
  options: SolverOptions
): SolverResult {
  const { canvasWidth, canvasHeight, slotNames } = options
  const minWidth = options.minSlotWidth ?? 10
  const minHeight = options.minSlotHeight ?? 10
  const defaultWidth = options.defaultDimensions?.width ?? 100
  const defaultHeight = options.defaultDimensions?.height ?? 100

  try {
    const solver = new kiwi.Solver()
    const slotVars: Record<string, SlotVariables> = {}

    // Create canvas variables
    const canvasVars = createSlotVariables('canvas')
    slotVars['canvas'] = canvasVars

    // Set fixed canvas constraints
    addConstraintSafe(solver, canvasVars.left, kiwi.Operator.Eq, 0, kiwi.Strength.required)
    addConstraintSafe(solver, canvasVars.top, kiwi.Operator.Eq, 0, kiwi.Strength.required)
    addConstraintSafe(solver, canvasVars.width, kiwi.Operator.Eq, canvasWidth, kiwi.Strength.required)
    addConstraintSafe(solver, canvasVars.height, kiwi.Operator.Eq, canvasHeight, kiwi.Strength.required)
    addConstraintSafe(solver, canvasVars.right, kiwi.Operator.Eq, canvasWidth, kiwi.Strength.required)
    addConstraintSafe(solver, canvasVars.bottom, kiwi.Operator.Eq, canvasHeight, kiwi.Strength.required)
    addConstraintSafe(solver, canvasVars.centerX, kiwi.Operator.Eq, canvasWidth / 2, kiwi.Strength.required)
    addConstraintSafe(solver, canvasVars.centerY, kiwi.Operator.Eq, canvasHeight / 2, kiwi.Strength.required)

    // Create variables for each slot
    for (const slotName of slotNames) {
      const vars = createSlotVariables(slotName)
      slotVars[slotName] = vars

      // Add geometric identity constraints (always hold)
      // IMPORTANT: Preserve tuple ordering [coefficient, variable] for Expression
      // Bug fix: coefficients must come FIRST in tuple arrays
      addConstraintSafe(
        solver,
        vars.right,
        kiwi.Operator.Eq,
        new kiwi.Expression(vars.left, vars.width),
        kiwi.Strength.required
      )
      addConstraintSafe(
        solver,
        vars.bottom,
        kiwi.Operator.Eq,
        new kiwi.Expression(vars.top, vars.height),
        kiwi.Strength.required
      )
      addConstraintSafe(
        solver,
        vars.centerX,
        kiwi.Operator.Eq,
        new kiwi.Expression([1, vars.left], [0.5, vars.width]),
        kiwi.Strength.required
      )
      addConstraintSafe(
        solver,
        vars.centerY,
        kiwi.Operator.Eq,
        new kiwi.Expression([1, vars.top], [0.5, vars.height]),
        kiwi.Strength.required
      )

      // Minimum size constraints
      addConstraintSafe(solver, vars.width, kiwi.Operator.Ge, minWidth, kiwi.Strength.required)
      addConstraintSafe(solver, vars.height, kiwi.Operator.Ge, minHeight, kiwi.Strength.required)

      // Default size suggestions (weak - can be overridden)
      addConstraintSafe(solver, vars.width, kiwi.Operator.Eq, defaultWidth, kiwi.Strength.weak)
      addConstraintSafe(solver, vars.height, kiwi.Operator.Eq, defaultHeight, kiwi.Strength.weak)

      // Suggest current positions if available (medium strength)
      const currentFrame = inputFrames[slotName]
      if (currentFrame) {
        addConstraintSafe(solver, vars.left, kiwi.Operator.Eq, currentFrame.x, kiwi.Strength.medium)
        addConstraintSafe(solver, vars.top, kiwi.Operator.Eq, currentFrame.y, kiwi.Strength.medium)
        addConstraintSafe(solver, vars.width, kiwi.Operator.Eq, currentFrame.width, kiwi.Strength.medium)
        addConstraintSafe(solver, vars.height, kiwi.Operator.Eq, currentFrame.height, kiwi.Strength.medium)
      }
    }

    // Add user-defined constraints
    const failedConstraints: ParsedConstraint[] = []
    for (const constraint of constraints) {
      const success = addParsedConstraint(solver, slotVars, constraint)
      if (!success) {
        failedConstraints.push(constraint)
      }
    }

    // Solve the constraint system
    solver.updateVariables()

    // Extract results
    const outputFrames: FrameMap = {}
    for (const slotName of slotNames) {
      const vars = slotVars[slotName]
      outputFrames[slotName] = {
        x: Math.round(vars.left.value() * 100) / 100, // Round to 2 decimals
        y: Math.round(vars.top.value() * 100) / 100,
        width: Math.round(vars.width.value() * 100) / 100,
        height: Math.round(vars.height.value() * 100) / 100
      }

      // Preserve rotation if it existed
      const inputFrame = inputFrames[slotName]
      if (inputFrame?.rotation !== undefined) {
        outputFrames[slotName].rotation = inputFrame.rotation
      }
    }

    // Return result with warnings if some constraints failed
    if (failedConstraints.length > 0) {
      return {
        frames: outputFrames,
        error: {
          message: `${failedConstraints.length} constraint(s) could not be applied`,
          failedConstraints
        }
      }
    }

    return { frames: outputFrames }
  } catch (error) {
    // On any error, return original frames unchanged
    return {
      frames: inputFrames,
      error: {
        message: error instanceof Error ? error.message : 'Unknown solver error',
        details: error
      }
    }
  }
}

/**
 * Create variables for a slot's geometric properties
 */
function createSlotVariables(slotName: string): SlotVariables {
  return {
    left: new kiwi.Variable(`${slotName}.left`),
    right: new kiwi.Variable(`${slotName}.right`),
    top: new kiwi.Variable(`${slotName}.top`),
    bottom: new kiwi.Variable(`${slotName}.bottom`),
    width: new kiwi.Variable(`${slotName}.width`),
    height: new kiwi.Variable(`${slotName}.height`),
    centerX: new kiwi.Variable(`${slotName}.centerX`),
    centerY: new kiwi.Variable(`${slotName}.centerY`)
  }
}

/**
 * Safely add constraint to solver
 * Returns false if constraint could not be added
 */
function addConstraintSafe(
  solver: kiwi.Solver,
  left: kiwi.Variable,
  operator: kiwi.Operator,
  right: kiwi.Expression | kiwi.Variable | number,
  strength: number
): boolean {
  try {
    const constraint = new kiwi.Constraint(left, operator, right, strength)
    solver.addConstraint(constraint)
    return true
  } catch {
    return false
  }
}

/**
 * Add a parsed constraint to the solver
 * Handles expression building with proper tuple ordering
 */
function addParsedConstraint(
  solver: kiwi.Solver,
  slotVars: Record<string, SlotVariables>,
  constraint: ParsedConstraint
): boolean {
  const leftVars = slotVars[constraint.left.slot]
  const rightVars = slotVars[constraint.right.slot]

  if (!leftVars || !rightVars) {
    console.warn(`Cannot add constraint: unknown slot ${constraint.left.slot} or ${constraint.right.slot}`)
    return false
  }

  const leftVar = leftVars[constraint.left.property]
  const rightVar = rightVars[constraint.right.property]

  if (!leftVar || !rightVar) {
    console.warn(`Cannot add constraint: invalid property ${constraint.left.property} or ${constraint.right.property}`)
    return false
  }

  // Build right-hand expression with proper tuple ordering
  // CRITICAL: Tuple format is [coefficient, variable] NOT [variable, coefficient]
  let rightExpr: kiwi.Expression

  const multiplier = constraint.right.multiplier ?? 1
  const offset = constraint.right.offset ?? 0

  if (multiplier !== 1 && offset !== 0) {
    // Both multiplier and offset: multiplier * var + offset
    rightExpr = new kiwi.Expression([multiplier, rightVar], offset)
  } else if (multiplier !== 1) {
    // Only multiplier: multiplier * var
    rightExpr = new kiwi.Expression([multiplier, rightVar])
  } else if (offset !== 0) {
    // Only offset: var + offset
    rightExpr = new kiwi.Expression(rightVar, offset)
  } else {
    // Neither: just var
    rightExpr = new kiwi.Expression(rightVar)
  }

  // Map operator
  const operator =
    constraint.operator === '=' ? kiwi.Operator.Eq :
    constraint.operator === '>=' ? kiwi.Operator.Ge :
    constraint.operator === '<=' ? kiwi.Operator.Le :
    constraint.operator === '>' ? kiwi.Operator.Ge :
    kiwi.Operator.Le

  // Use strong strength for equalities, medium for inequalities
  const strength = constraint.type === 'equality' ? kiwi.Strength.strong : kiwi.Strength.medium

  return addConstraintSafe(solver, leftVar, operator, rightExpr, strength)
}
