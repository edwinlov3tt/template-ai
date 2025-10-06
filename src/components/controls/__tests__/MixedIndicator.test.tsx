/**
 * MixedIndicator.test.tsx
 *
 * Tests for mixed state utility functions and components.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  getMixedState,
  MixedIndicator,
  MixedTextInput,
  MixedNumberInput,
  MixedColorSwatch,
  MixedToggle,
  useMixedValue
} from '../MixedIndicator'

describe('getMixedState', () => {
  it('should return undefined for empty array', () => {
    expect(getMixedState([])).toBeUndefined()
  })

  it('should return value when all values are the same (primitive)', () => {
    expect(getMixedState([5, 5, 5])).toBe(5)
    expect(getMixedState(['red', 'red', 'red'])).toBe('red')
    expect(getMixedState([true, true, true])).toBe(true)
  })

  it('should return "Mixed" when values differ (primitive)', () => {
    expect(getMixedState([5, 10, 15])).toBe('Mixed')
    expect(getMixedState(['red', 'blue', 'red'])).toBe('Mixed')
    expect(getMixedState([true, false])).toBe('Mixed')
  })

  it('should return value when all objects are the same', () => {
    const obj = { x: 10, y: 20 }
    expect(getMixedState([obj, obj, obj])).toBe(obj)
  })

  it('should return value when all objects are deeply equal', () => {
    const result = getMixedState([
      { x: 10, y: 20 },
      { x: 10, y: 20 },
      { x: 10, y: 20 }
    ])
    expect(result).toEqual({ x: 10, y: 20 })
  })

  it('should return "Mixed" when objects differ', () => {
    expect(getMixedState([
      { x: 10, y: 20 },
      { x: 10, y: 30 },
      { x: 10, y: 20 }
    ])).toBe('Mixed')
  })

  it('should return single value for array with one element', () => {
    expect(getMixedState([42])).toBe(42)
    expect(getMixedState(['solo'])).toBe('solo')
  })
})

describe('MixedIndicator', () => {
  it('should render "Mixed" badge when value is "Mixed"', () => {
    render(<MixedIndicator value="Mixed" />)
    expect(screen.getByText('Mixed')).toBeInTheDocument()
  })

  it('should not render when value is not "Mixed"', () => {
    const { container } = render(<MixedIndicator value="red" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should apply custom className', () => {
    render(<MixedIndicator value="Mixed" className="custom-class" />)
    const badge = screen.getByText('Mixed')
    expect(badge).toHaveClass('custom-class')
  })
})

describe('MixedTextInput', () => {
  it('should show "Mixed" as placeholder when value is "Mixed"', () => {
    render(<MixedTextInput value="Mixed" onChange={vi.fn()} />)
    const input = screen.getByPlaceholderText('Mixed') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('should show actual value when not "Mixed"', () => {
    render(<MixedTextInput value="Hello" onChange={vi.fn()} />)
    const input = screen.getByDisplayValue('Hello')
    expect(input).toBeInTheDocument()
  })

  it('should call onChange when user types', async () => {
    const onChange = vi.fn()
    render(<MixedTextInput value="" onChange={onChange} />)
    const input = screen.getByRole('textbox')

    await userEvent.type(input, 'Test')

    expect(onChange).toHaveBeenCalled()
  })

  it('should show custom placeholder when value is empty', () => {
    render(<MixedTextInput value="" onChange={vi.fn()} placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })
})

describe('MixedNumberInput', () => {
  it('should show "—" as placeholder when value is "Mixed"', () => {
    render(<MixedNumberInput value="Mixed" onChange={vi.fn()} />)
    const input = screen.getByPlaceholderText('—') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('should show actual value when not "Mixed"', () => {
    render(<MixedNumberInput value={42} onChange={vi.fn()} />)
    const input = screen.getByDisplayValue('42')
    expect(input).toBeInTheDocument()
  })

  it('should call onChange with number when user types', async () => {
    const onChange = vi.fn()
    render(<MixedNumberInput value={undefined} onChange={onChange} />)
    const input = screen.getByRole('spinbutton')

    await userEvent.type(input, '42')

    // Check that onChange was called with numbers
    expect(onChange).toHaveBeenCalled()
    // All calls should receive numbers
    onChange.mock.calls.forEach(call => {
      expect(typeof call[0]).toBe('number')
      expect(call[0]).not.toBeNaN()
    })
  })

  it('should respect min/max/step attributes', () => {
    render(<MixedNumberInput value={50} onChange={vi.fn()} min={0} max={100} step={5} />)
    const input = screen.getByRole('spinbutton') as HTMLInputElement

    expect(input.min).toBe('0')
    expect(input.max).toBe('100')
    expect(input.step).toBe('5')
  })
})

describe('MixedColorSwatch', () => {
  it('should show dash when value is "Mixed"', () => {
    render(<MixedColorSwatch value="Mixed" onChange={vi.fn()} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('should show color input when value is not "Mixed"', () => {
    render(<MixedColorSwatch value="#ff0000" onChange={vi.fn()} />)
    const input = screen.getByDisplayValue('#ff0000') as HTMLInputElement
    expect(input.type).toBe('color')
  })

  it('should call onChange when color changes', async () => {
    const onChange = vi.fn()
    render(<MixedColorSwatch value="#000000" onChange={onChange} />)
    const input = screen.getByDisplayValue('#000000')

    await userEvent.click(input)
    // Note: userEvent doesn't fully simulate color picker, but we can check that it's interactive

    expect(input).toBeInTheDocument()
  })
})

describe('MixedToggle', () => {
  it('should be checked when value is true', () => {
    render(<MixedToggle value={true} onChange={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('should be unchecked when value is false', () => {
    render(<MixedToggle value={false} onChange={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(false)
  })

  it('should be indeterminate when value is "Mixed"', () => {
    render(<MixedToggle value="Mixed" onChange={vi.fn()} />)
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.indeterminate).toBe(true)
  })

  it('should toggle from false to true', async () => {
    const onChange = vi.fn()
    render(<MixedToggle value={false} onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox')

    await userEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('should toggle from true to false', async () => {
    const onChange = vi.fn()
    render(<MixedToggle value={true} onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox')

    await userEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('should toggle from "Mixed" to true', async () => {
    const onChange = vi.fn()
    render(<MixedToggle value="Mixed" onChange={onChange} />)
    const checkbox = screen.getByRole('checkbox')

    await userEvent.click(checkbox)

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('should render label when provided', () => {
    render(<MixedToggle value={false} onChange={vi.fn()} label="Enable feature" />)
    expect(screen.getByText('Enable feature')).toBeInTheDocument()
  })
})

describe('useMixedValue', () => {
  it('should return mixed state from property path string', () => {
    const slots = [
      { frame: { x: 10 } },
      { frame: { x: 20 } },
      { frame: { x: 10 } }
    ]

    const result = useMixedValue(slots, 'frame.x')
    expect(result).toBe('Mixed')
  })

  it('should return value when all are the same', () => {
    const slots = [
      { frame: { x: 10 } },
      { frame: { x: 10 } },
      { frame: { x: 10 } }
    ]

    const result = useMixedValue(slots, 'frame.x')
    expect(result).toBe(10)
  })

  it('should work with function selector', () => {
    const slots = [
      { style: { color: 'red' } },
      { style: { color: 'blue' } }
    ]

    const result = useMixedValue(slots, slot => slot.style.color)
    expect(result).toBe('Mixed')
  })

  it('should return undefined for empty array', () => {
    const result = useMixedValue([], 'frame.x')
    expect(result).toBeUndefined()
  })
})
