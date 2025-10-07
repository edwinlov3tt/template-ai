/**
 * CommandMerger.test.ts
 *
 * Tests for command merging during drag operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CommandMerger } from '../CommandMerger'
import type { TransformCommand, BatchTransformCommand } from '../TransformCommand'

describe('CommandMerger', () => {
  let merger: CommandMerger

  beforeEach(() => {
    merger = new CommandMerger()
    vi.useFakeTimers()
  })

  describe('start()', () => {
    it('should store the initial command', () => {
      const command: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 10, y: 0, width: 100, height: 50 },
        timestamp: 1000
      }

      merger.start(command)

      expect(merger.hasPending()).toBe(true)
      expect(merger.getPending()).toEqual(command)
    })

    it('should replace previous pending command', () => {
      const command1: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 10, y: 0, width: 100, height: 50 },
        timestamp: 1000
      }

      const command2: TransformCommand = {
        type: 'transform',
        slotName: 'subhead',
        before: { x: 0, y: 100, width: 100, height: 30 },
        after: { x: 20, y: 100, width: 100, height: 30 },
        timestamp: 2000
      }

      merger.start(command1)
      merger.start(command2)

      expect(merger.getPending()).toEqual(command2)
    })
  })

  describe('update()', () => {
    it('should merge commands for the same slot', () => {
      const initial: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 10, y: 0, width: 100, height: 50 },
        timestamp: 1000
      }

      const update: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 10, y: 0, width: 100, height: 50 },
        after: { x: 20, y: 0, width: 100, height: 50 },
        timestamp: 1500
      }

      merger.start(initial)
      merger.update(update)

      const result = merger.getPending()

      expect(result).toEqual({
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 }, // Original before
        after: { x: 20, y: 0, width: 100, height: 50 }, // Latest after
        timestamp: 1500
      })
    })

    it('should merge multiple updates', () => {
      const initial: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 1, y: 0, width: 100, height: 50 },
        timestamp: 1000
      }

      merger.start(initial)

      // Simulate 10 drag updates
      for (let i = 2; i <= 10; i++) {
        merger.update({
          type: 'transform',
          slotName: 'headline',
          before: { x: i - 1, y: 0, width: 100, height: 50 },
          after: { x: i, y: 0, width: 100, height: 50 },
          timestamp: 1000 + i * 100
        })
      }

      const result = merger.getPending() as TransformCommand

      expect(result.before.x).toBe(0) // Original position
      expect(result.after.x).toBe(10) // Final position
      expect(result.timestamp).toBe(2000) // Latest timestamp
    })

    it('should handle batch transform commands', () => {
      const initial: BatchTransformCommand = {
        type: 'batch-transform',
        commands: [
          {
            type: 'transform',
            slotName: 'headline',
            before: { x: 0, y: 0, width: 100, height: 50 },
            after: { x: 10, y: 0, width: 100, height: 50 },
            timestamp: 1000
          },
          {
            type: 'transform',
            slotName: 'subhead',
            before: { x: 0, y: 100, width: 100, height: 30 },
            after: { x: 10, y: 100, width: 100, height: 30 },
            timestamp: 1000
          }
        ],
        timestamp: 1000
      }

      const update: BatchTransformCommand = {
        type: 'batch-transform',
        commands: [
          {
            type: 'transform',
            slotName: 'headline',
            before: { x: 10, y: 0, width: 100, height: 50 },
            after: { x: 20, y: 0, width: 100, height: 50 },
            timestamp: 1500
          },
          {
            type: 'transform',
            slotName: 'subhead',
            before: { x: 10, y: 100, width: 100, height: 30 },
            after: { x: 20, y: 100, width: 100, height: 30 },
            timestamp: 1500
          }
        ],
        timestamp: 1500
      }

      merger.start(initial)
      merger.update(update)

      const result = merger.getPending() as BatchTransformCommand

      expect(result.commands[0].before.x).toBe(0) // Original headline x
      expect(result.commands[0].after.x).toBe(20) // Final headline x
      expect(result.commands[1].before.x).toBe(0) // Original subhead x
      expect(result.commands[1].after.x).toBe(20) // Final subhead x
    })

    it('should warn when merging commands for different slots', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation()

      const initial: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 10, y: 0, width: 100, height: 50 },
        timestamp: 1000
      }

      const update: TransformCommand = {
        type: 'transform',
        slotName: 'subhead',
        before: { x: 0, y: 100, width: 100, height: 30 },
        after: { x: 20, y: 100, width: 100, height: 30 },
        timestamp: 1500
      }

      merger.start(initial)
      merger.update(update)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot merge commands for different slots')
      )

      consoleSpy.mockRestore()
    })

    it('should start a new command if no pending command exists', () => {
      const command: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 10, y: 0, width: 100, height: 50 },
        timestamp: 1000
      }

      merger.update(command)

      expect(merger.hasPending()).toBe(true)
      expect(merger.getPending()).toEqual(command)
    })
  })

  describe('commit()', () => {
    it('should return the merged command and clear state', () => {
      const command: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 10, y: 0, width: 100, height: 50 },
        timestamp: 1000
      }

      merger.start(command)
      const result = merger.commit()

      expect(result).toEqual(command)
      expect(merger.hasPending()).toBe(false)
      expect(merger.getPending()).toBeNull()
    })

    it('should return null if no pending command', () => {
      const result = merger.commit()

      expect(result).toBeNull()
    })
  })

  describe('cancel()', () => {
    it('should clear pending command without returning it', () => {
      const command: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 10, y: 0, width: 100, height: 50 },
        timestamp: 1000
      }

      merger.start(command)
      merger.cancel()

      expect(merger.hasPending()).toBe(false)
      expect(merger.getPending()).toBeNull()
    })
  })

  describe('auto-commit timer', () => {
    it('should reset timer on update', () => {
      const command: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 10, y: 0, width: 100, height: 50 },
        timestamp: 1000
      }

      merger.start(command)

      // Fast-forward 400ms
      vi.advanceTimersByTime(400)
      expect(merger.hasPending()).toBe(true)

      // Update resets timer
      merger.update({
        ...command,
        after: { x: 20, y: 0, width: 100, height: 50 },
        timestamp: 1400
      })

      // Fast-forward another 400ms (total 800ms from start, but only 400ms from update)
      vi.advanceTimersByTime(400)
      expect(merger.hasPending()).toBe(true)

      // Fast-forward final 100ms to trigger auto-commit (500ms from last update)
      vi.advanceTimersByTime(100)
      expect(merger.hasPending()).toBe(false)
    })

    it('should clear timer on commit', () => {
      const command: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 10, y: 0, width: 100, height: 50 },
        timestamp: 1000
      }

      merger.start(command)
      merger.update({
        ...command,
        after: { x: 20, y: 0, width: 100, height: 50 },
        timestamp: 1100
      })

      merger.commit()

      // Fast-forward past auto-commit time
      vi.advanceTimersByTime(600)

      // Should not auto-commit (already committed)
      expect(merger.hasPending()).toBe(false)
    })

    it('should clear timer on cancel', () => {
      const command: TransformCommand = {
        type: 'transform',
        slotName: 'headline',
        before: { x: 0, y: 0, width: 100, height: 50 },
        after: { x: 10, y: 0, width: 100, height: 50 },
        timestamp: 1000
      }

      merger.start(command)
      merger.update({
        ...command,
        after: { x: 20, y: 0, width: 100, height: 50 },
        timestamp: 1100
      })

      merger.cancel()

      // Fast-forward past auto-commit time
      vi.advanceTimersByTime(600)

      // Should not auto-commit (cancelled)
      expect(merger.hasPending()).toBe(false)
    })
  })
})
