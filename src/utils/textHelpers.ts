/**
 * Text transformation utilities
 */

/**
 * Apply text-transform styles to text content
 */
export function applyTextTransform(
  text: string,
  mode: 'none' | 'uppercase' | 'lowercase' | 'title' | 'sentence' | undefined
): string {
  if (!mode || mode === 'none') return text

  switch (mode) {
    case 'uppercase':
      return text.toUpperCase()

    case 'lowercase':
      return text.toLowerCase()

    case 'title':
      // Title case: capitalize first letter of each word
      return text
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

    case 'sentence':
      // Sentence case: capitalize first letter of first word only
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()

    default:
      return text
  }
}
