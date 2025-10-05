// src/editor/core/InteractionStateMachine.ts
export type State = 'idle'|'selecting'|'dragging'|'resizing'|'rotating'

export class InteractionStateMachine {
  private state: State = 'idle'
  get current() { return this.state }
  transition(next: State) { this.state = next }
}
