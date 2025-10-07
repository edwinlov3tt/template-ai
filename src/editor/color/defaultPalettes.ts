/**
 * Default Color Palettes
 *
 * Curated solid colors and gradients for the color panel.
 * Based on Tailwind CSS color palette and modern gradient trends.
 */

import type { LinearGradientPaint } from './types'

/**
 * Default solid colors organized by hue
 * 14 hues × 7 lightness steps = 98 colors
 */
export const DEFAULT_SOLID_COLORS: string[] = [
  // Grays
  '#000000', '#3f3f46', '#71717a', '#a1a1aa', '#d4d4d8', '#f4f4f5', '#ffffff',

  // Reds
  '#7f1d1d', '#991b1b', '#dc2626', '#f87171', '#fca5a5', '#fecaca', '#fee2e2',

  // Oranges
  '#7c2d12', '#9a3412', '#ea580c', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5',

  // Ambers
  '#78350f', '#92400e', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7',

  // Yellows
  '#713f12', '#854d0e', '#eab308', '#facc15', '#fde047', '#fef08a', '#fef9c3',

  // Limes
  '#365314', '#3f6212', '#84cc16', '#a3e635', '#bef264', '#d9f99d', '#ecfccb',

  // Greens
  '#14532d', '#166534', '#16a34a', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7',

  // Emeralds
  '#064e3b', '#065f46', '#059669', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5',

  // Teals
  '#134e4a', '#115e59', '#0d9488', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1',

  // Cyans
  '#164e63', '#155e75', '#0891b2', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe',

  // Blues
  '#1e3a8a', '#1e40af', '#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe',

  // Indigos
  '#312e81', '#3730a3', '#4f46e5', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff',

  // Purples
  '#581c87', '#6b21a8', '#9333ea', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff',

  // Pinks
  '#831843', '#9f1239', '#e11d48', '#f43f5e', '#fb7185', '#fda4af', '#fecdd3'
]

/**
 * Curated linear gradients
 * Organized by mood: warm, cool, rainbow, grayscale
 */
export const DEFAULT_GRADIENTS: LinearGradientPaint[] = [
  // Warm gradients
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#667eea' },
      { offset: 1, color: '#764ba2' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 90,
    stops: [
      { offset: 0, color: '#f093fb' },
      { offset: 1, color: '#f5576c' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#fa709a' },
      { offset: 1, color: '#fee140' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 90,
    stops: [
      { offset: 0, color: '#ff6a00' },
      { offset: 1, color: '#ee0979' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#ffecd2' },
      { offset: 1, color: '#fcb69f' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 90,
    stops: [
      { offset: 0, color: '#ff9a9e' },
      { offset: 1, color: '#fecfef' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#a18cd1' },
      { offset: 1, color: '#fbc2eb' }
    ]
  },

  // Cool gradients
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#0093e9' },
      { offset: 1, color: '#80d0c7' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 90,
    stops: [
      { offset: 0, color: '#4facfe' },
      { offset: 1, color: '#00f2fe' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#43e97b' },
      { offset: 1, color: '#38f9d7' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 90,
    stops: [
      { offset: 0, color: '#08aeea' },
      { offset: 1, color: '#2af598' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#3b41c5' },
      { offset: 1, color: '#a981bb' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 90,
    stops: [
      { offset: 0, color: '#00c6ff' },
      { offset: 1, color: '#0072ff' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#30cfd0' },
      { offset: 1, color: '#330867' }
    ]
  },

  // Rainbow gradients
  {
    kind: 'linear-gradient',
    angle: 90,
    stops: [
      { offset: 0, color: '#ee9ca7' },
      { offset: 1, color: '#ffdde1' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#ffecd2' },
      { offset: 0.5, color: '#fcb69f' },
      { offset: 1, color: '#ff9a9e' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 90,
    stops: [
      { offset: 0, color: '#a8edea' },
      { offset: 1, color: '#fed6e3' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#fa709a' },
      { offset: 0.5, color: '#fee140' },
      { offset: 1, color: '#30cfd0' }
    ]
  },

  // Grayscale gradients
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#000000' },
      { offset: 1, color: '#434343' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 90,
    stops: [
      { offset: 0, color: '#ffffff' },
      { offset: 1, color: '#e5e5e5' }
    ]
  },
  {
    kind: 'linear-gradient',
    angle: 135,
    stops: [
      { offset: 0, color: '#bdc3c7' },
      { offset: 1, color: '#2c3e50' }
    ]
  }
]
