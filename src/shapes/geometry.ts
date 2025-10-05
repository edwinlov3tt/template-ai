export type PointTuple = [number, number]

const DEG2RAD = Math.PI / 180

export function regularPolygon(points: number, cx: number, cy: number, r: number, rotation = 0): PointTuple[] {
  if (points < 3) {
    throw new Error('regularPolygon requires at least 3 points')
  }

  const angleStep = (Math.PI * 2) / points
  const rotationRad = rotation * DEG2RAD

  return Array.from({ length: points }, (_, index) => {
    const angle = angleStep * index + rotationRad
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    return [parseFloat(x.toFixed(3)), parseFloat(y.toFixed(3))] as PointTuple
  })
}

export function star(points: number, cx: number, cy: number, rOuter: number, rInner: number, rotation = 0): PointTuple[] {
  if (points < 2) {
    throw new Error('star requires at least 2 points')
  }
  if (rInner <= 0 || rOuter <= 0) {
    throw new Error('star requires positive radii')
  }

  const angleStep = Math.PI / points
  const rotationRad = rotation * DEG2RAD

  return Array.from({ length: points * 2 }, (_, index) => {
    const isOuter = index % 2 === 0
    const radius = isOuter ? rOuter : rInner
    const angle = angleStep * index + rotationRad
    const x = cx + radius * Math.cos(angle)
    const y = cy + radius * Math.sin(angle)
    return [parseFloat(x.toFixed(3)), parseFloat(y.toFixed(3))] as PointTuple
  })
}

export function pointsToPolygonAttribute(points: PointTuple[]): string {
  return points.map(([x, y]) => `${round(x)},${round(y)}`).join(' ')
}

function round(value: number): string {
  // Avoid trailing zeros while keeping reasonable precision
  const rounded = Number(value.toFixed(3))
  return Number.isInteger(rounded) ? String(rounded) : rounded.toString()
}
