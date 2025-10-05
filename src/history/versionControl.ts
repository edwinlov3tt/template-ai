/**
 * Template versioning and history system
 * Tracks changes and allows undo/redo functionality
 */

import type { Template } from '../schema/types'

export interface TemplateVersion {
  id: string
  version: number
  timestamp: number
  template: Template
  description?: string
}

export interface HistoryState {
  versions: TemplateVersion[]
  currentIndex: number
}

const MAX_HISTORY_SIZE = 50 // Keep last 50 versions

/**
 * Create a new version from template
 */
export function createVersion(
  template: Template,
  description?: string
): TemplateVersion {
  return {
    id: crypto.randomUUID(),
    version: template.version,
    timestamp: Date.now(),
    template: JSON.parse(JSON.stringify(template)), // Deep clone
    description
  }
}

/**
 * Initialize history state
 */
export function initializeHistory(template: Template): HistoryState {
  return {
    versions: [createVersion(template, 'Initial version')],
    currentIndex: 0
  }
}

/**
 * Add a new version to history
 */
export function addVersion(
  history: HistoryState,
  template: Template,
  description?: string
): HistoryState {
  // Increment template version
  const newTemplate = {
    ...template,
    version: template.version + 1
  }

  const newVersion = createVersion(newTemplate, description)

  // Remove any versions after current index (when undoing then making changes)
  const versions = history.versions.slice(0, history.currentIndex + 1)

  // Add new version
  versions.push(newVersion)

  // Trim history if too large
  const trimmedVersions = versions.slice(-MAX_HISTORY_SIZE)

  return {
    versions: trimmedVersions,
    currentIndex: trimmedVersions.length - 1
  }
}

/**
 * Undo to previous version
 */
export function undo(history: HistoryState): {
  history: HistoryState
  template: Template | null
} {
  if (history.currentIndex <= 0) {
    return { history, template: null } // Can't undo further
  }

  const newIndex = history.currentIndex - 1
  return {
    history: { ...history, currentIndex: newIndex },
    template: history.versions[newIndex].template
  }
}

/**
 * Redo to next version
 */
export function redo(history: HistoryState): {
  history: HistoryState
  template: Template | null
} {
  if (history.currentIndex >= history.versions.length - 1) {
    return { history, template: null } // Can't redo further
  }

  const newIndex = history.currentIndex + 1
  return {
    history: { ...history, currentIndex: newIndex },
    template: history.versions[newIndex].template
  }
}

/**
 * Get current template from history
 */
export function getCurrentTemplate(history: HistoryState): Template {
  return history.versions[history.currentIndex].template
}

/**
 * Check if can undo
 */
export function canUndo(history: HistoryState): boolean {
  return history.currentIndex > 0
}

/**
 * Check if can redo
 */
export function canRedo(history: HistoryState): boolean {
  return history.currentIndex < history.versions.length - 1
}

/**
 * Get version history for display
 */
export function getVersionHistory(history: HistoryState): Array<{
  id: string
  version: number
  timestamp: number
  description: string
  isCurrent: boolean
}> {
  return history.versions.map((v, index) => ({
    id: v.id,
    version: v.version,
    timestamp: v.timestamp,
    description: v.description || `Version ${v.version}`,
    isCurrent: index === history.currentIndex
  }))
}

/**
 * Restore specific version
 */
export function restoreVersion(
  history: HistoryState,
  versionId: string
): {
  history: HistoryState
  template: Template | null
} {
  const index = history.versions.findIndex(v => v.id === versionId)
  if (index === -1) {
    return { history, template: null }
  }

  return {
    history: { ...history, currentIndex: index },
    template: history.versions[index].template
  }
}

/**
 * Export history to JSON (for saving)
 */
export function exportHistory(history: HistoryState): string {
  return JSON.stringify(history, null, 2)
}

/**
 * Import history from JSON
 */
export function importHistory(json: string): HistoryState | null {
  try {
    const parsed = JSON.parse(json)
    if (parsed.versions && Array.isArray(parsed.versions) && typeof parsed.currentIndex === 'number') {
      return parsed as HistoryState
    }
    return null
  } catch {
    return null
  }
}
