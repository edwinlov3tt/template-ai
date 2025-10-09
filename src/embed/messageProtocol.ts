/**
 * PostMessage Protocol for iFrame Embedding
 *
 * This module defines the message types and handlers for communication
 * between the parent application and the embedded editor.
 */

import type { Template } from '../schema/types'

/**
 * Message types sent between parent and iframe
 */
export type MessageType =
  | 'editor:ready'       // Sent by iframe when loaded and ready
  | 'editor:open'        // Sent by parent to load template/config
  | 'editor:change'      // Sent by iframe when content changes (throttled)
  | 'editor:complete'    // Sent by iframe when user confirms (returns result)
  | 'editor:cancel'      // Sent by iframe when user cancels
  | 'editor:error'       // Sent by iframe on error
  | 'editor:close'       // Sent by parent to request close

/**
 * Editor modes
 */
export type EditorMode = 'crop' | 'full'

/**
 * Export format options
 */
export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'json'

/**
 * Base message structure
 */
export interface BaseMessage {
  type: MessageType
  timestamp?: number
}

/**
 * Message sent by iframe when ready
 */
export interface ReadyMessage extends BaseMessage {
  type: 'editor:ready'
  payload: {
    version: string
    capabilities: string[]
  }
}

/**
 * Message sent by parent to open/load template
 */
export interface OpenMessage extends BaseMessage {
  type: 'editor:open'
  payload: {
    mode: EditorMode
    templateId?: string
    template?: Template
    ratio?: string
    focusSlot?: string
    cropRect?: {
      x: number
      y: number
      width: number
      height: number
    }
  }
}

/**
 * Message sent by iframe when content changes
 */
export interface ChangeMessage extends BaseMessage {
  type: 'editor:change'
  payload: {
    hasChanges: boolean
    modifiedSlots?: string[]
  }
}

/**
 * Message sent by iframe when complete
 */
export interface CompleteMessage extends BaseMessage {
  type: 'editor:complete'
  payload: {
    template: Template
    exports: {
      png?: string      // Base64 data URL
      svg?: string      // SVG string
      jpeg?: string     // Base64 data URL
      thumbnail?: string // Small preview
    }
    metadata: {
      dimensions: { w: number; h: number }
      modified: string
      cropRect?: {
        x: number
        y: number
        width: number
        height: number
      }
    }
  }
}

/**
 * Message sent by iframe on cancel
 */
export interface CancelMessage extends BaseMessage {
  type: 'editor:cancel'
  payload?: {
    reason?: string
  }
}

/**
 * Message sent by iframe on error
 */
export interface ErrorMessage extends BaseMessage {
  type: 'editor:error'
  payload: {
    error: string
    details?: any
  }
}

/**
 * Message sent by parent to request close
 */
export interface CloseMessage extends BaseMessage {
  type: 'editor:close'
}

/**
 * Union of all message types
 */
export type EditorMessage =
  | ReadyMessage
  | OpenMessage
  | ChangeMessage
  | CompleteMessage
  | CancelMessage
  | ErrorMessage
  | CloseMessage

/**
 * Validate message origin against allowlist
 */
export function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = (import.meta.env.VITE_ALLOWED_EMBED_ORIGINS || '*').split(',')

  // Allow all origins if '*' is specified (development only)
  if (allowedOrigins.includes('*')) {
    console.warn('[Embed] Allowing all origins (development mode)')
    return true
  }

  return allowedOrigins.some(allowed => {
    // Exact match
    if (allowed === origin) return true

    // Wildcard subdomain match (e.g., '*.example.com')
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2)
      return origin.endsWith(domain)
    }

    return false
  })
}

/**
 * Send message to parent window
 */
export function sendToParent(message: EditorMessage, targetOrigin: string = '*'): void {
  if (window === window.parent) {
    console.warn('[Embed] Not in iframe, cannot send message')
    return
  }

  const fullMessage = {
    ...message,
    timestamp: Date.now()
  }

  console.log('[Embed] Sending to parent:', fullMessage.type, fullMessage)
  window.parent.postMessage(fullMessage, targetOrigin)
}

/**
 * Get parent origin from referrer or default
 */
export function getParentOrigin(): string {
  if (window === window.parent) {
    return '*'
  }

  try {
    // Try to get from referrer
    if (document.referrer) {
      const url = new URL(document.referrer)
      return url.origin
    }
  } catch (e) {
    console.warn('[Embed] Could not parse referrer:', e)
  }

  return '*'
}

/**
 * Type guard for message validation
 */
export function isEditorMessage(data: any): data is EditorMessage {
  return (
    data &&
    typeof data === 'object' &&
    'type' in data &&
    typeof data.type === 'string' &&
    data.type.startsWith('editor:')
  )
}
