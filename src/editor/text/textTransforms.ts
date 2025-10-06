/**
 * Text Transformation Utilities
 *
 * Provides functions for transforming text case (uppercase, title case, sentence case)
 */

export type TextTransform = 'none' | 'uppercase' | 'title' | 'sentence'

/**
 * Apply text transformation to a string
 *
 * @param text - Input text to transform
 * @param transform - Transformation type
 * @returns Transformed text
 */
export function applyTextTransform(text: string, transform: TextTransform): string {
  if (!text || transform === 'none') {
    return text
  }

  switch (transform) {
    case 'uppercase':
      return text.toUpperCase()

    case 'title':
      return toTitleCase(text)

    case 'sentence':
      return toSentenceCase(text)

    default:
      return text
  }
}

/**
 * Convert text to Title Case (capitalize first letter of each word)
 *
 * Rules:
 * - Capitalize first letter of each word
 * - Preserve punctuation and numbers
 * - Handle contractions (e.g., "don't" → "Don't")
 * - Don't capitalize small words in the middle (optional, for now we capitalize all)
 *
 * @param text - Input text
 * @returns Title cased text
 */
export function toTitleCase(text: string): string {
  if (!text) return text

  // Split by whitespace while preserving the separators
  return text
    .split(/(\s+)/)
    .map((word) => {
      // If it's just whitespace, return as-is
      if (/^\s+$/.test(word)) {
        return word
      }

      // Capitalize first letter, lowercase the rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join('')
}

/**
 * Convert text to Sentence case (capitalize first letter only)
 *
 * Rules:
 * - Capitalize first letter of the text
 * - Lowercase everything else
 * - Preserve sentence boundaries (optional, for now just first letter)
 *
 * @param text - Input text
 * @returns Sentence cased text
 */
export function toSentenceCase(text: string): string {
  if (!text) return text

  // Trim leading whitespace to find first character
  const trimmed = text.trimStart()
  if (trimmed.length === 0) return text

  // Find the first letter (skip any non-letter characters)
  let firstLetterIndex = 0
  for (let i = 0; i < trimmed.length; i++) {
    if (/[a-zA-Z]/.test(trimmed[i])) {
      firstLetterIndex = i
      break
    }
  }

  // Calculate offset from original text
  const leadingWhitespace = text.length - trimmed.length

  // Capitalize first letter, lowercase the rest
  const before = text.slice(0, leadingWhitespace + firstLetterIndex)
  const firstLetter = text[leadingWhitespace + firstLetterIndex].toUpperCase()
  const after = text.slice(leadingWhitespace + firstLetterIndex + 1).toLowerCase()

  return before + firstLetter + after
}

/**
 * Get mixed state for text transform property in multi-selection
 *
 * @param values - Array of text transform values
 * @returns Single value or 'Mixed'
 */
export function getMixedTextTransform(values: TextTransform[]): TextTransform | 'Mixed' {
  if (values.length === 0) return 'none'

  const first = values[0]
  const allSame = values.every((v) => v === first)

  return allSame ? first : 'Mixed'
}

/**
 * Generic mixed state helper for any type
 *
 * @param values - Array of values
 * @returns Single value or 'Mixed'
 */
export function getMixedState<T>(values: T[]): T | 'Mixed' {
  if (values.length === 0) {
    throw new Error('Cannot get mixed state from empty array')
  }

  const first = values[0]
  const allSame = values.every((v) => {
    // Deep equality check for objects
    if (typeof v === 'object' && v !== null && typeof first === 'object' && first !== null) {
      return JSON.stringify(v) === JSON.stringify(first)
    }
    return v === first
  })

  return allSame ? first : 'Mixed'
}
