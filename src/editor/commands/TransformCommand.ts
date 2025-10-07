/**
 * TransformCommand.ts
 *
 * Command pattern for transform operations to support undo/redo.
 */

import type { Frame } from '../transforms/bbox'

export interface TransformCommand {
  type: 'transform'
  slotName: string
  before: Frame
  after: Frame
  timestamp?: number
}

export interface BatchTransformCommand {
  type: 'batch-transform'
  commands: TransformCommand[]
  timestamp?: number
}

/**
 * Create a transform command for a single slot.
 */
export function createTransformCommand(
  slotName: string,
  before: Frame,
  after: Frame
): TransformCommand {
  return {
    type: 'transform',
    slotName,
    before: { ...before },
    after: { ...after },
    timestamp: Date.now()
  }
}

/**
 * Create a batch transform command for multiple slots.
 */
export function createBatchTransformCommand(
  transforms: Array<{ slotName: string; before: Frame; after: Frame }>
): BatchTransformCommand {
  return {
    type: 'batch-transform',
    commands: transforms.map(t => createTransformCommand(t.slotName, t.before, t.after)),
    timestamp: Date.now()
  }
}

/**
 * Execute a transform command (apply the after state).
 */
export function executeTransformCommand(
  command: TransformCommand,
  applyFn: (slotName: string, frame: Frame) => void
): void {
  applyFn(command.slotName, command.after)
}

/**
 * Undo a transform command (revert to before state).
 */
export function undoTransformCommand(
  command: TransformCommand,
  applyFn: (slotName: string, frame: Frame) => void
): void {
  applyFn(command.slotName, command.before)
}

/**
 * Execute a batch transform command.
 */
export function executeBatchTransformCommand(
  command: BatchTransformCommand,
  applyFn: (slotName: string, frame: Frame) => void
): void {
  command.commands.forEach(cmd => executeTransformCommand(cmd, applyFn))
}

/**
 * Undo a batch transform command.
 */
export function undoBatchTransformCommand(
  command: BatchTransformCommand,
  applyFn: (slotName: string, frame: Frame) => void
): void {
  // Undo in reverse order
  command.commands.slice().reverse().forEach(cmd => undoTransformCommand(cmd, applyFn))
}

/**
 * Check if two frames are equal (within tolerance for floating point).
 */
export function framesEqual(a: Frame, b: Frame, tolerance: number = 0.001): boolean {
  return (
    Math.abs(a.x - b.x) < tolerance &&
    Math.abs(a.y - b.y) < tolerance &&
    Math.abs(a.width - b.width) < tolerance &&
    Math.abs(a.height - b.height) < tolerance &&
    Math.abs((a.rotation || 0) - (b.rotation || 0)) < tolerance
  )
}

/**
 * Merge consecutive transform commands for the same slot.
 * Useful for optimizing undo/redo stack.
 */
export function mergeTransformCommands(
  commands: TransformCommand[]
): TransformCommand[] {
  if (commands.length === 0) {
    return []
  }

  const merged: TransformCommand[] = []
  let current = commands[0]

  for (let i = 1; i < commands.length; i++) {
    const next = commands[i]

    if (current.slotName === next.slotName) {
      // Merge: keep 'before' from current, 'after' from next
      current = {
        ...current,
        after: next.after,
        timestamp: next.timestamp
      }
    } else {
      // Different slot, push current and start new
      merged.push(current)
      current = next
    }
  }

  // Push final command
  merged.push(current)

  return merged
}
