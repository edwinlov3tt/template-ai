/**
 * PropertyValidator.ts
 *
 * Pure functions for validating and normalizing visual properties.
 * Returns structured errors (no throws).
 */

// ============================================================================
// Types
// ============================================================================

export type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; error: string; attempted?: unknown };

export interface StrokeProperties {
  width: number;
  join?: 'miter' | 'round' | 'bevel';
  cap?: 'butt' | 'round' | 'square';
}

export interface TextProperties {
  fontFamily?: string;
  fontWeight?: number | string;
  fontSize?: number;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface CornerRadiusConstraints {
  width: number;
  height: number;
}

// ============================================================================
// Color Validation
// ============================================================================

/**
 * Validates and normalizes color to hex format.
 * Accepts: hex (#RGB, #RRGGBB, #RRGGBBAA), rgb(a), hsl(a)
 * Returns: Normalized hex string (#RRGGBB or #RRGGBBAA)
 */
export function validateColor(color: string): ValidationResult<string> {
  if (typeof color !== 'string') {
    return { valid: false, error: 'Color must be a string', attempted: color };
  }

  const trimmed = color.trim();

  // Hex color
  if (trimmed.startsWith('#')) {
    return validateHexColor(trimmed);
  }

  // RGB/RGBA
  if (trimmed.startsWith('rgb')) {
    return parseRgbColor(trimmed);
  }

  // HSL/HSLA
  if (trimmed.startsWith('hsl')) {
    return parseHslColor(trimmed);
  }

  return { valid: false, error: 'Unsupported color format', attempted: color };
}

function validateHexColor(hex: string): ValidationResult<string> {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Valid lengths: 3 (RGB), 6 (RRGGBB), 8 (RRGGBBAA)
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$|^[0-9A-Fa-f]{8}$/.test(cleanHex)) {
    return { valid: false, error: 'Invalid hex color format', attempted: hex };
  }

  // Expand 3-digit hex to 6-digit
  if (cleanHex.length === 3) {
    const expanded = cleanHex.split('').map(c => c + c).join('');
    return { valid: true, value: `#${expanded.toUpperCase()}` };
  }

  return { valid: true, value: `#${cleanHex.toUpperCase()}` };
}

function parseRgbColor(rgb: string): ValidationResult<string> {
  // Match rgb(r, g, b) or rgba(r, g, b, a)
  const match = rgb.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);

  if (!match) {
    return { valid: false, error: 'Invalid RGB format', attempted: rgb };
  }

  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] ? parseFloat(match[4]) : undefined;

  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    return { valid: false, error: 'RGB values must be 0-255', attempted: rgb };
  }

  if (a !== undefined && (a < 0 || a > 1)) {
    return { valid: false, error: 'Alpha must be 0-1', attempted: rgb };
  }

  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

  if (a !== undefined) {
    const alphaHex = toHex(Math.round(a * 255));
    return { valid: true, value: `${hex}${alphaHex}` };
  }

  return { valid: true, value: hex };
}

function parseHslColor(hsl: string): ValidationResult<string> {
  // Match hsl(h, s%, l%) or hsla(h, s%, l%, a)
  const match = hsl.match(/hsla?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)/);

  if (!match) {
    return { valid: false, error: 'Invalid HSL format', attempted: hsl };
  }

  const h = parseFloat(match[1]) % 360;
  const s = parseFloat(match[2]);
  const l = parseFloat(match[3]);
  const a = match[4] ? parseFloat(match[4]) : undefined;

  if (s < 0 || s > 100 || l < 0 || l > 100) {
    return { valid: false, error: 'Saturation and lightness must be 0-100%', attempted: hsl };
  }

  if (a !== undefined && (a < 0 || a > 1)) {
    return { valid: false, error: 'Alpha must be 0-1', attempted: hsl };
  }

  const rgb = hslToRgb(h, s / 100, l / 100);
  const hex = `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;

  if (a !== undefined) {
    const alphaHex = toHex(Math.round(a * 255));
    return { valid: true, value: `${hex}${alphaHex}` };
  }

  return { valid: true, value: hex };
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

// ============================================================================
// Opacity Validation
// ============================================================================

/**
 * Validates and clamps opacity to [0..1]
 */
export function validateOpacity(opacity: number | string): ValidationResult<number> {
  const num = typeof opacity === 'string' ? parseFloat(opacity) : opacity;

  if (isNaN(num)) {
    return { valid: false, error: 'Opacity must be a number', attempted: opacity };
  }

  const clamped = Math.max(0, Math.min(1, num));

  return { valid: true, value: clamped };
}

// ============================================================================
// Stroke Validation
// ============================================================================

/**
 * Validates stroke properties
 */
export function validateStroke(stroke: Partial<StrokeProperties>): ValidationResult<StrokeProperties> {
  const errors: string[] = [];

  // Validate width
  const width = stroke.width;
  if (width === undefined || width === null) {
    errors.push('Stroke width is required');
  } else if (typeof width !== 'number' || width < 0) {
    errors.push('Stroke width must be a non-negative number');
  }

  // Validate join
  const validJoins = ['miter', 'round', 'bevel'];
  if (stroke.join !== undefined && !validJoins.includes(stroke.join)) {
    errors.push(`Stroke join must be one of: ${validJoins.join(', ')}`);
  }

  // Validate cap
  const validCaps = ['butt', 'round', 'square'];
  if (stroke.cap !== undefined && !validCaps.includes(stroke.cap)) {
    errors.push(`Stroke cap must be one of: ${validCaps.join(', ')}`);
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; '), attempted: stroke };
  }

  return {
    valid: true,
    value: {
      width: width!,
      join: stroke.join,
      cap: stroke.cap
    }
  };
}

// ============================================================================
// Text Validation
// ============================================================================

const MIN_FONT_SIZE = 6;
const MAX_FONT_SIZE = 500;

const VALID_FONT_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900, 'normal', 'bold', 'lighter', 'bolder'];
const VALID_TEXT_ALIGNS = ['left', 'center', 'right', 'justify'];

/**
 * Validates text properties
 */
export function validateTextProperties(text: Partial<TextProperties>): ValidationResult<Partial<TextProperties>> {
  const errors: string[] = [];
  const validated: Partial<TextProperties> = {};

  // Font family - any string is valid
  if (text.fontFamily !== undefined) {
    if (typeof text.fontFamily !== 'string' || text.fontFamily.trim() === '') {
      errors.push('Font family must be a non-empty string');
    } else {
      validated.fontFamily = text.fontFamily.trim();
    }
  }

  // Font weight
  if (text.fontWeight !== undefined) {
    if (!VALID_FONT_WEIGHTS.includes(text.fontWeight)) {
      errors.push(`Font weight must be one of: ${VALID_FONT_WEIGHTS.join(', ')}`);
    } else {
      validated.fontWeight = text.fontWeight;
    }
  }

  // Font size - clamp to range
  if (text.fontSize !== undefined) {
    const size = typeof text.fontSize === 'string' ? parseFloat(text.fontSize) : text.fontSize;
    if (isNaN(size)) {
      errors.push('Font size must be a number');
    } else {
      const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size));
      validated.fontSize = clamped;
    }
  }

  // Line height - number or string (e.g., "1.5" or "24px")
  if (text.lineHeight !== undefined) {
    const lh = text.lineHeight;
    if (typeof lh === 'number') {
      if (lh < 0) {
        errors.push('Line height must be non-negative');
      } else {
        validated.lineHeight = lh;
      }
    } else if (typeof lh === 'string') {
      // Accept any valid CSS line-height string
      validated.lineHeight = lh.trim();
    } else {
      errors.push('Line height must be a number or string');
    }
  }

  // Letter spacing - number or string
  if (text.letterSpacing !== undefined) {
    const ls = text.letterSpacing;
    if (typeof ls === 'number') {
      validated.letterSpacing = ls;
    } else if (typeof ls === 'string') {
      validated.letterSpacing = ls.trim();
    } else {
      errors.push('Letter spacing must be a number or string');
    }
  }

  // Text align
  if (text.textAlign !== undefined) {
    if (!VALID_TEXT_ALIGNS.includes(text.textAlign)) {
      errors.push(`Text align must be one of: ${VALID_TEXT_ALIGNS.join(', ')}`);
    } else {
      validated.textAlign = text.textAlign;
    }
  }

  if (errors.length > 0) {
    return { valid: false, error: errors.join('; '), attempted: text };
  }

  return { valid: true, value: validated };
}

/**
 * Validates and clamps font size
 */
export function validateFontSize(fontSize: number): ValidationResult<number> {
  if (typeof fontSize !== 'number' || isNaN(fontSize)) {
    return { valid: false, error: 'Font size must be a number', attempted: fontSize };
  }

  const clamped = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, fontSize));

  return { valid: true, value: clamped };
}

// ============================================================================
// Corner Radius Validation
// ============================================================================

/**
 * Validates and clamps corner radius to [0, min(width, height) / 2]
 */
export function validateCornerRadius(
  rx: number,
  ry: number,
  constraints: CornerRadiusConstraints
): ValidationResult<{ rx: number; ry: number }> {
  const { width, height } = constraints;

  if (width <= 0 || height <= 0) {
    return {
      valid: false,
      error: 'Width and height must be positive',
      attempted: { rx, ry, constraints }
    };
  }

  const maxRadius = Math.min(width, height) / 2;

  const clampedRx = Math.max(0, Math.min(maxRadius, rx));
  const clampedRy = Math.max(0, Math.min(maxRadius, ry));

  return { valid: true, value: { rx: clampedRx, ry: clampedRy } };
}

// ============================================================================
// Error Helpers
// ============================================================================

export interface UIWarning {
  property: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Maps validation result to UI warning
 */
export function validationResultToWarning<T>(
  result: ValidationResult<T>,
  propertyName: string,
  severity: 'error' | 'warning' | 'info' = 'error'
): UIWarning | null {
  if (result.valid) {
    return null;
  }

  return {
    property: propertyName,
    message: result.error,
    severity
  };
}

/**
 * Maps multiple validation results to UI warnings
 */
export function validationResultsToWarnings(
  results: Array<{ result: ValidationResult<unknown>; propertyName: string; severity?: 'error' | 'warning' | 'info' }>
): UIWarning[] {
  return results
    .map(({ result, propertyName, severity }) =>
      validationResultToWarning(result, propertyName, severity)
    )
    .filter((warning): warning is UIWarning => warning !== null);
}

/**
 * Checks if font size was clamped and returns appropriate message
 */
export function getFontSizeClampMessage(original: number, clamped: number): string | null {
  if (original === clamped) {
    return null;
  }

  if (clamped === MIN_FONT_SIZE) {
    return `Font size clamped to minimum (${MIN_FONT_SIZE}px)`;
  }

  if (clamped === MAX_FONT_SIZE) {
    return `Font size clamped to maximum (${MAX_FONT_SIZE}px)`;
  }

  return `Font size adjusted from ${original}px to ${clamped}px`;
}

/**
 * Checks if corner radius was clamped and returns appropriate message
 */
export function getCornerRadiusClampMessage(
  original: { rx: number; ry: number },
  clamped: { rx: number; ry: number },
  constraints: CornerRadiusConstraints
): string | null {
  const maxRadius = Math.min(constraints.width, constraints.height) / 2;

  if (original.rx === clamped.rx && original.ry === clamped.ry) {
    return null;
  }

  const parts: string[] = [];

  if (original.rx !== clamped.rx) {
    parts.push(`rx clamped to ${clamped.rx}px (max: ${maxRadius}px)`);
  }

  if (original.ry !== clamped.ry) {
    parts.push(`ry clamped to ${clamped.ry}px (max: ${maxRadius}px)`);
  }

  return `Corner radius adjusted: ${parts.join(', ')}`;
}
