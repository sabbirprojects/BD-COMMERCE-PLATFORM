/**
 * One-off generator: transforms the Open Admin Data BD dataset
 * (CC-BY-4.0, github.com/open-admin-data/bangladesh-administrative-divisions)
 * into the vendored seed file src/scripts/seed/geo-data.ts.
 *
 * Canonical codes per database.md §3.8:
 *   division: BD-XXX          (e.g. BD-DHK)
 *   district: BD-XXX-YYY      (e.g. BD-DHK-GAZ)
 *   thana:    BD-XXX-YYY-ZZZ  (e.g. BD-DHK-GAZ-KAL)
 *
 * Run: node .geo-tmp/gen-geo.js
 */
const fs = require("fs");
const path = require("path");

const divisions = JSON.parse(fs.readFileSync(path.join(__dirname, "divisions.json"), "utf8"));
const districts = JSON.parse(fs.readFileSync(path.join(__dirname, "districts.json"), "utf8"));
const upazilas = JSON.parse(fs.readFileSync(path.join(__dirname, "upazilas.json"), "utf8"));

// Division 3-letter codes (stable, hand-assigned).
const DIV_CODES = {
  BD10: "BAR", // Barishal
  BD20: "CTG", // Chattogram
  BD30: "DHK", // Dhaka
  BD40: "KHU", // Khulna
  BD45: "MYM", // Mymensingh
  BD50: "RAJ", // Rajshahi
  BD55: "RNG", // Rangpur
  BD60: "SYL", // Sylhet
};

// District 3-letter codes (stable, hand-assigned, globally unique).
const DISTRICT_CODES = {
  // Barishal (6)
  Barguna: "BRG", Barishal: "BAR", Bhola: "BHO", Jhalokati: "JHA",
  Patuakhali: "PAT", Pirojpur: "PIR",
  // Chattogram (11)
  Bandarban: "BAN", Brahmanbaria: "BRA", Chandpur: "CHA", Chattogram: "CTG",
  Cumilla: "CUM", "Cox's Bazar": "COX", Feni: "FEN", Khagrachhari: "KHA",
  Lakshmipur: "LAK", Noakhali: "NOA", Rangamati: "RAN",
  // Dhaka (13)
  Dhaka: "DHA", Faridpur: "FAR", Gazipur: "GAZ", Gopalganj: "GOP",
  Kishoreganj: "KIS", Madaripur: "MAD", Manikganj: "MAN", Munshiganj: "MUN",
  Narayanganj: "NAR", Narsingdi: "NRS", Rajbari: "RBJ", Shariatpur: "SHA",
  Tangail: "TAN",
  // Khulna (10)
  Bagerhat: "BAG", Chuadanga: "CHU", Jashore: "JES", Jhenaidah: "JHE",
  Khulna: "KHU", Kushtia: "KUS", Magura: "MAG", Meherpur: "MEH",
  Narail: "NRL", Satkhira: "SAT",
  // Mymensingh (4)
  Jamalpur: "JAM", Mymensingh: "MYM", Netrokona: "NET", Sherpur: "SHE",
  // Rajshahi (8)
  Bogura: "BOG", Chapainawabganj: "CNB", Joypurhat: "JOY", Naogaon: "NAO",
  Natore: "NAT", Pabna: "PAB", Rajshahi: "RAJ", Sirajganj: "SIR",
  // Rangpur (8)
  Dinajpur: "DIN", Gaibandha: "GAI", Kurigram: "KUR", Lalmonirhat: "LAL",
  Nilphamari: "NIL", Panchagarh: "PAN", Rangpur: "RNG", Thakurgaon: "THA",
  // Sylhet (4)
  Habiganj: "HAB", Moulvibazar: "MOU", Sunamganj: "SUN", Sylhet: "SYL",
};

/** Deterministic 3-letter code from an English name, unique within a district. */
function thanaCode(nameEn, taken) {
  const clean = nameEn.toUpperCase().replace(/[^A-Z]/g, "");
  const candidates = [];
  if (clean.length >= 3) {
    candidates.push(clean.slice(0, 3));
    candidates.push(clean.slice(0, 2) + clean[clean.length - 1]);
    candidates.push(clean[0] + clean.slice(clean.length - 2));
  }
  for (let i = 0; i < 26 && clean.length >= 2; i++) {
    candidates.push(clean.slice(0, 2) + String.fromCharCode(65 + i));
  }
  if (clean.length === 2) candidates.push(clean + "X");
  for (const c of candidates) {
    if (!taken.has(c)) return c;
  }
  throw new Error(`Cannot derive code for ${nameEn}`);
}

const divs = divisions.map((d) => ({
  code: `BD-${DIV_CODES[d.id]}`,
  name_en: d.name.en,
  name_bn: d.name.local,
  bbs_code: d.id,
  sort_order: d.sort_order,
}));

const dists = districts.map((d) => ({
  code: `BD-${DIV_CODES[d.parent.id]}-${DISTRICT_CODES[d.name.en]}`,
  division_code: `BD-${DIV_CODES[d.parent.id]}`,
  name_en: d.name.en,
  name_bn: d.name.local,
  bbs_code: d.id,
}));

const distByParent = new Map(districts.map((d) => [d.id, d]));
const thanas = [];
for (const u of upazilas) {
  const dist = distByParent.get(u.parent.id);
  const districtCode = `BD-${DIV_CODES[dist.parent.id]}-${DISTRICT_CODES[dist.name.en]}`;
  const taken = new Set(thanas.filter((t) => t.district_code === districtCode).map((t) => t.code.split("-")[3]));
  const code = thanaCode(u.name.en, taken);
  thanas.push({
    code: `${districtCode}-${code}`,
    district_code: districtCode,
    name_en: u.name.en,
    name_bn: u.name.local,
    bbs_code: u.id,
    postal_codes: u.zip_codes || null,
  });
}

// Sanity checks
const allDistrictCodes = new Set(dists.map((d) => d.code));
if (allDistrictCodes.size !== 64) throw new Error("district code collision");
const allThanaCodes = new Set(thanas.map((t) => t.code));
if (allThanaCodes.size !== thanas.length) throw new Error("thana code collision");
for (const t of thanas) {
  if (!allDistrictCodes.has(t.district_code)) throw new Error(`thana ${t.code} unknown district`);
}

const out = `/**
 * Vendored Bangladesh geo master (divisions, districts, thanas/upazilas).
 *
 * Source dataset: Open Admin Data — Bangladesh Administrative Divisions
 * (CC-BY-4.0) https://github.com/open-admin-data/bangladesh-administrative-divisions
 * 8 divisions, 64 districts, 495 upazilas; bilingual (BN/EN), postal codes.
 * \`bbs_code\` holds the source dataset id (e.g. "BD1004") for reconciliation;
 * canonical internal codes are the \`code\` fields (database.md §3.8).
 *
 * DO NOT EDIT BY HAND — regenerate with .geo-tmp/gen-geo.js after updating
 * the source JSON files.
 */

export interface GeoDivisionSeed {
  code: string
  name_en: string
  name_bn: string
  bbs_code: string
  sort_order: number
}

export interface GeoDistrictSeed {
  code: string
  division_code: string
  name_en: string
  name_bn: string
  bbs_code: string
}

export interface GeoThanaSeed {
  code: string
  district_code: string
  name_en: string
  name_bn: string
  bbs_code: string
  postal_codes: string[] | null
}

export const GEO_DIVISIONS: GeoDivisionSeed[] = ${JSON.stringify(divs, null, 2)}

export const GEO_DISTRICTS: GeoDistrictSeed[] = ${JSON.stringify(dists, null, 2)}

export const GEO_THANAS: GeoThanaSeed[] = ${JSON.stringify(thanas, null, 2)}
`;

fs.writeFileSync(
  path.join(__dirname, "..", "src", "scripts", "seed", "geo-data.ts"),
  out
);
console.log(`wrote ${divs.length} divisions, ${dists.length} districts, ${thanas.length} thanas`);
