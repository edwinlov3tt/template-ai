import React from 'react'
import { ColorPicker } from '../ColorPicker'
import { Slider } from 'antd'

/**
 * Reusable property control components for PropertiesToolbar
 * These are designed to be universal across different slot types
 */

interface ColorControlProps {
  label: string
  value: string | undefined
  onChange?: (value: string) => void
}

export function ColorControl({ label, value, onChange }: ColorControlProps) {
  if (!onChange) return null

  return (
    <div style={{ padding: '12px', minWidth: '200px' }}>
      <ColorPicker
        label={label}
        color={value || '#000000'}
        onChange={onChange}
      />
    </div>
  )
}

interface SliderControlProps {
  label: string
  value: number | undefined
  min?: number
  max?: number
  step?: number
  suffix?: string
  onChange?: (value: number) => void
}

export function SliderControl({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  suffix = '%',
  onChange
}: SliderControlProps) {
  if (!onChange) return null

  const displayValue = value ?? (min === 0 ? 0 : min)

  return (
    <div style={{ padding: '12px', minWidth: '220px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '8px'
      }}>
        {label}
      </label>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Slider
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={onChange}
          style={{ flex: 1 }}
        />
        <span style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#374151',
          minWidth: '50px',
          textAlign: 'right'
        }}>
          {displayValue}{suffix}
        </span>
      </div>
    </div>
  )
}

interface NumberControlProps {
  label: string
  value: number | undefined
  min?: number
  max?: number
  step?: number
  suffix?: string
  onChange?: (value: number) => void
}

export function NumberControl({
  label,
  value,
  min = 0,
  max = 1000,
  step = 1,
  suffix = 'px',
  onChange
}: NumberControlProps) {
  if (!onChange) return null

  const displayValue = value ?? min

  return (
    <div style={{ padding: '12px', minWidth: '180px' }}>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '6px'
      }}>
        {label}
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={displayValue}
          onChange={(e) => onChange(parseFloat(e.target.value) || min)}
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif'
          }}
        />
        <span style={{
          fontSize: '12px',
          color: '#6b7280',
          minWidth: '24px'
        }}>
          {suffix}
        </span>
      </div>
    </div>
  )
}
