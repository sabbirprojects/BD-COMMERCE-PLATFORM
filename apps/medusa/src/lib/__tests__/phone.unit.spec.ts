import { validateAndNormalizeBdPhone, normalizeBdPhone } from "../phone"

describe("Bangladesh Phone Validation & Normalization (CHK-CHK-05)", () => {
  it("normalizes valid 11-digit local mobile numbers to canonical E.164 (+8801...)", () => {
    const validLocal = [
      { input: "01712345678", expected: "+8801712345678" },
      { input: "01812345678", expected: "+8801812345678" },
      { input: "01912345678", expected: "+8801912345678" },
      { input: "01312345678", expected: "+8801312345678" },
      { input: "01412345678", expected: "+8801412345678" },
      { input: "01612345678", expected: "+8801612345678" },
      { input: "01512345678", expected: "+8801512345678" },
    ]

    for (const { input, expected } of validLocal) {
      const res = validateAndNormalizeBdPhone(input)
      expect(res.isValid).toBe(true)
      expect(res.canonical).toBe(expected)
      expect(res.formattedLocal).toBe(input)
      expect(normalizeBdPhone(input)).toBe(expected)
    }
  })

  it("handles valid numbers with spaces, dashes, or +88 prefix", () => {
    expect(normalizeBdPhone("+8801712345678")).toBe("+8801712345678")
    expect(normalizeBdPhone("8801712345678")).toBe("+8801712345678")
    expect(normalizeBdPhone("017-1234-5678")).toBe("+8801712345678")
    expect(normalizeBdPhone("017 1234 5678")).toBe("+8801712345678")
    expect(normalizeBdPhone("+88 017 1234 5678")).toBe("+8801712345678")
  })

  it("rejects invalid 012 prefix (CHK-CHK-05 passing criteria)", () => {
    const res = validateAndNormalizeBdPhone("01234567890")
    expect(res.isValid).toBe(false)
    expect(res.errorBn).toBe("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন")
    expect(normalizeBdPhone("01234567890")).toBeNull()
  })

  it("rejects invalid lengths (10 digits, 12 digits)", () => {
    const res10 = validateAndNormalizeBdPhone("0171234567")
    expect(res10.isValid).toBe(false)
    expect(res10.errorBn).toBe("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন")

    const res12 = validateAndNormalizeBdPhone("017123456789")
    expect(res12.isValid).toBe(false)
    expect(res12.errorBn).toBe("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন")
  })

  it("rejects non-numeric characters and empty inputs", () => {
    expect(validateAndNormalizeBdPhone("0171234abcd").isValid).toBe(false)
    expect(validateAndNormalizeBdPhone("").isValid).toBe(false)
    expect(validateAndNormalizeBdPhone(null).isValid).toBe(false)
    expect(validateAndNormalizeBdPhone(undefined).isValid).toBe(false)
  })
})
