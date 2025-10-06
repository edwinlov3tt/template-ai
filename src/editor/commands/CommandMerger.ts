/**
 * CommandMerger.ts
 *
 * Merges sequential commands during drag operations to reduce undo/redo stack noise.
 *
 * Usage:
 * - onDragStart: merger.start(initialCommand)
 * - onDrag: merger.update(newCommand)
 * - onDragEnd: merger.commit() → returns merged command
 */

import type { TransformCommand, BatchTransformCommand } from './TransformCommand'

export type Command = TransformCommand | BatchTransformCommand

/**
 * CommandMerger class
 *
 * Manages command merging during continuous operations (like slider drags).
 * Instead of creating 100s of commands, merges them into a single command
 * that captures the initial state and final state.
 */
export class CommandMerger {
  private pendingCommand: Command | null = null
  private mergeTimer: NodeJS.Timeout | null = null
  private readonly MERGE_DELAY_MS = 500 // Auto-commit after 500ms of inactivity

  /**
   * Start a new command sequence (e.g., on slider dragStart or mousedown).
   * Clears any previous pending command.
   */
  start(command: Command): void {
    this.clearTimer()
    this.pendingCommand = command
  }

  /**
   * Update the pending command with new state (e.g., on slider drag or mousemove).
   * Merges the update into the existing command by keeping the initial 'before' state
   * and updating the 'after' state.
   */
  update(command: Command): void {
    if (!this.pendingCommand) {
      // No pending command, treat this as a start
      this.start(command)
      return
    }

    // Merge the command
    if (this.pendingCommand.type === 'transform' && command.type === 'transform') {
      // Single slot transform: keep original 'before', update 'after'
      if (this.pendingCommand.slotName === command.slotName) {
        this.pendingCommand = {
          ...this.pendingCommand,
          after: command.after,
          timestamp: command.timestamp
        }
      } else {
        // Different slot, can't merge - this shouldn't happen during a drag
        console.warn('[CommandMerger] Cannot merge commands for different slots')
        this.pendingCommand = command
      }
    } else if (this.pendingCommand.type === 'batch-transform' && command.type === 'batch-transform') {
      // Batch transform: merge each sub-command
      const mergedCommands = this.pendingCommand.commands.map((pendingCmd) => {
        const matchingUpdate = command.commands.find(c => c.slotName === pendingCmd.slotName)
        if (matchingUpdate) {
          return {
            ...pendingCmd,
            after: matchingUpdate.after,
            timestamp: matchingUpdate.timestamp
          }
        }
        return pendingCmd
      })

      this.pendingCommand = {
        ...this.pendingCommand,
        commands: mergedCommands,
        timestamp: command.timestamp
      }
    } else {
      // Mixed types, replace
      console.warn('[CommandMerger] Replacing command due to type mismatch')
      this.pendingCommand = command
    }

    // Reset auto-commit timer
    this.resetTimer()
  }

  /**
   * Commit the pending command (e.g., on slider dragEnd or mouseup).
   * Returns the merged command and clears internal state.
   */
  commit(): Command | null {
    this.clearTimer()
    const command = this.pendingCommand
    this.pendingCommand = null
    return command
  }

  /**
   * Cancel the pending command without committing.
   * Useful for Escape key or error scenarios.
   */
  cancel(): void {
    this.clearTimer()
    this.pendingCommand = null
  }

  /**
   * Get the current pending command without committing.
   * Useful for previewing the state.
   */
  getPending(): Command | null {
    return this.pendingCommand
  }

  /**
   * Check if there's a pending command.
   */
  hasPending(): boolean {
    return this.pendingCommand !== null
  }

  /**
   * Auto-commit timer: commits the command after a period of inactivity.
   * This ensures commands are committed even if dragEnd is missed.
   */
  private resetTimer(): void {
    this.clearTimer()
    this.mergeTimer = setTimeout(() => {
      if (this.pendingCommand) {
        // Auto-commit (but external code needs to handle this)
        console.warn('[CommandMerger] Auto-committing due to inactivity')
        this.commit()
      }
    }, this.MERGE_DELAY_MS)
  }

  private clearTimer(): void {
    if (this.mergeTimer) {
      clearTimeout(this.mergeTimer)
      this.mergeTimer = null
    }
  }
}

/**
 * Global singleton instance for convenience.
 * Components can use this shared instance or create their own.
 */
export const commandMerger = new CommandMerger()
