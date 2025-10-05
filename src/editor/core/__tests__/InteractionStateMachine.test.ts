import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  InteractionStateMachine,
  type InteractionStateMachineConfig,
  type InteractionState,
  type Point
} from '../InteractionStateMachine'

/**
 * Create a mock PointerEvent for testing
 */
function createPointerEvent(
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  options: {
    clientX?: number
    clientY?: number
    pointerId?: number
    button?: number
    shiftKey?: boolean
    currentTarget?: Element
  } = {}
): PointerEvent {
  const {
    clientX = 0,
    clientY = 0,
    pointerId = 1,
    button = 0,
    shiftKey = false,
    currentTarget = null
  } = options

  const event = new PointerEvent(type, {
    clientX,
    clientY,
    pointerId,
    button,
    shiftKey,
    bubbles: true,
    cancelable: true
  })

  // Mock DOM methods
  Object.defineProperty(event, 'currentTarget', {
    value: currentTarget || createMockElement(),
    writable: false
  })

  const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')
  const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

  return event
}

/**
 * Create a mock DOM element with pointer capture support
 */
function createMockElement(): Element {
  const capturedPointers = new Set<number>()

  return {
    setPointerCapture: vi.fn((pointerId: number) => {
      capturedPointers.add(pointerId)
    }),
    releasePointerCapture: vi.fn((pointerId: number) => {
      capturedPointers.delete(pointerId)
    }),
    hasPointerCapture: vi.fn((pointerId: number) => capturedPointers.has(pointerId))
  } as unknown as Element
}

describe('InteractionStateMachine', () => {
  let sm: InteractionStateMachine
  let config: InteractionStateMachineConfig
  let callbacks: {
    onStateChange: ReturnType<typeof vi.fn>
    onSelectionRequest: ReturnType<typeof vi.fn>
    onClearSelection: ReturnType<typeof vi.fn>
    onDragStart: ReturnType<typeof vi.fn>
    onDragMove: ReturnType<typeof vi.fn>
    onDragEnd: ReturnType<typeof vi.fn>
    onResizeStart: ReturnType<typeof vi.fn>
    onResizeMove: ReturnType<typeof vi.fn>
    onResizeEnd: ReturnType<typeof vi.fn>
    onRotateStart: ReturnType<typeof vi.fn>
    onRotateMove: ReturnType<typeof vi.fn>
    onRotateEnd: ReturnType<typeof vi.fn>
    screenToLocal: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    // Reset callbacks
    callbacks = {
      onStateChange: vi.fn(),
      onSelectionRequest: vi.fn(),
      onClearSelection: vi.fn(),
      onDragStart: vi.fn(),
      onDragMove: vi.fn(),
      onDragEnd: vi.fn(),
      onResizeStart: vi.fn(),
      onResizeMove: vi.fn(),
      onResizeEnd: vi.fn(),
      onRotateStart: vi.fn(),
      onRotateMove: vi.fn(),
      onRotateEnd: vi.fn(),
      screenToLocal: vi.fn((x: number, y: number): Point => ({ x, y }))
    }

    config = {
      ...callbacks,
      dragThreshold: 3
    }

    sm = new InteractionStateMachine(config)
  })

  describe('initialization', () => {
    it('should start in idle state', () => {
      expect(sm.getState()).toBe('idle')
    })

    it('should have no context initially', () => {
      expect(sm.getContext()).toBeNull()
    })
  })

  describe('state transitions', () => {
    it('should transition: idle → selecting on slot pointerdown', () => {
      const event = createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
      sm.handlePointerDown(event, 'slot1')

      expect(sm.getState()).toBe('selecting')
      expect(callbacks.onStateChange).toHaveBeenCalledWith('selecting', expect.anything())
    })

    it('should transition: selecting → dragging when threshold exceeded', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', { clientX: 100, clientY: 100, currentTarget: element })
      sm.handlePointerDown(downEvent, 'slot1')

      expect(sm.getState()).toBe('selecting')

      // Move 5 pixels (exceeds 3px threshold)
      const moveEvent = createPointerEvent('pointermove', { clientX: 105, clientY: 100 })
      sm.handlePointerMove(moveEvent)

      expect(sm.getState()).toBe('dragging')
      expect(callbacks.onDragStart).toHaveBeenCalledWith('slot1', { x: 100, y: 100 })
    })

    it('should NOT transition to dragging when below threshold', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', { clientX: 100, clientY: 100, currentTarget: element })
      sm.handlePointerDown(downEvent, 'slot1')

      // Move 2 pixels (below 3px threshold)
      const moveEvent = createPointerEvent('pointermove', { clientX: 102, clientY: 100 })
      sm.handlePointerMove(moveEvent)

      expect(sm.getState()).toBe('selecting')
      expect(callbacks.onDragStart).not.toHaveBeenCalled()
    })

    it('should transition: dragging → idle on pointerup', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', { clientX: 100, clientY: 100, currentTarget: element })
      sm.handlePointerDown(downEvent, 'slot1')

      const moveEvent = createPointerEvent('pointermove', { clientX: 110, clientY: 100 })
      sm.handlePointerMove(moveEvent)

      expect(sm.getState()).toBe('dragging')

      const upEvent = createPointerEvent('pointerup', {})
      sm.handlePointerUp(upEvent)

      expect(sm.getState()).toBe('idle')
      expect(callbacks.onDragEnd).toHaveBeenCalled()
    })

    it('should transition: idle → resizing on resize handle pointerdown', () => {
      const event = createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
      sm.handlePointerDown(event, 'slot1', 'se')

      expect(sm.getState()).toBe('resizing')
      expect(callbacks.onResizeStart).toHaveBeenCalledWith('slot1', 'se', { x: 100, y: 100 })
    })

    it('should transition: idle → rotating on rotate handle pointerdown', () => {
      const event = createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
      sm.handlePointerDown(event, 'slot1', 'rotate')

      expect(sm.getState()).toBe('rotating')
      expect(callbacks.onRotateStart).toHaveBeenCalledWith('slot1', { x: 100, y: 100 })
    })

    it('should reject invalid transitions', () => {
      const element = createMockElement()
      const event = createPointerEvent('pointerdown', { clientX: 100, clientY: 100, currentTarget: element })
      sm.handlePointerDown(event, 'slot1', 'se')

      expect(sm.getState()).toBe('resizing')

      // Try to manually force an invalid transition (resizing → dragging not allowed)
      // The state machine should prevent this through its validation
      const moveEvent = createPointerEvent('pointermove', { clientX: 200, clientY: 200 })
      sm.handlePointerMove(moveEvent)

      // Should still be resizing, not dragging
      expect(sm.getState()).toBe('resizing')
      expect(callbacks.onDragStart).not.toHaveBeenCalled()
    })
  })

  describe('pointer capture', () => {
    it('should call setPointerCapture on pointerdown', () => {
      const element = createMockElement()
      const event = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        pointerId: 5,
        currentTarget: element
      })

      sm.handlePointerDown(event, 'slot1')

      expect(element.setPointerCapture).toHaveBeenCalledWith(5)
    })

    it('should call releasePointerCapture on pointerup', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        pointerId: 5,
        currentTarget: element
      })

      sm.handlePointerDown(downEvent, 'slot1', 'se')

      const upEvent = createPointerEvent('pointerup', { pointerId: 5 })
      sm.handlePointerUp(upEvent)

      expect(element.releasePointerCapture).toHaveBeenCalledWith(5)
    })

    it('should handle releasePointerCapture errors gracefully', () => {
      const element = createMockElement()
      // Make releasePointerCapture throw
      vi.mocked(element.releasePointerCapture).mockImplementation(() => {
        throw new Error('Already released')
      })

      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        pointerId: 5,
        currentTarget: element
      })

      sm.handlePointerDown(downEvent, 'slot1')

      const upEvent = createPointerEvent('pointerup', { pointerId: 5 })

      // Should not throw
      expect(() => sm.handlePointerUp(upEvent)).not.toThrow()
      expect(sm.getState()).toBe('idle')
    })
  })

  describe('multi-touch safety', () => {
    it('should ignore secondary pointers during interaction', () => {
      const element = createMockElement()

      // First pointer down
      const downEvent1 = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent1, 'slot1')

      expect(sm.getState()).toBe('selecting')

      // Second pointer down (should be ignored)
      const downEvent2 = createPointerEvent('pointerdown', {
        clientX: 200,
        clientY: 200,
        pointerId: 2,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent2, 'slot2')

      // Should still be in selecting state with slot1
      expect(sm.getState()).toBe('selecting')
      const context = sm.getContext()
      expect(context?.target).toBe('slot1')
      expect(context?.pointerId).toBe(1)

      // Second pointer should not capture
      expect(element.setPointerCapture).toHaveBeenCalledTimes(1)
      expect(element.setPointerCapture).toHaveBeenCalledWith(1)
    })

    it('should ignore pointermove from non-active pointer', () => {
      const element = createMockElement()

      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent, 'slot1')

      // Move with different pointer (should be ignored)
      const moveEvent = createPointerEvent('pointermove', {
        clientX: 200,
        clientY: 200,
        pointerId: 2
      })
      sm.handlePointerMove(moveEvent)

      // Should still be selecting (not dragging)
      expect(sm.getState()).toBe('selecting')
    })

    it('should ignore pointerup from non-active pointer', () => {
      const element = createMockElement()

      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent, 'slot1', 'se')

      expect(sm.getState()).toBe('resizing')

      // Up with different pointer (should be ignored)
      const upEvent = createPointerEvent('pointerup', { pointerId: 2 })
      sm.handlePointerUp(upEvent)

      // Should still be resizing
      expect(sm.getState()).toBe('resizing')
      expect(callbacks.onResizeEnd).not.toHaveBeenCalled()
    })
  })

  describe('selection handling', () => {
    it('should request selection on regular click', () => {
      const event = createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
      sm.handlePointerDown(event, 'slot1')

      expect(callbacks.onSelectionRequest).toHaveBeenCalledWith(['slot1'], { shift: false })
    })

    it('should handle shift+click for multi-select', () => {
      const event = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        shiftKey: true
      })
      sm.handlePointerDown(event, 'slot1')

      expect(callbacks.onSelectionRequest).toHaveBeenCalledWith(['slot1'], { shift: true })
      expect(sm.getState()).toBe('idle') // Should not enter selecting state
    })

    it('should clear selection on background click', () => {
      const event = createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
      sm.handlePointerDown(event) // No target = background

      expect(callbacks.onClearSelection).toHaveBeenCalled()
      expect(sm.getState()).toBe('idle')
    })
  })

  describe('drag operations', () => {
    it('should emit drag callbacks with correct delta', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent, 'slot1')

      // Exceed threshold
      const moveEvent1 = createPointerEvent('pointermove', { clientX: 105, clientY: 100 })
      sm.handlePointerMove(moveEvent1)

      expect(callbacks.onDragStart).toHaveBeenCalled()
      expect(callbacks.onDragMove).toHaveBeenCalledWith(
        { x: 5, y: 0 },
        { x: 105, y: 100 }
      )

      // Continue dragging
      const moveEvent2 = createPointerEvent('pointermove', { clientX: 110, clientY: 105 })
      sm.handlePointerMove(moveEvent2)

      expect(callbacks.onDragMove).toHaveBeenCalledWith(
        { x: 10, y: 5 },
        { x: 110, y: 105 }
      )
    })

    it('should emit onDragEnd on pointerup', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent, 'slot1')

      const moveEvent = createPointerEvent('pointermove', { clientX: 110, clientY: 100 })
      sm.handlePointerMove(moveEvent)

      const upEvent = createPointerEvent('pointerup', {})
      sm.handlePointerUp(upEvent)

      expect(callbacks.onDragEnd).toHaveBeenCalled()
    })

    it('should emit onDragEnd on pointercancel', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent, 'slot1')

      const moveEvent = createPointerEvent('pointermove', { clientX: 110, clientY: 100 })
      sm.handlePointerMove(moveEvent)

      const cancelEvent = createPointerEvent('pointercancel', {})
      sm.handlePointerCancel(cancelEvent)

      expect(callbacks.onDragEnd).toHaveBeenCalled()
      expect(sm.getState()).toBe('idle')
    })
  })

  describe('resize operations', () => {
    it('should emit resize callbacks with correct delta', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent, 'slot1', 'se')

      expect(callbacks.onResizeStart).toHaveBeenCalledWith('slot1', 'se', { x: 100, y: 100 })

      const moveEvent = createPointerEvent('pointermove', { clientX: 120, clientY: 110 })
      sm.handlePointerMove(moveEvent)

      expect(callbacks.onResizeMove).toHaveBeenCalledWith(
        { x: 20, y: 10 },
        { x: 120, y: 110 },
        'se'
      )
    })

    it('should emit onResizeEnd on pointerup', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent, 'slot1', 'nw')

      const upEvent = createPointerEvent('pointerup', {})
      sm.handlePointerUp(upEvent)

      expect(callbacks.onResizeEnd).toHaveBeenCalled()
    })
  })

  describe('rotate operations', () => {
    it('should emit rotate callbacks', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent, 'slot1', 'rotate')

      expect(callbacks.onRotateStart).toHaveBeenCalledWith('slot1', { x: 100, y: 100 })

      const moveEvent = createPointerEvent('pointermove', { clientX: 110, clientY: 110 })
      sm.handlePointerMove(moveEvent)

      expect(callbacks.onRotateMove).toHaveBeenCalledWith(0, { x: 110, y: 110 })
    })

    it('should emit onRotateEnd on pointerup', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent, 'slot1', 'rotate')

      const upEvent = createPointerEvent('pointerup', {})
      sm.handlePointerUp(upEvent)

      expect(callbacks.onRotateEnd).toHaveBeenCalled()
    })
  })

  describe('event handling', () => {
    it('should call stopPropagation and preventDefault on pointerdown', () => {
      const event = createPointerEvent('pointerdown', { clientX: 100, clientY: 100 })
      const stopSpy = vi.spyOn(event, 'stopPropagation')
      const preventSpy = vi.spyOn(event, 'preventDefault')

      sm.handlePointerDown(event, 'slot1')

      expect(stopSpy).toHaveBeenCalled()
      expect(preventSpy).toHaveBeenCalled()
    })

    it('should ignore non-primary button clicks', () => {
      const event = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        button: 2 // Right click
      })

      sm.handlePointerDown(event, 'slot1')

      expect(sm.getState()).toBe('idle')
      expect(callbacks.onSelectionRequest).not.toHaveBeenCalled()
    })

    it('should use screenToLocal for coordinate transformation', () => {
      callbacks.screenToLocal.mockReturnValue({ x: 50, y: 75 })

      const event = createPointerEvent('pointerdown', { clientX: 100, clientY: 150 })
      sm.handlePointerDown(event, 'slot1')

      expect(callbacks.screenToLocal).toHaveBeenCalledWith(100, 150)

      const context = sm.getContext()
      expect(context?.startPoint).toEqual({ x: 50, y: 75 })
    })
  })

  describe('reset and destroy', () => {
    it('should reset to idle on reset()', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent, 'slot1', 'se')

      expect(sm.getState()).toBe('resizing')

      sm.reset()

      expect(sm.getState()).toBe('idle')
      expect(sm.getContext()).toBeNull()
    })

    it('should cleanup on destroy()', () => {
      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        currentTarget: element
      })
      sm.handlePointerDown(downEvent, 'slot1')

      sm.destroy()

      expect(sm.getState()).toBe('idle')
      expect(sm.getContext()).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle pointermove with no context', () => {
      const moveEvent = createPointerEvent('pointermove', { clientX: 100, clientY: 100 })

      // Should not throw
      expect(() => sm.handlePointerMove(moveEvent)).not.toThrow()
    })

    it('should handle pointerup with no context', () => {
      const upEvent = createPointerEvent('pointerup', {})

      // Should not throw
      expect(() => sm.handlePointerUp(upEvent)).not.toThrow()
    })

    it('should handle pointercancel with no context', () => {
      const cancelEvent = createPointerEvent('pointercancel', {})

      // Should not throw
      expect(() => sm.handlePointerCancel(cancelEvent)).not.toThrow()
    })

    it('should handle custom drag threshold', () => {
      const customSm = new InteractionStateMachine({
        ...callbacks,
        dragThreshold: 10
      })

      const element = createMockElement()
      const downEvent = createPointerEvent('pointerdown', {
        clientX: 100,
        clientY: 100,
        currentTarget: element
      })
      customSm.handlePointerDown(downEvent, 'slot1')

      // Move 5 pixels (below 10px threshold)
      const moveEvent1 = createPointerEvent('pointermove', { clientX: 105, clientY: 100 })
      customSm.handlePointerMove(moveEvent1)

      expect(customSm.getState()).toBe('selecting')

      // Move 12 pixels (exceeds 10px threshold)
      const moveEvent2 = createPointerEvent('pointermove', { clientX: 112, clientY: 100 })
      customSm.handlePointerMove(moveEvent2)

      expect(customSm.getState()).toBe('dragging')
    })
  })
})
