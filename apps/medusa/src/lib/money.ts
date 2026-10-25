/**
 * Canonical money conversion boundary (database.md §1.6).
 *
 * Hard rule: Medusa core tables store BDT **major units** (৳2,500.00 → 2500),
 * custom Bangladesh tables store integer **paisa** (৳2,500.00 → 250000).
 * Every conversion between the two representations must happen here and
 * nowhere else.
 */
import BigNumber from "bignumber.js"

/** Accepts Medusa raw money values, bignumber.js instances, numbers, or numeric strings. */
export type BigNumberInput = BigNumber.Value | number | string

const PAISA_PER_MAJOR = 100

/**
 * Major BDT units → integer paisa, rounded ROUND_HALF_UP.
 *
 * @example toPaisa(2500) === 250000
 * @example toPaisa("2500.00") === 250000
 */
export function toPaisa(major: BigNumberInput): number {
  return new BigNumber(major)
    .times(PAISA_PER_MAJOR)
    .decimalPlaces(0, BigNumber.ROUND_HALF_UP)
    .toNumber()
}

/**
 * Integer paisa → major BDT units (2-dp capable representation).
 *
 * @example toMajor(250000) === 2500
 */
export function toMajor(paisa: number): number {
  return new BigNumber(paisa).dividedBy(PAISA_PER_MAJOR).toNumber()
}
