/**
 * Content, Theme Tokens, Contrast Ratio & Block Validation
 * Enforces PRD FR-5.1.1, FR-9.2, FR-9.3, FR-9.6, AC-5.2, AC-5.3, AC-9.1, architecture §16.3, database.md §6.6
 */

export interface ThemeTokens {
  primary_color?: string
  background_color?: string
  text_color?: string
  accent_color?: string
  font_family_latin?: string
  font_family_bangla?: string
  border_radius?: string
  [key: string]: any
}

/**
 * Calculates relative luminance of an sRGB color hex string.
 * W3C WCAG 2.1 algorithm.
 */
export function getRelativeLuminance(hex: string): number {
  const sanitized = hex.replace('#', '').trim()
  if (sanitized.length !== 6 && sanitized.length !== 3) {
    return 0.5 // Default fallback
  }

  const r = parseInt(sanitized.length === 3 ? sanitized[0] + sanitized[0] : sanitized.substring(0, 2), 16) / 255
  const g = parseInt(sanitized.length === 3 ? sanitized[1] + sanitized[1] : sanitized.substring(2, 4), 16) / 255
  const b = parseInt(sanitized.length === 3 ? sanitized[2] + sanitized[2] : sanitized.substring(4, 6), 16) / 255

  const transform = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))

  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b)
}

/**
 * Computes WCAG contrast ratio between two hex colors.
 * Returns a number between 1 and 21.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1)
  const lum2 = getRelativeLuminance(hex2)
  const brightest = Math.max(lum1, lum2)
  const darkest = Math.min(lum1, lum2)
  return (brightest + 0.05) / (darkest + 0.05)
}

/**
 * Validates theme tokens for WCAG AA readability and prohibits raw custom CSS injection.
 */
export function validateThemeTokens(tokens: ThemeTokens | null | undefined): {
  valid: boolean
  contrastRatio?: number
  error?: string
} {
  if (!tokens) return { valid: true }

  // Reject raw custom CSS (stored XSS prevention)
  if (tokens.custom_css || (tokens as any).raw_css || (tokens as any).css) {
    return {
      valid: false,
      error: 'Arbitrary custom CSS is prohibited for security. Use controlled design tokens only.',
    }
  }

  const text = tokens.text_color || '#111827'
  const bg = tokens.background_color || '#ffffff'

  if (tokens.text_color && tokens.background_color) {
    const ratio = getContrastRatio(text, bg)
    // WCAG AA requirement for normal text is 4.5:1
    if (ratio < 4.5) {
      return {
        valid: false,
        contrastRatio: Number(ratio.toFixed(2)),
        error: `Insufficient text/background contrast ratio: ${ratio.toFixed(2)}:1 (minimum 4.5:1 required by WCAG AA).`,
      }
    }
    return { valid: true, contrastRatio: Number(ratio.toFixed(2)) }
  }

  return { valid: true }
}

/**
 * Validates sections JSON to prevent XSS payloads and ensure block integrity.
 */
export function validateSectionsJson(sections: any): { valid: boolean; error?: string } {
  if (!Array.isArray(sections)) {
    return { valid: false, error: 'sections_json must be an array of section blocks.' }
  }

  const jsonString = JSON.stringify(sections)
  // Check for dangerous scripts or inline handlers
  if (/<script\b|javascript:|on\w+\s*=/i.test(jsonString)) {
    return { valid: false, error: 'Malicious scripts or inline event handlers are strictly disallowed in content blocks.' }
  }

  // Ensure each block has a valid section_type
  const ALLOWED_SECTION_TYPES = [
    'hero',
    'product_showcase',
    'offer_bundles',
    'features_grid',
    'reviews_carousel',
    'faq_accordion',
    'trust_badges',
    'embedded_checkout',
    'banner',
  ]

  for (const [index, section] of sections.entries()) {
    if (!section || typeof section !== 'object') {
      return { valid: false, error: `Section at index ${index} must be an object.` }
    }
    if (!section.section_type || !ALLOWED_SECTION_TYPES.includes(section.section_type)) {
      return {
        valid: false,
        error: `Section at index ${index} has invalid section_type "${section.section_type}". Allowed types: ${ALLOWED_SECTION_TYPES.join(', ')}.`,
      }
    }
  }

  return { valid: true }
}
