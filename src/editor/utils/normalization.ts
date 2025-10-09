export type RatioId = string

type Dimensions = { w: number; h: number }

type Scale = { scaleX: number; scaleY: number }

const NORMALIZED_LONG_EDGE = 2000
const NORMALIZED_MIN_SHORT_EDGE = 320

/**
 * Parse aspect ratio from ratio ID.
 * Supports pixel format (e.g. "728x90") and aspect format (e.g. "16:9").
 */
export function parseAspectRatio(ratioId: RatioId): number {
  const pixelMatch = ratioId.match(/^(\d+)x(\d+)$/)
  if (pixelMatch) {
    const w = parseInt(pixelMatch[1], 10)
    const h = parseInt(pixelMatch[2], 10)
    return h === 0 ? 1 : w / h
  }

  const aspectMatch = ratioId.match(/^(\d+):(\d+)$/)
  if (aspectMatch) {
    const w = parseInt(aspectMatch[1], 10)
    const h = parseInt(aspectMatch[2], 10)
    return h === 0 ? 1 : w / h
  }

  return 1
}

/**
 * Real pixel dimensions for a ratio ID.
 * Pixel ratios return their literal size.
 * Aspect ratios map to canonical HD/portrait sizes.
 */
export function getExportDimensions(ratioId: RatioId): Dimensions {
  const pixelMatch = ratioId.match(/^(\d+)x(\d+)$/)
  if (pixelMatch) {
    return {
      w: parseInt(pixelMatch[1], 10),
      h: parseInt(pixelMatch[2], 10)
    }
  }

  const aspectMatch = ratioId.match(/^(\d+):(\d+)$/)
  if (aspectMatch) {
    const w = parseInt(aspectMatch[1], 10)
    const h = parseInt(aspectMatch[2], 10)

    if (w === h) {
      return { w: 1080, h: 1080 }
    }

    if (w > h) {
      const baseWidth = 1920
      return { w: baseWidth, h: Math.round((baseWidth * h) / w) }
    }

    const baseWidth = 1080
    return { w: baseWidth, h: Math.round((baseWidth * h) / w) }
  }

  return { w: 1080, h: 1080 }
}

/**
 * Normalized editing dimensions.
 * Ensures comfortable working area by clamping long/short edges.
 */
export function getNormalizedDimensions(ratioId: RatioId): Dimensions {
  const aspect = Math.max(parseAspectRatio(ratioId), 0.0001)

  let width = aspect >= 1
    ? NORMALIZED_LONG_EDGE
    : NORMALIZED_LONG_EDGE * aspect

  let height = aspect >= 1
    ? NORMALIZED_LONG_EDGE / aspect
    : NORMALIZED_LONG_EDGE

  if (aspect >= 1 && height < NORMALIZED_MIN_SHORT_EDGE) {
    height = NORMALIZED_MIN_SHORT_EDGE
    width = height * aspect
  } else if (aspect < 1 && width < NORMALIZED_MIN_SHORT_EDGE) {
    width = NORMALIZED_MIN_SHORT_EDGE
    height = width / aspect
  }

  return {
    w: Math.round(width),
    h: Math.round(height)
  }
}

/**
 * Scale factors for export (normalized -> pixel).
 */
export function getExportScale(ratioId: RatioId): Scale {
  const normalized = getNormalizedDimensions(ratioId)
  const exported = getExportDimensions(ratioId)

  return {
    scaleX: exported.w / normalized.w,
    scaleY: exported.h / normalized.h
  }
}

/**
 * Scale factors for normalization (pixel -> normalized).
 */
export function getNormalizationScale(ratioId: RatioId): Scale {
  const normalized = getNormalizedDimensions(ratioId)
  const exported = getExportDimensions(ratioId)

  return {
    scaleX: normalized.w / exported.w,
    scaleY: normalized.h / exported.h
  }
}

export function normalizeFrame(frame: { x: number; y: number; width: number; height: number }, ratioId: RatioId) {
  const { scaleX, scaleY } = getNormalizationScale(ratioId)
  return {
    x: frame.x * scaleX,
    y: frame.y * scaleY,
    width: frame.width * scaleX,
    height: frame.height * scaleY,
    rotation: frame.rotation
  }
}

export function denormalizeFrame(frame: { x: number; y: number; width: number; height: number; rotation?: number }, ratioId: RatioId) {
  const { scaleX, scaleY } = getExportScale(ratioId)
  return {
    x: frame.x * scaleX,
    y: frame.y * scaleY,
    width: frame.width * scaleX,
    height: frame.height * scaleY,
    rotation: frame.rotation
  }
}

export const NORMALIZATION_METADATA = {
  longEdge: NORMALIZED_LONG_EDGE,
  minShortEdge: NORMALIZED_MIN_SHORT_EDGE
}
