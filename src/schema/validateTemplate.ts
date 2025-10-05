import Ajv, { ErrorObject } from 'ajv'
import templateSchema from './templateSchema'

const ajv = new Ajv({ allErrors: true, verbose: true })
const validate = ajv.compile(templateSchema)

export interface ValidationResult {
  valid: boolean
  errors: ErrorObject[] | null
  errorSummary?: string
}

/**
 * Validates a template JSON object against the Template JSON Schema (Draft 2020-12)
 *
 * @param template - The template object to validate
 * @returns ValidationResult with validation status and detailed errors
 *
 * @example
 * ```ts
 * const result = validateTemplate(myTemplate)
 * if (!result.valid) {
 *   console.error(result.errorSummary)
 *   console.error(result.errors)
 * }
 * ```
 */
export function validateTemplate(template: unknown): ValidationResult {
  const valid = validate(template)

  if (valid) {
    return { valid: true, errors: null }
  }

  const errors = validate.errors || []
  const errorSummary = errors
    .map(err => {
      const path = err.instancePath || 'root'
      const msg = err.message || 'validation failed'
      return `${path}: ${msg}`
    })
    .join('\n')

  return {
    valid: false,
    errors,
    errorSummary
  }
}

/**
 * Validates a template and throws an error if invalid
 * Useful for strict validation flows where you want to fail fast
 *
 * @param template - The template object to validate
 * @throws Error with validation details if template is invalid
 */
export function validateTemplateStrict(template: unknown): asserts template is Record<string, unknown> {
  const result = validateTemplate(template)
  if (!result.valid) {
    throw new Error(`Template validation failed:\n${result.errorSummary}`)
  }
}
