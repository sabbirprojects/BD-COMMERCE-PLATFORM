import { toMajor, toPaisa } from "../money"

describe("money conversion boundary", () => {
  it("converts ৳2500.00 major units to 250000 paisa", () => {
    expect(toPaisa(2500)).toBe(250000)
    expect(toPaisa("2500.00")).toBe(250000)
  })

  it("converts 250000 paisa back to ৳2500.00 major units", () => {
    expect(toMajor(250000)).toBe(2500)
  })

  it("rounds ROUND_HALF_UP when the paisa value is fractional", () => {
    expect(toPaisa(1.005)).toBe(101)
    expect(toPaisa(1.004)).toBe(100)
    expect(toPaisa(0.015)).toBe(2)
    expect(toPaisa(0.014)).toBe(1)
  })

  it("avoids float drift on decimal strings", () => {
    expect(toPaisa("19.99")).toBe(1999)
    expect(toPaisa("0.1")).toBe(10)
  })

  it("round-trips common BDT amounts", () => {
    for (const major of [0, 0.5, 60, 100, 130, 1499.99, 2500]) {
      expect(toMajor(toPaisa(major))).toBe(major)
    }
  })
})
