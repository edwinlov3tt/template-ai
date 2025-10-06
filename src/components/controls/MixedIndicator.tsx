/**
 * MixedIndicator.tsx
 *
 * Utility component and hooks for handling "Mixed" state in multi-select scenarios.
 * When multiple slots are selected with different property values, we show "Mixed" instead of a specific value.
 */

import React from 'react'

/**
 * Get the mixed state for an array of values.
 * Returns the value if all values are the same, otherwise returns 'Mixed'.
 */
export function getMixedState<T>(values: T[]): T | 'Mixed' | undefined {
  if (values.length === 0) return undefined
  const first = values[0]
  if (values.every(v => deepEqual(v, first))) return first
  return 'Mixed'
}

/**
 * Deep equality check for primitive values and objects.
 */
function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false
  }

  const keysA = Object.keys(a as object)
  const keysB = Object.keys(b as object)

  if (keysA.length !== keysB.length) return false

  return keysA.every(key => deepEqual((a as any)[key], (b as any)[key]))
}

/**
 * MixedIndicator component
 *
 * Shows a "Mixed" badge when the value is 'Mixed'.
 */
interface MixedIndicatorProps {
  value: any
  className?: string
}

export const MixedIndicator: React.FC<MixedIndicatorProps> = ({ value, className = '' }) => {
  if (value !== 'Mixed') return null

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600 ${className}`}
      title="Multiple values selected"
    >
      Mixed
    </span>
  )
}

/**
 * MixedTextInput component
 *
 * Text input that shows "Mixed" as placeholder when value is 'Mixed'.
 */
interface MixedTextInputProps {
  value: string | 'Mixed' | undefined
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const MixedTextInput: React.FC<MixedTextInputProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  disabled = false
}) => {
  const displayValue = value === 'Mixed' ? '' : (value || '')
  const displayPlaceholder = value === 'Mixed' ? 'Mixed' : placeholder

  return (
    <input
      type="text"
      value={displayValue}
      onChange={(e) => onChange(e.target.value)}
      placeholder={displayPlaceholder}
      className={`border rounded px-2 py-1 ${value === 'Mixed' ? 'placeholder-gray-500 italic' : ''} ${className}`}
      disabled={disabled}
    />
  )
}

/**
 * MixedNumberInput component
 *
 * Number input that shows "—" (em dash) as placeholder when value is 'Mixed'.
 */
interface MixedNumberInputProps {
  value: number | 'Mixed' | undefined
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const MixedNumberInput: React.FC<MixedNumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder = '',
  className = '',
  disabled = false
}) => {
  const displayValue = value === 'Mixed' ? '' : (value?.toString() || '')
  const displayPlaceholder = value === 'Mixed' ? '—' : placeholder

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = parseFloat(e.target.value)
    if (!isNaN(num)) {
      onChange(num)
    }
  }

  return (
    <input
      type="number"
      value={displayValue}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      placeholder={displayPlaceholder}
      className={`border rounded px-2 py-1 ${value === 'Mixed' ? 'placeholder-gray-500 italic' : ''} ${className}`}
      disabled={disabled}
    />
  )
}

/**
 * MixedColorSwatch component
 *
 * Color swatch that shows "Mixed" badge when value is 'Mixed'.
 */
interface MixedColorSwatchProps {
  value: string | 'Mixed' | undefined
  onChange: (value: string) => void
  className?: string
  disabled?: boolean
}

export const MixedColorSwatch: React.FC<MixedColorSwatchProps> = ({
  value,
  onChange,
  className = '',
  disabled = false
}) => {
  if (value === 'Mixed') {
    return (
      <div
        className={`w-8 h-8 rounded border border-gray-300 flex items-center justify-center ${className}`}
        title="Mixed colors"
      >
        <span className="text-xs text-gray-500">—</span>
      </div>
    )
  }

  return (
    <input
      type="color"
      value={value || '#000000'}
      onChange={(e) => onChange(e.target.value)}
      className={`w-8 h-8 rounded border border-gray-300 cursor-pointer ${className}`}
      disabled={disabled}
    />
  )
}

/**
 * MixedToggle component
 *
 * Toggle/checkbox that shows indeterminate state (dash) when value is 'Mixed'.
 */
interface MixedToggleProps {
  value: boolean | 'Mixed' | undefined
  onChange: (value: boolean) => void
  label?: string
  className?: string
  disabled?: boolean
}

export const MixedToggle: React.FC<MixedToggleProps> = ({
  value,
  onChange,
  label,
  className = '',
  disabled = false
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = value === 'Mixed'
    }
  }, [value])

  const handleChange = () => {
    if (value === 'Mixed' || value === false || value === undefined) {
      onChange(true)
    } else {
      onChange(false)
    }
  }

  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        ref={inputRef}
        type="checkbox"
        checked={value === true}
        onChange={handleChange}
        className="w-4 h-4 cursor-pointer"
        disabled={disabled}
      />
      {label && <span className="text-sm">{label}</span>}
    </label>
  )
}

/**
 * Hook to get mixed state from selected slots
 */
export function useMixedValue<T>(
  selectedSlots: any[],
  propertyPath: string | ((slot: any) => T)
): T | 'Mixed' | undefined {
  const values = selectedSlots.map(slot => {
    if (typeof propertyPath === 'function') {
      return propertyPath(slot)
    }
    // Navigate nested property path (e.g., "frame.x")
    const parts = propertyPath.split('.')
    let value = slot
    for (const part of parts) {
      value = value?.[part]
    }
    return value as T
  })

  return getMixedState(values)
}
