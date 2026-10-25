/**
 * Canonical Bangladesh Mobile Number Validation & Normalization
 *
 * Requirements:
 * - agent.md §4.2: Phone Number Standard: All phone numbers must conform to E.164 format: +8801[3-9]\d{8}.
 * - database.md §8.13: Canonical form: E.164 +8801[3-9]XXXXXXXX (13 chars total).
 * - quality-checklist.md CHK-CHK-05:
 *   Valid: 017..., 018..., 019..., 013..., 014..., 016..., 015... (11 digits, with or without +88).
 *   Invalid: 012..., 10 digits, 12 digits, non-digits.
 *   Fails with: "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন"
 */

export interface PhoneValidationResult {
  isValid: boolean
  canonical?: string
  formattedLocal?: string
  errorEn?: string
  errorBn?: string
}

const BD_PHONE_REGEX = /^\+8801[3-9]\d{8}$/
const LOCAL_OPERATOR_PREFIXES = ['013', '014', '015', '016', '017', '018', '019']

export function validateAndNormalizeBdPhone(rawPhone: string | null | undefined): PhoneValidationResult {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return {
      isValid: false,
      errorEn: 'Phone number is required.',
      errorBn: 'মোবাইল নম্বর আবশ্যক।',
    }
  }

  // 1. Strip spaces, dashes, parentheses, dots
  let cleaned = rawPhone.trim().replace(/[\s\-\(\)\.]/g, '')

  // 2. Normalize to canonical +8801...
  if (cleaned.startsWith('+88')) {
    cleaned = cleaned.slice(3)
  } else if (cleaned.startsWith('88')) {
    cleaned = cleaned.slice(2)
  }

  // If it starts with leading zero (e.g. 017...)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1)
  }

  // At this point, cleaned should be 10 digits starting with 1[3-9] (e.g. 17XXXXXXXX)
  if (!/^\d+$/.test(cleaned)) {
    return {
      isValid: false,
      errorEn: 'Phone number must contain only numbers.',
      errorBn: 'মোবাইল নম্বরে শুধুমাত্র সংখ্যা ব্যবহার করুন।',
    }
  }

  if (cleaned.length !== 10) {
    return {
      isValid: false,
      errorEn: 'Please enter a valid 11-digit Bangladesh mobile number.',
      errorBn: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন',
    }
  }

  const prefix = '0' + cleaned.slice(0, 2)
  if (!LOCAL_OPERATOR_PREFIXES.includes(prefix)) {
    return {
      isValid: false,
      errorEn: `Invalid mobile operator prefix '${prefix}'. Must start with 013, 014, 015, 016, 017, 018, or 019.`,
      errorBn: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন',
    }
  }

  const canonical = `+880${cleaned}`
  const formattedLocal = `0${cleaned}`

  if (!BD_PHONE_REGEX.test(canonical)) {
    return {
      isValid: false,
      errorEn: 'Invalid Bangladesh mobile number format.',
      errorBn: 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন',
    }
  }

  return {
    isValid: true,
    canonical,
    formattedLocal,
  }
}

/**
 * Convenience helper to return canonical phone or throw/return null
 */
export function normalizeBdPhone(rawPhone: string | null | undefined): string | null {
  const res = validateAndNormalizeBdPhone(rawPhone)
  return res.isValid && res.canonical ? res.canonical : null
}
