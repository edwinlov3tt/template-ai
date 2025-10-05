/**
 * Keyboard shortcut utilities for cross-platform support
 * Detects platform and returns appropriate shortcut strings
 */

export function isMacPlatform(): boolean {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0
}

export function getModifierKey(): string {
  return isMacPlatform() ? 'metaKey' : 'ctrlKey'
}

export function getModifierSymbol(): string {
  return isMacPlatform() ? '⌘' : 'Ctrl'
}

export function getDuplicateShortcut(): string {
  return `${getModifierSymbol()} + D`
}

export function getLockShortcut(): string {
  return `${getModifierSymbol()} + L`
}

export function getDeleteShortcut(): string {
  return isMacPlatform() ? '⌫' : 'Delete'
}

export function getUndoShortcut(): string {
  return `${getModifierSymbol()} + Z`
}

export function getRedoShortcut(): string {
  return `${getModifierSymbol()} + Shift + Z`
}

export function getSaveShortcut(): string {
  return `${getModifierSymbol()} + S`
}
