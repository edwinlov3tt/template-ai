/**
 * CoordinateSystem Service
 *
 * Centralizes DOM↔SVG coordinate transformations with cached inverse CTM.
 * Compatible with pointer events and setPointerCapture.
 *
 * Phase 0: No UI changes, just the core service.
 */
export class CoordinateSystem {
  private svg: SVGSVGElement | null = null
  private cachedInverseCTM: DOMMatrix | null = null

  /**
   * Set the SVG element to use for coordinate transformations.
   * Invalidates cached transforms.
   */
  setSvg(svg: SVGSVGElement): void {
    this.svg = svg
    this.invalidate()
  }

  /**
   * Invalidate cached transforms.
   * Call this on zoom, pan, resize, or layout shift.
   */
  invalidate(): void {
    this.cachedInverseCTM = null
  }

  /**
   * Get the inverse CTM, computing and caching if needed.
   * Uses getScreenCTM() with fallback to getCTM().
   */
  private getInverseCTM(): DOMMatrix {
    if (this.cachedInverseCTM) {
      return this.cachedInverseCTM
    }

    if (!this.svg) {
      throw new Error('CoordinateSystem: SVG element not set. Call setSvg() first.')
    }

    // Prefer getScreenCTM() for element-to-viewport transform
    let ctm = this.svg.getScreenCTM()

    // Fallback to getCTM() if getScreenCTM() returns null
    if (!ctm) {
      ctm = this.svg.getCTM()
    }

    if (!ctm) {
      throw new Error('CoordinateSystem: Unable to get CTM from SVG element.')
    }

    // Cache the inverse
    this.cachedInverseCTM = ctm.inverse()
    return this.cachedInverseCTM
  }

  /**
   * Convert screen coordinates (viewport pixels) to SVG user coordinates.
   * Preserves viewBox semantics.
   *
   * @param p - Point in screen coordinates (e.g., from pointer event clientX/clientY)
   * @returns Point in SVG user coordinates (viewBox units)
   */
  screenToUser(p: { x: number; y: number }): { x: number; y: number } {
    const inverseCTM = this.getInverseCTM()

    // Transform point using inverse CTM
    const svgPoint = new DOMPoint(p.x, p.y).matrixTransform(inverseCTM)

    return { x: svgPoint.x, y: svgPoint.y }
  }

  /**
   * Convert SVG user coordinates to screen coordinates (viewport pixels).
   *
   * @param p - Point in SVG user coordinates (viewBox units)
   * @returns Point in screen coordinates (viewport pixels)
   */
  userToScreen(p: { x: number; y: number }): { x: number; y: number } {
    if (!this.svg) {
      throw new Error('CoordinateSystem: SVG element not set. Call setSvg() first.')
    }

    // Get the forward CTM (not cached, as we primarily use inverse)
    let ctm = this.svg.getScreenCTM()

    if (!ctm) {
      ctm = this.svg.getCTM()
    }

    if (!ctm) {
      throw new Error('CoordinateSystem: Unable to get CTM from SVG element.')
    }

    // Transform point using CTM
    const screenPoint = new DOMPoint(p.x, p.y).matrixTransform(ctm)

    return { x: screenPoint.x, y: screenPoint.y }
  }

  /**
   * Convert a pixel delta (dx, dy) from screen space to user space.
   * Useful for dragging operations.
   *
   * @param dx - Delta X in screen pixels
   * @param dy - Delta Y in screen pixels
   * @returns Delta in SVG user coordinates
   */
  pxDeltaToUser(dx: number, dy: number): { dx: number; dy: number } {
    const inverseCTM = this.getInverseCTM()

    // Transform deltas: create vectors at origin and at (dx, dy), then subtract
    const origin = new DOMPoint(0, 0).matrixTransform(inverseCTM)
    const delta = new DOMPoint(dx, dy).matrixTransform(inverseCTM)

    return {
      dx: delta.x - origin.x,
      dy: delta.y - origin.y
    }
  }
}

/**
 * Create a singleton instance for convenience.
 * For React components, consider creating an instance per canvas.
 */
export const coordinateSystem = new CoordinateSystem()
