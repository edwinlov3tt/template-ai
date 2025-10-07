/**
 * Color Core System
 *
 * Foundation for Paint type system, color math utilities, and SVG gradient management.
 *
 * @module editor/color
 */

// Types
export type {
  Paint,
  SolidPaint,
  LinearGradientPaint,
  RadialGradientPaint,
  GradientStop
} from './types';

export {
  isSolidPaint,
  isLinearGradientPaint,
  isRadialGradientPaint
} from './types';

// Color Math
export {
  parseColor,
  toHex,
  toOklch,
  clampToSrgb,
  interpolate,
  contrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  getLuminance
} from './colorMath';

// Gradient SVG Management
export {
  ensureGradientDef,
  removeGradientDef,
  getPaintFillValue
} from './gradientDefs';

// Validators
export {
  validatePaint,
  sortStops,
  normalizeStops,
  paintsEqual
} from './validators';

// Migrations
export {
  migrateFillToPaint,
  paintToLegacyFill,
  migrateTemplateFills,
  extractTemplateColors
} from './migrations';
