/**
 * Paint Type System
 *
 * Foundation types for solid colors and gradients in the template system.
 * Based on Figma's Paint API and W3C gradient specifications.
 */

/**
 * Color stop for gradient definitions
 */
export interface GradientStop {
  /** Position along gradient (0.0 to 1.0) */
  offset: number;
  /** Color value (hex, rgb, oklch, etc.) */
  color: string;
}

/**
 * Solid color paint
 */
export interface SolidPaint {
  kind: 'solid';
  color: string;
}

/**
 * Linear gradient paint
 */
export interface LinearGradientPaint {
  kind: 'linear-gradient';
  /** Angle in degrees (0 = bottom to top, 90 = left to right) */
  angle: number;
  /** Gradient color stops */
  stops: GradientStop[];
}

/**
 * Radial gradient paint
 */
export interface RadialGradientPaint {
  kind: 'radial-gradient';
  /** Center X position (0.0 to 1.0, relative to shape bounds) */
  cx: number;
  /** Center Y position (0.0 to 1.0, relative to shape bounds) */
  cy: number;
  /** Radius (0.0 to 1.0, relative to shape diagonal) */
  radius: number;
  /** Gradient color stops */
  stops: GradientStop[];
}

/**
 * Union type for all paint types
 */
export type Paint = SolidPaint | LinearGradientPaint | RadialGradientPaint;

/**
 * Type guard for solid paint
 */
export function isSolidPaint(paint: Paint): paint is SolidPaint {
  return paint.kind === 'solid';
}

/**
 * Type guard for linear gradient paint
 */
export function isLinearGradientPaint(paint: Paint): paint is LinearGradientPaint {
  return paint.kind === 'linear-gradient';
}

/**
 * Type guard for radial gradient paint
 */
export function isRadialGradientPaint(paint: Paint): paint is RadialGradientPaint {
  return paint.kind === 'radial-gradient';
}
