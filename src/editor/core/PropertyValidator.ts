// src/editor/core/PropertyValidator.ts
export type ValidationError = { field: string; message: string }

export const PropertyValidator = {
  color(value: string): [string, ValidationError?] {
    if (!value) return ['#000000', { field:'color', message:'Empty color' }]
    return [value.startsWith('#') ? value : value, undefined]
  },
  fontSize(value: number, min=8, max=300): [number, ValidationError?] {
    if (Number.isFinite(value) && value>=min && value<=max) return [value, undefined]
    const clamped = Math.min(max, Math.max(min, isFinite(value) ? value : min))
    return [clamped, { field:'fontSize', message:`Clamped to [${min}, ${max}]` }]
  }
}
