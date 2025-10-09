import type { SlotType } from '../../schema/types'

/**
 * Standard reference system for default slot sizes
 * All sizes are defined as percentages of canvas dimensions
 * This ensures consistent sizing across different canvas sizes
 */

interface SlotSizeConfig {
  widthPercent: number   // Percentage of canvas width (0-100)
  heightPercent: number  // Percentage of canvas height (0-100)
  minWidth?: number      // Minimum width in pixels
  minHeight?: number     // Minimum height in pixels
  maxWidth?: number      // Maximum width in pixels
  maxHeight?: number     // Maximum height in pixels
}

/**
 * Default sizes for each slot type
 * Based on common design patterns and usability
 */
const SLOT_SIZE_DEFAULTS: Record<SlotType, SlotSizeConfig> = {
  text: {
    widthPercent: 70,
    heightPercent: 10,
    minWidth: 200,
    minHeight: 40
  },
  image: {
    widthPercent: 50,
    heightPercent: 50,
    minWidth: 150,
    minHeight: 150
  },
  button: {
    widthPercent: 30,
    heightPercent: 8,
    minWidth: 120,
    minHeight: 40,
    maxHeight: 60
  },
  shape: {
    widthPercent: 40,
    heightPercent: 40,
    minWidth: 100,
    minHeight: 100
  }
}

/**
 * Calculate default frame for a slot based on canvas dimensions
 * Places slot in center of canvas by default
 */
export function getDefaultSlotFrame(
  slotType: SlotType,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number } {
  const config = SLOT_SIZE_DEFAULTS[slotType]

  // Calculate size from percentages
  let width = (canvasWidth * config.widthPercent) / 100
  let height = (canvasHeight * config.heightPercent) / 100

  // Apply min/max constraints
  if (config.minWidth) width = Math.max(width, config.minWidth)
  if (config.minHeight) height = Math.max(height, config.minHeight)
  if (config.maxWidth) width = Math.min(width, config.maxWidth)
  if (config.maxHeight) height = Math.min(height, config.maxHeight)

  // Center the slot on canvas
  const x = (canvasWidth - width) / 2
  const y = (canvasHeight - height) / 2

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height)
  }
}

/**
 * Get default frame for a specific slot name pattern
 * Allows for custom positioning based on slot naming conventions
 */
export function getDefaultSlotFrameByName(
  slotName: string,
  slotType: SlotType,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number } {
  const baseFrame = getDefaultSlotFrame(slotType, canvasWidth, canvasHeight)

  // Special positioning for common slot names
  const lowerName = slotName.toLowerCase()

  // Headlines at top
  if (lowerName.includes('headline') || lowerName.includes('title')) {
    return {
      ...baseFrame,
      y: canvasHeight * 0.15
    }
  }

  // Subheads below headlines
  if (lowerName.includes('subhead') || lowerName.includes('subtitle')) {
    return {
      ...baseFrame,
      y: canvasHeight * 0.35
    }
  }

  // CTAs at bottom
  if (lowerName.includes('cta') || lowerName.includes('button')) {
    return {
      ...baseFrame,
      y: canvasHeight * 0.75
    }
  }

  // Logos in top-left corner
  if (lowerName.includes('logo')) {
    return {
      ...baseFrame,
      x: canvasWidth * 0.05,
      y: canvasHeight * 0.05,
      width: Math.min(baseFrame.width, canvasWidth * 0.2),
      height: Math.min(baseFrame.height, canvasHeight * 0.15)
    }
  }

  // Background fills entire canvas
  if (lowerName.includes('bg') || lowerName.includes('background')) {
    return {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight
    }
  }

  // Subject images centered but larger
  if (lowerName.includes('subject') || lowerName.includes('hero')) {
    return {
      ...baseFrame,
      width: canvasWidth * 0.6,
      height: canvasHeight * 0.6
    }
  }

  return baseFrame
}

/**
 * Calculate offset position for stacked slots
 * Used when adding multiple slots to prevent overlap
 */
export function getStackedSlotOffset(
  baseFrame: { x: number; y: number; width: number; height: number },
  stackIndex: number,
  offsetAmount: number = 20
): { x: number; y: number; width: number; height: number } {
  return {
    ...baseFrame,
    x: baseFrame.x + (stackIndex * offsetAmount),
    y: baseFrame.y + (stackIndex * offsetAmount)
  }
}
