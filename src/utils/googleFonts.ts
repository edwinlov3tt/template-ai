/**
 * Google Fonts List
 * Comprehensive list of popular Google Fonts organized by category
 * Based on Google Fonts most popular fonts as of 2025
 */

export interface FontCategory {
  name: string
  fonts: string[]
}

// Sans Serif Fonts (most popular for UI)
export const SANS_SERIF_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Source Sans Pro',
  'Oswald',
  'Ubuntu',
  'Nunito',
  'PT Sans',
  'Work Sans',
  'Noto Sans',
  'Mulish',
  'DM Sans',
  'Rubik',
  'Quicksand',
  'Karla',
  'Barlow',
  'Mukta',
  'Oxygen',
  'Josefin Sans',
  'Prompt',
  'Public Sans',
  'Manrope',
  'Hind',
  'Titillium Web',
  'Exo 2',
  'Cabin',
  'Archivo',
  'Heebo',
  'IBM Plex Sans',
  'Commissioner',
  'Outfit'
]

// Serif Fonts (classic and elegant)
export const SERIF_FONTS = [
  'Merriweather',
  'Playfair Display',
  'Lora',
  'Crimson Text',
  'PT Serif',
  'Libre Baskerville',
  'Cormorant',
  'Spectral',
  'Vollkorn',
  'Arvo',
  'Bitter',
  'Cardo',
  'Domine',
  'Neuton',
  'Old Standard TT',
  'Alegreya',
  'Gentium Book Plus',
  'Quando',
  'Eczar',
  'Trocchi',
  'Cinzel',
  'EB Garamond',
  'Zilla Slab',
  'Rokkitt',
  'Source Serif Pro'
]

// Display Fonts (headlines and branding)
export const DISPLAY_FONTS = [
  'Bebas Neue',
  'Righteous',
  'Alfa Slab One',
  'Abril Fatface',
  'Fredoka',
  'Permanent Marker',
  'Pacifico',
  'Caveat',
  'Dancing Script',
  'Lobster',
  'Anton',
  'Bangers',
  'Bungee',
  'Staatliches',
  'Russo One',
  'Monoton',
  'Press Start 2P',
  'Patua One',
  'Titan One',
  'Audiowide',
  'Fugaz One',
  'Saira Stencil One',
  'Nabla',
  'Lilita One',
  'Passion One'
]

// Monospace Fonts (code and technical)
export const MONOSPACE_FONTS = [
  'Roboto Mono',
  'Source Code Pro',
  'JetBrains Mono',
  'Fira Code',
  'Inconsolata',
  'IBM Plex Mono',
  'Ubuntu Mono',
  'Space Mono',
  'Courier Prime',
  'Anonymous Pro',
  'Overpass Mono',
  'PT Mono',
  'VT323',
  'Major Mono Display',
  'Azeret Mono',
  'Red Hat Mono'
]

// Handwriting Fonts (personal touch)
export const HANDWRITING_FONTS = [
  'Caveat',
  'Dancing Script',
  'Pacifico',
  'Satisfy',
  'Shadows Into Light',
  'Kalam',
  'Permanent Marker',
  'Patrick Hand',
  'Indie Flower',
  'Amatic SC',
  'Reenie Beanie',
  'Gloria Hallelujah',
  'Homemade Apple',
  'Covered By Your Grace',
  'Just Another Hand',
  'Gochi Hand'
]

// Trending Fonts (2024-2025)
export const TRENDING_FONTS = [
  'Plus Jakarta Sans',
  'Space Grotesk',
  'Sora',
  'Epilogue',
  'Manrope',
  'DM Sans',
  'Outfit',
  'Urbanist',
  'Work Sans',
  'Figtree',
  'Jost',
  'Lexend',
  'Be Vietnam Pro',
  'Bricolage Grotesque',
  'Onest',
  'Nunito Sans'
]

// All categories
export const FONT_CATEGORIES: FontCategory[] = [
  { name: 'Popular', fonts: SANS_SERIF_FONTS.slice(0, 20) },
  { name: 'Sans Serif', fonts: SANS_SERIF_FONTS },
  { name: 'Serif', fonts: SERIF_FONTS },
  { name: 'Display', fonts: DISPLAY_FONTS },
  { name: 'Monospace', fonts: MONOSPACE_FONTS },
  { name: 'Handwriting', fonts: HANDWRITING_FONTS },
  { name: 'Trending', fonts: TRENDING_FONTS }
]

// Get all unique fonts
export function getAllFonts(): string[] {
  const allFonts = new Set<string>()
  FONT_CATEGORIES.forEach(category => {
    category.fonts.forEach(font => allFonts.add(font))
  })
  return Array.from(allFonts).sort()
}

// Search fonts by name
export function searchFonts(query: string, limit: number = 50): string[] {
  if (!query.trim()) return SANS_SERIF_FONTS.slice(0, limit)

  const normalizedQuery = query.toLowerCase()
  const allFonts = getAllFonts()

  return allFonts
    .filter(font => font.toLowerCase().includes(normalizedQuery))
    .slice(0, limit)
}

// Get fonts by category name
export function getFontsByCategory(categoryName: string): string[] {
  const category = FONT_CATEGORIES.find(
    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
  )
  return category ? category.fonts : []
}

// Get category for a font
export function getFontCategory(fontName: string): string | null {
  for (const category of FONT_CATEGORIES) {
    if (category.fonts.includes(fontName)) {
      return category.name
    }
  }
  return null
}
