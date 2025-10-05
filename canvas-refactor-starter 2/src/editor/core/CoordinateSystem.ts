// src/editor/core/CoordinateSystem.ts
export class CoordinateSystem {
  private svg: SVGSVGElement | null = null
  private invCTM: DOMMatrix | null = null

  setSvg(svg: SVGSVGElement) { this.svg = svg }
  invalidate() { this.invCTM = null }

  private ensureCTM() {
    if (!this.svg) return null
    if (!this.invCTM) {
      const m = this.svg.getScreenCTM()
      this.invCTM = m ? m.inverse() : null
    }
    return this.invCTM
  }

  screenToUser(p: {x:number;y:number}) {
    const m = this.ensureCTM()
    if (!m) return p
    const pt = new DOMPoint(p.x, p.y).matrixTransform(m)
    return { x: pt.x, y: pt.y }
  }

  pxDeltaToUser(dx:number, dy:number) {
    const m = this.ensureCTM()
    if (!m) return { dx, dy }
    const p1 = new DOMPoint(0,0).matrixTransform(m)
    const p2 = new DOMPoint(dx,dy).matrixTransform(m)
    return { dx: p2.x - p1.x, dy: p2.y - p1.y }
  }
}
