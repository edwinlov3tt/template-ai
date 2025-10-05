/**
 * InteractionStateMachine - Deterministic pointer event handling
 *
 * States: idle → selecting → dragging | resizing | rotating → idle
 *
 * Features:
 * - Pointer Events API with setPointerCapture for reliable interaction
 * - Multi-touch safe (ignores secondary pointers during active interaction)
 * - No DOM manipulation (all side effects through callbacks)
 * - Drag threshold to distinguish clicks from drags
 * - Cleanup on pointerup/pointercancel
 */

export type InteractionState = 'idle' | 'selecting' | 'dragging' | 'resizing' | 'rotating'
export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export interface Point {
  x: number
  y: number
}

export interface InteractionContext {
  target: string
  handle?: ResizeHandle | 'rotate'
  startPoint: Point
  currentPoint: Point
  pointerId: number
  element: Element
}

export interface InteractionStateMachineConfig {
  // State change callback
  onStateChange?: (state: InteractionState, context?: InteractionContext) => void

  // Selection callbacks
  onSelectionRequest?: (targets: string[], modifiers: { shift: boolean }) => void
  onClearSelection?: () => void

  // Drag callbacks
  onDragStart?: (target: string, point: Point) => void
  onDragMove?: (delta: Point, point: Point) => void
  onDragEnd?: () => void

  // Resize callbacks
  onResizeStart?: (target: string, handle: ResizeHandle, point: Point) => void
  onResizeMove?: (delta: Point, point: Point, handle: ResizeHandle) => void
  onResizeEnd?: () => void

  // Rotate callbacks
  onRotateStart?: (target: string, point: Point) => void
  onRotateMove?: (angle: number, point: Point) => void
  onRotateEnd?: () => void

  // Coordinate transformation (screen → local coordinate system)
  screenToLocal?: (screenX: number, screenY: number) => Point

  // Configuration
  dragThreshold?: number // pixels (default: 3)
}

export class InteractionStateMachine {
  private state: InteractionState = 'idle'
  private context: InteractionContext | null = null
  private config: Required<InteractionStateMachineConfig>
  private activePointerId: number | null = null
  private boundHandlers: {
    move: (e: PointerEvent) => void
    up: (e: PointerEvent) => void
    cancel: (e: PointerEvent) => void
  }

  constructor(config: InteractionStateMachineConfig) {
    // Apply defaults
    this.config = {
      onStateChange: config.onStateChange || (() => {}),
      onSelectionRequest: config.onSelectionRequest || (() => {}),
      onClearSelection: config.onClearSelection || (() => {}),
      onDragStart: config.onDragStart || (() => {}),
      onDragMove: config.onDragMove || (() => {}),
      onDragEnd: config.onDragEnd || (() => {}),
      onResizeStart: config.onResizeStart || (() => {}),
      onResizeMove: config.onResizeMove || (() => {}),
      onResizeEnd: config.onResizeEnd || (() => {}),
      onRotateStart: config.onRotateStart || (() => {}),
      onRotateMove: config.onRotateMove || (() => {}),
      onRotateEnd: config.onRotateEnd || (() => {}),
      screenToLocal: config.screenToLocal || ((x, y) => ({ x, y })),
      dragThreshold: config.dragThreshold ?? 3
    }

    // Bind handlers for window listeners
    this.boundHandlers = {
      move: this.handlePointerMove.bind(this),
      up: this.handlePointerUp.bind(this),
      cancel: this.handlePointerCancel.bind(this)
    }
  }

  /**
   * Get current state
   */
  getState(): InteractionState {
    return this.state
  }

  /**
   * Get current interaction context
   */
  getContext(): InteractionContext | null {
    return this.context
  }

  /**
   * Handle pointerdown event
   * Should be attached to individual slot/handle elements
   */
  handlePointerDown(
    event: PointerEvent,
    target?: string,
    handle?: ResizeHandle | 'rotate'
  ): void {
    // Ignore secondary pointers during active interaction
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
      return
    }

    // Only handle primary button (left click / touch / stylus)
    if (event.button !== 0) {
      return
    }

    event.stopPropagation()
    event.preventDefault()

    // Capture pointer to ensure we receive all events even if pointer leaves element
    const currentElement = event.currentTarget as Element | null
    if (currentElement && 'setPointerCapture' in currentElement) {
      currentElement.setPointerCapture(event.pointerId)
      this.activePointerId = event.pointerId
    }

    const point = this.config.screenToLocal(event.clientX, event.clientY)

    // If no target provided, this is a background click
    if (!target) {
      this.config.onClearSelection()
      this.transitionTo('idle')
      return
    }

    // Create interaction context
    this.context = {
      target,
      handle,
      startPoint: point,
      currentPoint: point,
      pointerId: event.pointerId,
      element: currentElement as Element
    }

    // Handle selection
    if (!handle) {
      // Shift+click for multi-select
      if (event.shiftKey) {
        this.config.onSelectionRequest([target], { shift: true })
        this.transitionTo('idle') // Selection only, no drag candidate
        this.cleanup()
        return
      }

      // Regular click - request selection and enter selecting state
      this.config.onSelectionRequest([target], { shift: false })
      this.transitionTo('selecting')

      // Attach window listeners to detect drag threshold
      this.attachWindowListeners()
    } else if (handle === 'rotate') {
      // Immediate rotate on rotate handle
      this.config.onRotateStart(target, point)
      this.transitionTo('rotating')
      this.attachWindowListeners()
    } else {
      // Immediate resize on resize handle
      this.config.onResizeStart(target, handle, point)
      this.transitionTo('resizing')
      this.attachWindowListeners()
    }
  }

  /**
   * Handle pointermove event
   * Attached to window during interaction
   */
  handlePointerMove(event: PointerEvent): void {
    // Ignore if not the active pointer
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
      return
    }

    if (!this.context) return

    const point = this.config.screenToLocal(event.clientX, event.clientY)
    const delta = {
      x: point.x - this.context.startPoint.x,
      y: point.y - this.context.startPoint.y
    }

    // Update current point
    this.context.currentPoint = point

    // State-specific handling
    switch (this.state) {
      case 'selecting': {
        // Check if we've exceeded drag threshold
        const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y)
        if (distance >= this.config.dragThreshold) {
          // Transition to dragging
          this.config.onDragStart(this.context.target, this.context.startPoint)
          this.transitionTo('dragging')
          // Immediately send first drag move
          this.config.onDragMove(delta, point)
        }
        break
      }

      case 'dragging': {
        this.config.onDragMove(delta, point)
        break
      }

      case 'resizing': {
        if (this.context.handle && this.context.handle !== 'rotate') {
          this.config.onResizeMove(delta, point, this.context.handle)
        }
        break
      }

      case 'rotating': {
        // Calculate rotation angle (implementation-specific, caller handles it)
        this.config.onRotateMove(0, point) // Angle calculation delegated to callback
        break
      }

      case 'idle':
        // No interaction in idle state
        break
    }
  }

  /**
   * Handle pointerup event
   * Attached to window during interaction
   */
  handlePointerUp(event: PointerEvent): void {
    // Ignore if not the active pointer
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
      return
    }

    if (!this.context) return

    // Release is automatic on pointerup, but we cleanup for safety
    try {
      if (this.context.element && 'releasePointerCapture' in this.context.element) {
        this.context.element.releasePointerCapture(event.pointerId)
      }
    } catch (e) {
      // releasePointerCapture may throw if already released
      // This is safe to ignore
    }

    // Fire end callbacks based on state
    switch (this.state) {
      case 'dragging':
        this.config.onDragEnd()
        break
      case 'resizing':
        this.config.onResizeEnd()
        break
      case 'rotating':
        this.config.onRotateEnd()
        break
      case 'selecting':
      case 'idle':
        // No action needed
        break
    }

    // Return to idle
    this.transitionTo('idle')
    this.cleanup()
  }

  /**
   * Handle pointercancel event
   * Attached to window during interaction
   */
  handlePointerCancel(event: PointerEvent): void {
    // Ignore if not the active pointer
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
      return
    }

    if (!this.context) return

    // Pointer capture is released automatically on cancel
    // Fire end callbacks based on state
    switch (this.state) {
      case 'dragging':
        this.config.onDragEnd()
        break
      case 'resizing':
        this.config.onResizeEnd()
        break
      case 'rotating':
        this.config.onRotateEnd()
        break
      case 'selecting':
      case 'idle':
        // No action needed
        break
    }

    // Return to idle
    this.transitionTo('idle')
    this.cleanup()
  }

  /**
   * Reset to idle state
   */
  reset(): void {
    this.cleanup()
    this.transitionTo('idle')
  }

  /**
   * Cleanup and destroy the state machine
   */
  destroy(): void {
    this.cleanup()
    this.state = 'idle'
    this.context = null
  }

  /**
   * Transition to a new state
   */
  private transitionTo(newState: InteractionState): void {
    const oldState = this.state

    // Validate transition
    if (!this.isValidTransition(oldState, newState)) {
      console.warn(
        `[InteractionStateMachine] Invalid transition: ${oldState} → ${newState}`
      )
      return
    }

    this.state = newState
    this.config.onStateChange(newState, this.context || undefined)
  }

  /**
   * Validate state transition
   */
  private isValidTransition(from: InteractionState, to: InteractionState): boolean {
    // Valid transition table
    const validTransitions: Record<InteractionState, InteractionState[]> = {
      idle: ['idle', 'selecting', 'resizing', 'rotating'],
      selecting: ['selecting', 'dragging', 'idle'],
      dragging: ['dragging', 'idle'],
      resizing: ['resizing', 'idle'],
      rotating: ['rotating', 'idle']
    }

    return validTransitions[from]?.includes(to) ?? false
  }

  /**
   * Attach window event listeners
   */
  private attachWindowListeners(): void {
    window.addEventListener('pointermove', this.boundHandlers.move)
    window.addEventListener('pointerup', this.boundHandlers.up)
    window.addEventListener('pointercancel', this.boundHandlers.cancel)
  }

  /**
   * Detach window event listeners
   */
  private detachWindowListeners(): void {
    window.removeEventListener('pointermove', this.boundHandlers.move)
    window.removeEventListener('pointerup', this.boundHandlers.up)
    window.removeEventListener('pointercancel', this.boundHandlers.cancel)
  }

  /**
   * Cleanup interaction state
   */
  private cleanup(): void {
    this.detachWindowListeners()
    this.context = null
    this.activePointerId = null
  }
}
