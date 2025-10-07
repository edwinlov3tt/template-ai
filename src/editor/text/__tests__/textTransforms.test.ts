import { describe, it, expect } from 'vitest'
import {
  applyTextTransform,
  toTitleCase,
  toSentenceCase,
  getMixedTextTransform,
  getMixedState
} from '../textTransforms'

describe('textTransforms', () => {
  describe('applyTextTransform', () => {
    it('should return original text for "none" transform', () => {
      expect(applyTextTransform('Hello World', 'none')).toBe('Hello World')
    })

    it('should transform to uppercase', () => {
      expect(applyTextTransform('Hello World', 'uppercase')).toBe('HELLO WORLD')
    })

    it('should transform to title case', () => {
      expect(applyTextTransform('hello world', 'title')).toBe('Hello World')
    })

    it('should transform to sentence case', () => {
      expect(applyTextTransform('hello world', 'sentence')).toBe('Hello world')
    })

    it('should handle empty string', () => {
      expect(applyTextTransform('', 'uppercase')).toBe('')
    })
  })

  describe('toTitleCase', () => {
    it('should capitalize first letter of each word', () => {
      expect(toTitleCase('hello world')).toBe('Hello World')
    })

    it('should handle already title-cased text', () => {
      expect(toTitleCase('Hello World')).toBe('Hello World')
    })

    it('should handle all caps', () => {
      expect(toTitleCase('HELLO WORLD')).toBe('Hello World')
    })

    it('should preserve multiple spaces', () => {
      expect(toTitleCase('hello  world')).toBe('Hello  World')
    })

    it('should handle single word', () => {
      expect(toTitleCase('hello')).toBe('Hello')
    })

    it('should handle punctuation', () => {
      expect(toTitleCase('hello, world!')).toBe('Hello, World!')
    })

    it('should handle numbers', () => {
      expect(toTitleCase('hello 123 world')).toBe('Hello 123 World')
    })

    it('should handle contractions', () => {
      expect(toTitleCase("don't stop believing")).toBe("Don't Stop Believing")
    })

    it('should handle hyphens', () => {
      // Hyphens are treated as part of the word, not separators
      expect(toTitleCase('well-known artist')).toBe('Well-known Artist')
    })

    it('should handle empty string', () => {
      expect(toTitleCase('')).toBe('')
    })
  })

  describe('toSentenceCase', () => {
    it('should capitalize first letter only', () => {
      expect(toSentenceCase('hello world')).toBe('Hello world')
    })

    it('should handle already sentence-cased text', () => {
      expect(toSentenceCase('Hello world')).toBe('Hello world')
    })

    it('should handle all caps', () => {
      expect(toSentenceCase('HELLO WORLD')).toBe('Hello world')
    })

    it('should handle title case', () => {
      expect(toSentenceCase('Hello World')).toBe('Hello world')
    })

    it('should handle leading spaces', () => {
      expect(toSentenceCase('   hello world')).toBe('   Hello world')
    })

    it('should handle leading punctuation', () => {
      expect(toSentenceCase('!hello world')).toBe('!Hello world')
    })

    it('should handle numbers at start', () => {
      // Capitalize first letter after numbers
      expect(toSentenceCase('123 hello world')).toBe('123 Hello world')
    })

    it('should handle single word', () => {
      expect(toSentenceCase('hello')).toBe('Hello')
    })

    it('should handle empty string', () => {
      expect(toSentenceCase('')).toBe('')
    })

    it('should handle only whitespace', () => {
      expect(toSentenceCase('   ')).toBe('   ')
    })
  })

  describe('getMixedTextTransform', () => {
    it('should return single value when all same', () => {
      expect(getMixedTextTransform(['uppercase', 'uppercase', 'uppercase'])).toBe('uppercase')
    })

    it('should return "Mixed" when values differ', () => {
      expect(getMixedTextTransform(['uppercase', 'title', 'none'])).toBe('Mixed')
    })

    it('should handle empty array', () => {
      expect(getMixedTextTransform([])).toBe('none')
    })

    it('should handle single item', () => {
      expect(getMixedTextTransform(['title'])).toBe('title')
    })
  })

  describe('getMixedState', () => {
    describe('with primitives', () => {
      it('should return single value when all same', () => {
        expect(getMixedState([400, 400, 400])).toBe(400)
      })

      it('should return "Mixed" when values differ', () => {
        expect(getMixedState([400, 700, 400])).toBe('Mixed')
      })

      it('should handle strings', () => {
        expect(getMixedState(['Inter', 'Inter', 'Inter'])).toBe('Inter')
        expect(getMixedState(['Inter', 'Roboto'])).toBe('Mixed')
      })

      it('should handle booleans', () => {
        expect(getMixedState([true, true])).toBe(true)
        expect(getMixedState([true, false])).toBe('Mixed')
      })
    })

    describe('with objects', () => {
      it('should return single value when objects are identical', () => {
        const obj = { x: 10, y: 20 }
        expect(getMixedState([obj, obj])).toBe(obj)
      })

      it('should return single value when objects have same content', () => {
        const result = getMixedState([
          { x: 10, y: 20 },
          { x: 10, y: 20 }
        ])
        expect(result).toEqual({ x: 10, y: 20 })
      })

      it('should return "Mixed" when objects differ', () => {
        expect(
          getMixedState([
            { x: 10, y: 20 },
            { x: 15, y: 25 }
          ])
        ).toBe('Mixed')
      })
    })

    describe('edge cases', () => {
      it('should throw error for empty array', () => {
        expect(() => getMixedState([])).toThrow('Cannot get mixed state from empty array')
      })

      it('should handle single item', () => {
        expect(getMixedState([42])).toBe(42)
      })

      it('should handle null values', () => {
        expect(getMixedState([null, null])).toBe(null)
        expect(getMixedState([null, undefined])).toBe('Mixed')
      })

      it('should handle arrays', () => {
        expect(getMixedState([[1, 2], [1, 2]])).toEqual([1, 2])
        expect(getMixedState([[1, 2], [3, 4]])).toBe('Mixed')
      })
    })
  })
})
