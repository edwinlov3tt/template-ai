/**
 * Calculate UI scale factor that increases as zoom decreases
 * This ensures UI elements remain visible and usable at low zoom levels
 *
 * @param zoomPercent - Current zoom percentage (e.g., 35, 100, 200)
 * @param options - Min and max scale bounds
 * @returns Scale factor to apply to UI element sizes
 *
 * @example
 * // At 100% zoom: returns 1 (normal size)
 * // At 50% zoom: returns 2 (double size)
 * // At 35% zoom: returns 2.5 (clamped to max 2.5)
 */
export function getUiScale(zoomPercent: number, { min = 1, max = 2.5 } = {}): number {
  if (Number.isNaN(zoomPercent) || !Number.isFinite(zoomPercent) || zoomPercent <= 0) return 1

  // Inverse scaling: as zoom decreases, scale increases
  const inverseScale = 100 / zoomPercent

  // Clamp to prevent extremes
  return Math.min(max, Math.max(min, inverseScale))
}
