/**
 * Vendored Bangladesh geo master (divisions, districts, thanas/upazilas).
 *
 * Source dataset: Open Admin Data — Bangladesh Administrative Divisions
 * (CC-BY-4.0) https://github.com/open-admin-data/bangladesh-administrative-divisions
 * 8 divisions, 64 districts, 495 upazilas; bilingual (BN/EN), postal codes.
 * `bbs_code` holds the source dataset id (e.g. "BD1004") for reconciliation;
 * canonical internal codes are the `code` fields (database.md §3.8).
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

export const GEO_DIVISIONS: GeoDivisionSeed[] = [
  {
    "code": "BD-BAR",
    "name_en": "Barishal",
    "name_bn": "বরিশাল",
    "bbs_code": "BD10",
    "sort_order": 1
  },
  {
    "code": "BD-CTG",
    "name_en": "Chattogram",
    "name_bn": "চট্টগ্রাম",
    "bbs_code": "BD20",
    "sort_order": 2
  },
  {
    "code": "BD-DHK",
    "name_en": "Dhaka",
    "name_bn": "ঢাকা",
    "bbs_code": "BD30",
    "sort_order": 3
  },
  {
    "code": "BD-KHU",
    "name_en": "Khulna",
    "name_bn": "খুলনা",
    "bbs_code": "BD40",
    "sort_order": 4
  },
  {
    "code": "BD-MYM",
    "name_en": "Mymensingh",
    "name_bn": "ময়মনসিংহ",
    "bbs_code": "BD45",
    "sort_order": 5
  },
  {
    "code": "BD-RAJ",
    "name_en": "Rajshahi",
    "name_bn": "রাজশাহী",
    "bbs_code": "BD50",
    "sort_order": 6
  },
  {
    "code": "BD-RNG",
    "name_en": "Rangpur",
    "name_bn": "রংপুর",
    "bbs_code": "BD55",
    "sort_order": 7
  },
  {
    "code": "BD-SYL",
    "name_en": "Sylhet",
    "name_bn": "সিলেট",
    "bbs_code": "BD60",
    "sort_order": 8
  }
]

export const GEO_DISTRICTS: GeoDistrictSeed[] = [
  {
    "code": "BD-BAR-BRG",
    "division_code": "BD-BAR",
    "name_en": "Barguna",
    "name_bn": "বরগুনা",
    "bbs_code": "BD1004"
  },
  {
    "code": "BD-BAR-BAR",
    "division_code": "BD-BAR",
    "name_en": "Barishal",
    "name_bn": "বরিশাল",
    "bbs_code": "BD1006"
  },
  {
    "code": "BD-BAR-BHO",
    "division_code": "BD-BAR",
    "name_en": "Bhola",
    "name_bn": "ভোলা",
    "bbs_code": "BD1009"
  },
  {
    "code": "BD-BAR-JHA",
    "division_code": "BD-BAR",
    "name_en": "Jhalokati",
    "name_bn": "ঝালকাঠি",
    "bbs_code": "BD1042"
  },
  {
    "code": "BD-BAR-PAT",
    "division_code": "BD-BAR",
    "name_en": "Patuakhali",
    "name_bn": "পটুয়াখালী",
    "bbs_code": "BD1078"
  },
  {
    "code": "BD-BAR-PIR",
    "division_code": "BD-BAR",
    "name_en": "Pirojpur",
    "name_bn": "পিরোজপুর",
    "bbs_code": "BD1079"
  },
  {
    "code": "BD-CTG-BAN",
    "division_code": "BD-CTG",
    "name_en": "Bandarban",
    "name_bn": "বান্দরবান",
    "bbs_code": "BD2003"
  },
  {
    "code": "BD-CTG-BRA",
    "division_code": "BD-CTG",
    "name_en": "Brahmanbaria",
    "name_bn": "ব্রাহ্মণবাড়ীয়া",
    "bbs_code": "BD2012"
  },
  {
    "code": "BD-CTG-CHA",
    "division_code": "BD-CTG",
    "name_en": "Chandpur",
    "name_bn": "চাঁদপুর",
    "bbs_code": "BD2013"
  },
  {
    "code": "BD-CTG-CTG",
    "division_code": "BD-CTG",
    "name_en": "Chattogram",
    "name_bn": "চট্টগ্রাম",
    "bbs_code": "BD2015"
  },
  {
    "code": "BD-CTG-CUM",
    "division_code": "BD-CTG",
    "name_en": "Cumilla",
    "name_bn": "কুমিল্লা",
    "bbs_code": "BD2019"
  },
  {
    "code": "BD-CTG-COX",
    "division_code": "BD-CTG",
    "name_en": "Cox's Bazar",
    "name_bn": "কক্সবাজার",
    "bbs_code": "BD2022"
  },
  {
    "code": "BD-CTG-FEN",
    "division_code": "BD-CTG",
    "name_en": "Feni",
    "name_bn": "ফেনী",
    "bbs_code": "BD2030"
  },
  {
    "code": "BD-CTG-KHA",
    "division_code": "BD-CTG",
    "name_en": "Khagrachhari",
    "name_bn": "খাগড়াছড়ি",
    "bbs_code": "BD2046"
  },
  {
    "code": "BD-CTG-LAK",
    "division_code": "BD-CTG",
    "name_en": "Lakshmipur",
    "name_bn": "লক্ষ্মীপুর",
    "bbs_code": "BD2051"
  },
  {
    "code": "BD-CTG-NOA",
    "division_code": "BD-CTG",
    "name_en": "Noakhali",
    "name_bn": "নোয়াখালী",
    "bbs_code": "BD2075"
  },
  {
    "code": "BD-CTG-RAN",
    "division_code": "BD-CTG",
    "name_en": "Rangamati",
    "name_bn": "রাঙ্গামাটি",
    "bbs_code": "BD2084"
  },
  {
    "code": "BD-DHK-DHA",
    "division_code": "BD-DHK",
    "name_en": "Dhaka",
    "name_bn": "ঢাকা",
    "bbs_code": "BD3026"
  },
  {
    "code": "BD-DHK-FAR",
    "division_code": "BD-DHK",
    "name_en": "Faridpur",
    "name_bn": "ফরিদপুর",
    "bbs_code": "BD3029"
  },
  {
    "code": "BD-DHK-GAZ",
    "division_code": "BD-DHK",
    "name_en": "Gazipur",
    "name_bn": "গাজীপুর",
    "bbs_code": "BD3033"
  },
  {
    "code": "BD-DHK-GOP",
    "division_code": "BD-DHK",
    "name_en": "Gopalganj",
    "name_bn": "গোপালগঞ্জ",
    "bbs_code": "BD3035"
  },
  {
    "code": "BD-DHK-KIS",
    "division_code": "BD-DHK",
    "name_en": "Kishoreganj",
    "name_bn": "কিশোরগঞ্জ",
    "bbs_code": "BD3048"
  },
  {
    "code": "BD-DHK-MAD",
    "division_code": "BD-DHK",
    "name_en": "Madaripur",
    "name_bn": "মাদারীপুর",
    "bbs_code": "BD3054"
  },
  {
    "code": "BD-DHK-MAN",
    "division_code": "BD-DHK",
    "name_en": "Manikganj",
    "name_bn": "মানিকগঞ্জ",
    "bbs_code": "BD3056"
  },
  {
    "code": "BD-DHK-MUN",
    "division_code": "BD-DHK",
    "name_en": "Munshiganj",
    "name_bn": "মুন্সিগঞ্জ",
    "bbs_code": "BD3059"
  },
  {
    "code": "BD-DHK-NAR",
    "division_code": "BD-DHK",
    "name_en": "Narayanganj",
    "name_bn": "নারায়ণগঞ্জ",
    "bbs_code": "BD3067"
  },
  {
    "code": "BD-DHK-NRS",
    "division_code": "BD-DHK",
    "name_en": "Narsingdi",
    "name_bn": "নরসিংদী",
    "bbs_code": "BD3068"
  },
  {
    "code": "BD-DHK-RBJ",
    "division_code": "BD-DHK",
    "name_en": "Rajbari",
    "name_bn": "রাজবাড়ী",
    "bbs_code": "BD3082"
  },
  {
    "code": "BD-DHK-SHA",
    "division_code": "BD-DHK",
    "name_en": "Shariatpur",
    "name_bn": "শরিয়তপুর",
    "bbs_code": "BD3086"
  },
  {
    "code": "BD-DHK-TAN",
    "division_code": "BD-DHK",
    "name_en": "Tangail",
    "name_bn": "টাঙ্গাইল",
    "bbs_code": "BD3093"
  },
  {
    "code": "BD-KHU-BAG",
    "division_code": "BD-KHU",
    "name_en": "Bagerhat",
    "name_bn": "বাগেরহাট",
    "bbs_code": "BD4001"
  },
  {
    "code": "BD-KHU-CHU",
    "division_code": "BD-KHU",
    "name_en": "Chuadanga",
    "name_bn": "চুয়াডাঙ্গা",
    "bbs_code": "BD4018"
  },
  {
    "code": "BD-KHU-JES",
    "division_code": "BD-KHU",
    "name_en": "Jashore",
    "name_bn": "যশোর",
    "bbs_code": "BD4041"
  },
  {
    "code": "BD-KHU-JHE",
    "division_code": "BD-KHU",
    "name_en": "Jhenaidah",
    "name_bn": "ঝিনাইদহ",
    "bbs_code": "BD4044"
  },
  {
    "code": "BD-KHU-KHU",
    "division_code": "BD-KHU",
    "name_en": "Khulna",
    "name_bn": "খুলনা",
    "bbs_code": "BD4047"
  },
  {
    "code": "BD-KHU-KUS",
    "division_code": "BD-KHU",
    "name_en": "Kushtia",
    "name_bn": "কুষ্টিয়া",
    "bbs_code": "BD4050"
  },
  {
    "code": "BD-KHU-MAG",
    "division_code": "BD-KHU",
    "name_en": "Magura",
    "name_bn": "মাগুরা",
    "bbs_code": "BD4055"
  },
  {
    "code": "BD-KHU-MEH",
    "division_code": "BD-KHU",
    "name_en": "Meherpur",
    "name_bn": "মেহেরপুর",
    "bbs_code": "BD4057"
  },
  {
    "code": "BD-KHU-NRL",
    "division_code": "BD-KHU",
    "name_en": "Narail",
    "name_bn": "নড়াইল",
    "bbs_code": "BD4065"
  },
  {
    "code": "BD-KHU-SAT",
    "division_code": "BD-KHU",
    "name_en": "Satkhira",
    "name_bn": "সাতক্ষীরা",
    "bbs_code": "BD4087"
  },
  {
    "code": "BD-MYM-JAM",
    "division_code": "BD-MYM",
    "name_en": "Jamalpur",
    "name_bn": "জামালপুর",
    "bbs_code": "BD4539"
  },
  {
    "code": "BD-MYM-MYM",
    "division_code": "BD-MYM",
    "name_en": "Mymensingh",
    "name_bn": "ময়মনসিংহ",
    "bbs_code": "BD4561"
  },
  {
    "code": "BD-MYM-undefined",
    "division_code": "BD-MYM",
    "name_en": "Netrakona",
    "name_bn": "নেত্রকোনা",
    "bbs_code": "BD4572"
  },
  {
    "code": "BD-MYM-SHE",
    "division_code": "BD-MYM",
    "name_en": "Sherpur",
    "name_bn": "শেরপুর",
    "bbs_code": "BD4589"
  },
  {
    "code": "BD-RAJ-BOG",
    "division_code": "BD-RAJ",
    "name_en": "Bogura",
    "name_bn": "বগুড়া",
    "bbs_code": "BD5010"
  },
  {
    "code": "BD-RAJ-JOY",
    "division_code": "BD-RAJ",
    "name_en": "Joypurhat",
    "name_bn": "জয়পুরহাট",
    "bbs_code": "BD5038"
  },
  {
    "code": "BD-RAJ-NAO",
    "division_code": "BD-RAJ",
    "name_en": "Naogaon",
    "name_bn": "নওগাঁ",
    "bbs_code": "BD5064"
  },
  {
    "code": "BD-RAJ-NAT",
    "division_code": "BD-RAJ",
    "name_en": "Natore",
    "name_bn": "নাটোর",
    "bbs_code": "BD5069"
  },
  {
    "code": "BD-RAJ-undefined",
    "division_code": "BD-RAJ",
    "name_en": "Chapainababganj",
    "name_bn": "চাঁপাইনবাবগঞ্জ",
    "bbs_code": "BD5070"
  },
  {
    "code": "BD-RAJ-PAB",
    "division_code": "BD-RAJ",
    "name_en": "Pabna",
    "name_bn": "পাবনা",
    "bbs_code": "BD5076"
  },
  {
    "code": "BD-RAJ-RAJ",
    "division_code": "BD-RAJ",
    "name_en": "Rajshahi",
    "name_bn": "রাজশাহী",
    "bbs_code": "BD5081"
  },
  {
    "code": "BD-RAJ-SIR",
    "division_code": "BD-RAJ",
    "name_en": "Sirajganj",
    "name_bn": "সিরাজগঞ্জ",
    "bbs_code": "BD5088"
  },
  {
    "code": "BD-RNG-DIN",
    "division_code": "BD-RNG",
    "name_en": "Dinajpur",
    "name_bn": "দিনাজপুর",
    "bbs_code": "BD5527"
  },
  {
    "code": "BD-RNG-GAI",
    "division_code": "BD-RNG",
    "name_en": "Gaibandha",
    "name_bn": "গাইবান্ধা",
    "bbs_code": "BD5532"
  },
  {
    "code": "BD-RNG-KUR",
    "division_code": "BD-RNG",
    "name_en": "Kurigram",
    "name_bn": "কুড়িগ্রাম",
    "bbs_code": "BD5549"
  },
  {
    "code": "BD-RNG-LAL",
    "division_code": "BD-RNG",
    "name_en": "Lalmonirhat",
    "name_bn": "লালমনিরহাট",
    "bbs_code": "BD5552"
  },
  {
    "code": "BD-RNG-NIL",
    "division_code": "BD-RNG",
    "name_en": "Nilphamari",
    "name_bn": "নীলফামারী",
    "bbs_code": "BD5573"
  },
  {
    "code": "BD-RNG-PAN",
    "division_code": "BD-RNG",
    "name_en": "Panchagarh",
    "name_bn": "পঞ্চগড়",
    "bbs_code": "BD5577"
  },
  {
    "code": "BD-RNG-RNG",
    "division_code": "BD-RNG",
    "name_en": "Rangpur",
    "name_bn": "রংপুর",
    "bbs_code": "BD5585"
  },
  {
    "code": "BD-RNG-THA",
    "division_code": "BD-RNG",
    "name_en": "Thakurgaon",
    "name_bn": "ঠাকুরগাঁও",
    "bbs_code": "BD5594"
  },
  {
    "code": "BD-SYL-HAB",
    "division_code": "BD-SYL",
    "name_en": "Habiganj",
    "name_bn": "হবিগঞ্জ",
    "bbs_code": "BD6036"
  },
  {
    "code": "BD-SYL-MOU",
    "division_code": "BD-SYL",
    "name_en": "Moulvibazar",
    "name_bn": "মৌলভীবাজার",
    "bbs_code": "BD6058"
  },
  {
    "code": "BD-SYL-SUN",
    "division_code": "BD-SYL",
    "name_en": "Sunamganj",
    "name_bn": "সুনামগঞ্জ",
    "bbs_code": "BD6090"
  },
  {
    "code": "BD-SYL-SYL",
    "division_code": "BD-SYL",
    "name_en": "Sylhet",
    "name_bn": "সিলেট",
    "bbs_code": "BD6091"
  }
]

export const GEO_THANAS: GeoThanaSeed[] = [
  {
    "code": "BD-CTG-BAN-ALI",
    "district_code": "BD-CTG-BAN",
    "name_en": "Alikadam",
    "name_bn": "আলীকদম",
    "bbs_code": "BD20030004",
    "postal_codes": [
      "4650"
    ]
  },
  {
    "code": "BD-CTG-BAN-BAN",
    "district_code": "BD-CTG-BAN",
    "name_en": "Bandarban Sadar",
    "name_bn": "বান্দরবান সদর",
    "bbs_code": "BD20030014",
    "postal_codes": [
      "4600"
    ]
  },
  {
    "code": "BD-CTG-BAN-LAM",
    "district_code": "BD-CTG-BAN",
    "name_en": "Lama",
    "name_bn": "লামা",
    "bbs_code": "BD20030051",
    "postal_codes": [
      "4640"
    ]
  },
  {
    "code": "BD-CTG-BAN-NAI",
    "district_code": "BD-CTG-BAN",
    "name_en": "Naikkhongchhari",
    "name_bn": "নাইক্ষ্যংছড়ি",
    "bbs_code": "BD20030073",
    "postal_codes": [
      "4660"
    ]
  },
  {
    "code": "BD-CTG-BAN-ROW",
    "district_code": "BD-CTG-BAN",
    "name_en": "Rowangchhari",
    "name_bn": "রোয়াংছড়ি",
    "bbs_code": "BD20030089",
    "postal_codes": [
      "4610"
    ]
  },
  {
    "code": "BD-CTG-BAN-RUM",
    "district_code": "BD-CTG-BAN",
    "name_en": "Ruma",
    "name_bn": "রুমা",
    "bbs_code": "BD20030091",
    "postal_codes": [
      "4620"
    ]
  },
  {
    "code": "BD-CTG-BAN-THA",
    "district_code": "BD-CTG-BAN",
    "name_en": "Thanchi",
    "name_bn": "থানচি",
    "bbs_code": "BD20030095",
    "postal_codes": [
      "4641"
    ]
  },
  {
    "code": "BD-CTG-BRA-AKH",
    "district_code": "BD-CTG-BRA",
    "name_en": "Akhaura",
    "name_bn": "আখাউড়া",
    "bbs_code": "BD20120002",
    "postal_codes": [
      "3450"
    ]
  },
  {
    "code": "BD-CTG-BRA-ASH",
    "district_code": "BD-CTG-BRA",
    "name_en": "Ashuganj",
    "name_bn": "আশুগঞ্জ",
    "bbs_code": "BD20120033",
    "postal_codes": [
      "3402"
    ]
  },
  {
    "code": "BD-CTG-BRA-BAN",
    "district_code": "BD-CTG-BRA",
    "name_en": "Banchharampur",
    "name_bn": "বাঞ্ছারামপুর",
    "bbs_code": "BD20120004",
    "postal_codes": [
      "3420"
    ]
  },
  {
    "code": "BD-CTG-BRA-BIJ",
    "district_code": "BD-CTG-BRA",
    "name_en": "Bijoynagar",
    "name_bn": "বিজয়নগর",
    "bbs_code": "BD20120007",
    "postal_codes": [
      "3470"
    ]
  },
  {
    "code": "BD-CTG-BRA-BRA",
    "district_code": "BD-CTG-BRA",
    "name_en": "Brahmanbaria Sadar",
    "name_bn": "ব্রাহ্মণবাড়িয়া সদর",
    "bbs_code": "BD20120013",
    "postal_codes": [
      "3402"
    ]
  },
  {
    "code": "BD-CTG-BRA-KAS",
    "district_code": "BD-CTG-BRA",
    "name_en": "Kasba",
    "name_bn": "কসবা",
    "bbs_code": "BD20120063",
    "postal_codes": [
      "3462"
    ]
  },
  {
    "code": "BD-CTG-BRA-NAB",
    "district_code": "BD-CTG-BRA",
    "name_en": "Nabinagar",
    "name_bn": "নবীনগর",
    "bbs_code": "BD20120085",
    "postal_codes": [
      "3419"
    ]
  },
  {
    "code": "BD-CTG-BRA-NAS",
    "district_code": "BD-CTG-BRA",
    "name_en": "Nasirnagar",
    "name_bn": "নাসিরনগর",
    "bbs_code": "BD20120090",
    "postal_codes": [
      "3441"
    ]
  },
  {
    "code": "BD-CTG-BRA-SAR",
    "district_code": "BD-CTG-BRA",
    "name_en": "Sarail",
    "name_bn": "সরাইল",
    "bbs_code": "BD20120094",
    "postal_codes": [
      "3432"
    ]
  },
  {
    "code": "BD-CTG-CHA-CHA",
    "district_code": "BD-CTG-CHA",
    "name_en": "Chandpur Sadar",
    "name_bn": "চাঁদপুর সদর",
    "bbs_code": "BD20130022",
    "postal_codes": [
      "3602"
    ]
  },
  {
    "code": "BD-CTG-CHA-FAR",
    "district_code": "BD-CTG-CHA",
    "name_en": "Faridganj",
    "name_bn": "ফরিদগঞ্জ",
    "bbs_code": "BD20130045",
    "postal_codes": [
      "3651"
    ]
  },
  {
    "code": "BD-CTG-CHA-HAI",
    "district_code": "BD-CTG-CHA",
    "name_en": "Haimchar",
    "name_bn": "হাইমচর",
    "bbs_code": "BD20130047",
    "postal_codes": [
      "3660"
    ]
  },
  {
    "code": "BD-CTG-CHA-HAJ",
    "district_code": "BD-CTG-CHA",
    "name_en": "Hajiganj",
    "name_bn": "হাজীগঞ্জ",
    "bbs_code": "BD20130049",
    "postal_codes": [
      "3611"
    ]
  },
  {
    "code": "BD-CTG-CHA-KAC",
    "district_code": "BD-CTG-CHA",
    "name_en": "Kachua",
    "name_bn": "কচুয়া",
    "bbs_code": "BD20130058",
    "postal_codes": [
      "3630"
    ]
  },
  {
    "code": "BD-CTG-CHA-MAT",
    "district_code": "BD-CTG-CHA",
    "name_en": "Matlab Dakkhin",
    "name_bn": "মতলব দক্ষিণ",
    "bbs_code": "BD20130076",
    "postal_codes": [
      "3517"
    ]
  },
  {
    "code": "BD-CTG-CHA-MAR",
    "district_code": "BD-CTG-CHA",
    "name_en": "Matlab Uttar",
    "name_bn": "মতলব উত্তর",
    "bbs_code": "BD20130079",
    "postal_codes": [
      "3640"
    ]
  },
  {
    "code": "BD-CTG-CHA-SHA",
    "district_code": "BD-CTG-CHA",
    "name_en": "Shahrasti",
    "name_bn": "শাহরাস্তি",
    "bbs_code": "BD20130095",
    "postal_codes": [
      "3623"
    ]
  },
  {
    "code": "BD-CTG-CTG-ANW",
    "district_code": "BD-CTG-CTG",
    "name_en": "Anwara",
    "name_bn": "আনোয়ারা",
    "bbs_code": "BD20150004",
    "postal_codes": [
      "4376"
    ]
  },
  {
    "code": "BD-CTG-CTG-BAN",
    "district_code": "BD-CTG-CTG",
    "name_en": "Banshkhali",
    "name_bn": "বাঁশখালী",
    "bbs_code": "BD20150008",
    "postal_codes": [
      "4393"
    ]
  },
  {
    "code": "BD-CTG-CTG-BOA",
    "district_code": "BD-CTG-CTG",
    "name_en": "Boalkhali",
    "name_bn": "বোয়ালখালী",
    "bbs_code": "BD20150012",
    "postal_codes": [
      "4366"
    ]
  },
  {
    "code": "BD-CTG-CTG-CHA",
    "district_code": "BD-CTG-CTG",
    "name_en": "Chandanaish",
    "name_bn": "চন্দনাইশ",
    "bbs_code": "BD20150018",
    "postal_codes": [
      "4383"
    ]
  },
  {
    "code": "BD-CTG-CTG-FAT",
    "district_code": "BD-CTG-CTG",
    "name_en": "Fatikchhari",
    "name_bn": "ফটিকছড়ি",
    "bbs_code": "BD20150033",
    "postal_codes": [
      "4352"
    ]
  },
  {
    "code": "BD-CTG-CTG-HAT",
    "district_code": "BD-CTG-CTG",
    "name_en": "Hathazari",
    "name_bn": "হাটহাজারী",
    "bbs_code": "BD20150037",
    "postal_codes": [
      "4331"
    ]
  },
  {
    "code": "BD-CTG-CTG-KAR",
    "district_code": "BD-CTG-CTG",
    "name_en": "Karnaphuli",
    "name_bn": "কর্ণফুলী",
    "bbs_code": "BD20150039",
    "postal_codes": [
      "4000"
    ]
  },
  {
    "code": "BD-CTG-CTG-LOH",
    "district_code": "BD-CTG-CTG",
    "name_en": "Lohagara",
    "name_bn": "লোহাগড়া",
    "bbs_code": "BD20150047",
    "postal_codes": [
      "4398"
    ]
  },
  {
    "code": "BD-CTG-CTG-MIR",
    "district_code": "BD-CTG-CTG",
    "name_en": "Mirsarai",
    "name_bn": "সরাইল",
    "bbs_code": "BD20150053",
    "postal_codes": [
      "4329"
    ]
  },
  {
    "code": "BD-CTG-CTG-PAT",
    "district_code": "BD-CTG-CTG",
    "name_en": "Patiya",
    "name_bn": "পটিয়া",
    "bbs_code": "BD20150061",
    "postal_codes": [
      "4371"
    ]
  },
  {
    "code": "BD-CTG-CTG-RAN",
    "district_code": "BD-CTG-CTG",
    "name_en": "Rangunia",
    "name_bn": "রাঙ্গুনিয়া",
    "bbs_code": "BD20150070",
    "postal_codes": [
      "4361"
    ]
  },
  {
    "code": "BD-CTG-CTG-RAO",
    "district_code": "BD-CTG-CTG",
    "name_en": "Raozan",
    "name_bn": "রাউজান",
    "bbs_code": "BD20150074",
    "postal_codes": [
      "4341"
    ]
  },
  {
    "code": "BD-CTG-CTG-SAN",
    "district_code": "BD-CTG-CTG",
    "name_en": "Sandwip",
    "name_bn": "সন্দ্বীপ",
    "bbs_code": "BD20150078",
    "postal_codes": [
      "4300"
    ]
  },
  {
    "code": "BD-CTG-CTG-SAT",
    "district_code": "BD-CTG-CTG",
    "name_en": "Satkania",
    "name_bn": "সাতকানিয়া",
    "bbs_code": "BD20150082",
    "postal_codes": [
      "4387"
    ]
  },
  {
    "code": "BD-CTG-CTG-SIT",
    "district_code": "BD-CTG-CTG",
    "name_en": "Sitakunda",
    "name_bn": "সীতাকুন্ড",
    "bbs_code": "BD20150086",
    "postal_codes": [
      "4312"
    ]
  },
  {
    "code": "BD-CTG-COX-CHA",
    "district_code": "BD-CTG-COX",
    "name_en": "Chakaria",
    "name_bn": "চকরিয়া",
    "bbs_code": "BD20220016",
    "postal_codes": [
      "4740"
    ]
  },
  {
    "code": "BD-CTG-COX-COX",
    "district_code": "BD-CTG-COX",
    "name_en": "Coxs Bazar Sadar",
    "name_bn": "কক্সবাজার সদর",
    "bbs_code": "BD20220024",
    "postal_codes": [
      "4700"
    ]
  },
  {
    "code": "BD-CTG-COX-EID",
    "district_code": "BD-CTG-COX",
    "name_en": "Eidgaon",
    "name_bn": "ঈদগাঁও",
    "bbs_code": "BD20220032",
    "postal_codes": [
      "4702"
    ]
  },
  {
    "code": "BD-CTG-COX-KUT",
    "district_code": "BD-CTG-COX",
    "name_en": "Kutubdia",
    "name_bn": "কুতুবদিয়া",
    "bbs_code": "BD20220045",
    "postal_codes": [
      "4720"
    ]
  },
  {
    "code": "BD-CTG-COX-MAH",
    "district_code": "BD-CTG-COX",
    "name_en": "Maheshkhali",
    "name_bn": "মহেশখালী",
    "bbs_code": "BD20220049",
    "postal_codes": [
      "4700"
    ]
  },
  {
    "code": "BD-CTG-COX-PEK",
    "district_code": "BD-CTG-COX",
    "name_en": "Pekua",
    "name_bn": "পেকুয়া",
    "bbs_code": "BD20220056",
    "postal_codes": [
      "4770"
    ]
  },
  {
    "code": "BD-CTG-COX-RAM",
    "district_code": "BD-CTG-COX",
    "name_en": "Ramu",
    "name_bn": "রামু",
    "bbs_code": "BD20220066",
    "postal_codes": [
      "4730"
    ]
  },
  {
    "code": "BD-CTG-COX-TEK",
    "district_code": "BD-CTG-COX",
    "name_en": "Teknaf",
    "name_bn": "টেকনাফ",
    "bbs_code": "BD20220090",
    "postal_codes": [
      "4761"
    ]
  },
  {
    "code": "BD-CTG-COX-UKH",
    "district_code": "BD-CTG-COX",
    "name_en": "Ukhia",
    "name_bn": "উখিয়া",
    "bbs_code": "BD20220094",
    "postal_codes": [
      "4750"
    ]
  },
  {
    "code": "BD-CTG-CUM-ADA",
    "district_code": "BD-CTG-CUM",
    "name_en": "Adarsha Sadar",
    "name_bn": "আদর্শ সদর",
    "bbs_code": "BD20190067",
    "postal_codes": [
      "3501"
    ]
  },
  {
    "code": "BD-CTG-CUM-BAR",
    "district_code": "BD-CTG-CUM",
    "name_en": "Barura",
    "name_bn": "বরুড়া",
    "bbs_code": "BD20190009",
    "postal_codes": [
      "3560"
    ]
  },
  {
    "code": "BD-CTG-CUM-BRA",
    "district_code": "BD-CTG-CUM",
    "name_en": "Brahmanpara",
    "name_bn": "ব্রাহ্মণপাড়া",
    "bbs_code": "BD20190015",
    "postal_codes": [
      "3526"
    ]
  },
  {
    "code": "BD-CTG-CUM-BUR",
    "district_code": "BD-CTG-CUM",
    "name_en": "Burichang",
    "name_bn": "বুড়িচং",
    "bbs_code": "BD20190018",
    "postal_codes": [
      "3520"
    ]
  },
  {
    "code": "BD-CTG-CUM-CHA",
    "district_code": "BD-CTG-CUM",
    "name_en": "Chandina",
    "name_bn": "চান্দিনা",
    "bbs_code": "BD20190027",
    "postal_codes": [
      "3510"
    ]
  },
  {
    "code": "BD-CTG-CUM-CHM",
    "district_code": "BD-CTG-CUM",
    "name_en": "Chauddagram",
    "name_bn": "চৌদ্দগ্রাম",
    "bbs_code": "BD20190031",
    "postal_codes": [
      "3551"
    ]
  },
  {
    "code": "BD-CTG-CUM-DAU",
    "district_code": "BD-CTG-CUM",
    "name_en": "Daudkandi",
    "name_bn": "দাউদকান্দি",
    "bbs_code": "BD20190036",
    "postal_codes": [
      "3518"
    ]
  },
  {
    "code": "BD-CTG-CUM-DEB",
    "district_code": "BD-CTG-CUM",
    "name_en": "Debidwar",
    "name_bn": "দেবিদ্বার",
    "bbs_code": "BD20190040",
    "postal_codes": [
      "3531"
    ]
  },
  {
    "code": "BD-CTG-CUM-HOM",
    "district_code": "BD-CTG-CUM",
    "name_en": "Homna",
    "name_bn": "হোমনা",
    "bbs_code": "BD20190054",
    "postal_codes": [
      "3546"
    ]
  },
  {
    "code": "BD-CTG-CUM-LAK",
    "district_code": "BD-CTG-CUM",
    "name_en": "Laksam",
    "name_bn": "লাকসাম",
    "bbs_code": "BD20190072",
    "postal_codes": [
      "3572"
    ]
  },
  {
    "code": "BD-CTG-CUM-LAL",
    "district_code": "BD-CTG-CUM",
    "name_en": "Lalmai",
    "name_bn": "লালমাই",
    "bbs_code": "BD20190073",
    "postal_codes": [
      "3573"
    ]
  },
  {
    "code": "BD-CTG-CUM-MAN",
    "district_code": "BD-CTG-CUM",
    "name_en": "Manoharganj",
    "name_bn": "মনোহরগঞ্জ",
    "bbs_code": "BD20190074",
    "postal_codes": [
      "3562"
    ]
  },
  {
    "code": "BD-CTG-CUM-MEG",
    "district_code": "BD-CTG-CUM",
    "name_en": "Meghna",
    "name_bn": "মেঘনা",
    "bbs_code": "BD20190075",
    "postal_codes": [
      "3515"
    ]
  },
  {
    "code": "BD-CTG-CUM-MUR",
    "district_code": "BD-CTG-CUM",
    "name_en": "Muradnagar",
    "name_bn": "মুরাদনগর",
    "bbs_code": "BD20190081",
    "postal_codes": [
      "3543"
    ]
  },
  {
    "code": "BD-CTG-CUM-NAN",
    "district_code": "BD-CTG-CUM",
    "name_en": "Nangalkot",
    "name_bn": "নাঙ্গলকোট",
    "bbs_code": "BD20190087",
    "postal_codes": [
      "3582"
    ]
  },
  {
    "code": "BD-CTG-CUM-SAD",
    "district_code": "BD-CTG-CUM",
    "name_en": "Sadar Dakkhin",
    "name_bn": "সদর দক্ষিণ",
    "bbs_code": "BD20190033",
    "postal_codes": [
      "3500"
    ]
  },
  {
    "code": "BD-CTG-CUM-TIT",
    "district_code": "BD-CTG-CUM",
    "name_en": "Titas",
    "name_bn": "তিতাস",
    "bbs_code": "BD20190094",
    "postal_codes": [
      "3547"
    ]
  },
  {
    "code": "BD-CTG-FEN-CHH",
    "district_code": "BD-CTG-FEN",
    "name_en": "Chhagalnaiya",
    "name_bn": "ছাগলনাইয়া",
    "bbs_code": "BD20300014",
    "postal_codes": [
      "3910"
    ]
  },
  {
    "code": "BD-CTG-FEN-DAG",
    "district_code": "BD-CTG-FEN",
    "name_en": "Daganbhuiyan",
    "name_bn": "দাগনভূঞা",
    "bbs_code": "BD20300025",
    "postal_codes": [
      "3923"
    ]
  },
  {
    "code": "BD-CTG-FEN-FEN",
    "district_code": "BD-CTG-FEN",
    "name_en": "Feni Sadar",
    "name_bn": "ফেনী সদর",
    "bbs_code": "BD20300029",
    "postal_codes": [
      "3901"
    ]
  },
  {
    "code": "BD-CTG-FEN-FUL",
    "district_code": "BD-CTG-FEN",
    "name_en": "Fulgazi",
    "name_bn": "ফুলগাজী",
    "bbs_code": "BD20300041",
    "postal_codes": [
      "3950"
    ]
  },
  {
    "code": "BD-CTG-FEN-PAR",
    "district_code": "BD-CTG-FEN",
    "name_en": "Parashuram",
    "name_bn": "পরশুরাম",
    "bbs_code": "BD20300051",
    "postal_codes": [
      "3940"
    ]
  },
  {
    "code": "BD-CTG-FEN-SON",
    "district_code": "BD-CTG-FEN",
    "name_en": "Sonagazi",
    "name_bn": "সোনাগাজী",
    "bbs_code": "BD20300094",
    "postal_codes": [
      "3932"
    ]
  },
  {
    "code": "BD-CTG-KHA-DIG",
    "district_code": "BD-CTG-KHA",
    "name_en": "Dighinala",
    "name_bn": "দিঘীনালা",
    "bbs_code": "BD20460043",
    "postal_codes": [
      "4420"
    ]
  },
  {
    "code": "BD-CTG-KHA-GUI",
    "district_code": "BD-CTG-KHA",
    "name_en": "Guimara",
    "name_bn": "গুইমারা",
    "bbs_code": "BD20460047",
    "postal_codes": [
      "4440"
    ]
  },
  {
    "code": "BD-CTG-KHA-KHA",
    "district_code": "BD-CTG-KHA",
    "name_en": "Khagrachhari Sadar",
    "name_bn": "খাগড়াছড়ি সদর",
    "bbs_code": "BD20460049",
    "postal_codes": [
      "4400"
    ]
  },
  {
    "code": "BD-CTG-KHA-LAK",
    "district_code": "BD-CTG-KHA",
    "name_en": "Lakkhichhari",
    "name_bn": "লক্ষ্মীছড়ি",
    "bbs_code": "BD20460061",
    "postal_codes": [
      "4470"
    ]
  },
  {
    "code": "BD-CTG-KHA-MAH",
    "district_code": "BD-CTG-KHA",
    "name_en": "Mahalchhari",
    "name_bn": "মহালছড়ি",
    "bbs_code": "BD20460065",
    "postal_codes": [
      "4430"
    ]
  },
  {
    "code": "BD-CTG-KHA-MAN",
    "district_code": "BD-CTG-KHA",
    "name_en": "Manikchhari",
    "name_bn": "ফটিকছড়ি",
    "bbs_code": "BD20460067",
    "postal_codes": [
      "4460"
    ]
  },
  {
    "code": "BD-CTG-KHA-MAT",
    "district_code": "BD-CTG-KHA",
    "name_en": "Matiranga",
    "name_bn": "মাটিরাঙ্গা",
    "bbs_code": "BD20460070",
    "postal_codes": [
      "4450"
    ]
  },
  {
    "code": "BD-CTG-KHA-PAN",
    "district_code": "BD-CTG-KHA",
    "name_en": "Panchhari",
    "name_bn": "পানছড়ি",
    "bbs_code": "BD20460077",
    "postal_codes": [
      "4410"
    ]
  },
  {
    "code": "BD-CTG-KHA-RAM",
    "district_code": "BD-CTG-KHA",
    "name_en": "Ramgarh",
    "name_bn": "রামগড়",
    "bbs_code": "BD20460080",
    "postal_codes": [
      "3721"
    ]
  },
  {
    "code": "BD-CTG-LAK-KAM",
    "district_code": "BD-CTG-LAK",
    "name_en": "Kamalnagar",
    "name_bn": "কমলনগর",
    "bbs_code": "BD20510033",
    "postal_codes": [
      "3700"
    ]
  },
  {
    "code": "BD-CTG-LAK-LAK",
    "district_code": "BD-CTG-LAK",
    "name_en": "Lakshmipur Sadar",
    "name_bn": "লক্ষ্মীপুর সদর",
    "bbs_code": "BD20510043",
    "postal_codes": [
      "3700"
    ]
  },
  {
    "code": "BD-CTG-LAK-RAI",
    "district_code": "BD-CTG-LAK",
    "name_en": "Raipur",
    "name_bn": "রায়পুর",
    "bbs_code": "BD20510058",
    "postal_codes": [
      "9240"
    ]
  },
  {
    "code": "BD-CTG-LAK-RAM",
    "district_code": "BD-CTG-LAK",
    "name_en": "Ramganj",
    "name_bn": "রামগঞ্জ",
    "bbs_code": "BD20510065",
    "postal_codes": [
      "3721"
    ]
  },
  {
    "code": "BD-CTG-LAK-RTI",
    "district_code": "BD-CTG-LAK",
    "name_en": "Ramgati",
    "name_bn": "রামগতি",
    "bbs_code": "BD20510073",
    "postal_codes": [
      "3721"
    ]
  },
  {
    "code": "BD-CTG-NOA-BEG",
    "district_code": "BD-CTG-NOA",
    "name_en": "Begumganj",
    "name_bn": "বেগমগঞ্জ",
    "bbs_code": "BD20750007",
    "postal_codes": [
      "3831"
    ]
  },
  {
    "code": "BD-CTG-NOA-CHA",
    "district_code": "BD-CTG-NOA",
    "name_en": "Chatkhil",
    "name_bn": "চাটখিল",
    "bbs_code": "BD20750010",
    "postal_codes": [
      "3879"
    ]
  },
  {
    "code": "BD-CTG-NOA-COM",
    "district_code": "BD-CTG-NOA",
    "name_en": "Companiganj",
    "name_bn": "কোম্পানীগঞ্জ",
    "bbs_code": "BD20750021",
    "postal_codes": [
      "3140"
    ]
  },
  {
    "code": "BD-CTG-NOA-HAT",
    "district_code": "BD-CTG-NOA",
    "name_en": "Hatiya",
    "name_bn": "পটিয়া",
    "bbs_code": "BD20750036",
    "postal_codes": [
      "3891"
    ]
  },
  {
    "code": "BD-CTG-NOA-KAB",
    "district_code": "BD-CTG-NOA",
    "name_en": "Kabirhat",
    "name_bn": "কবিরহাট",
    "bbs_code": "BD20750047",
    "postal_codes": [
      "3807"
    ]
  },
  {
    "code": "BD-CTG-NOA-NOA",
    "district_code": "BD-CTG-NOA",
    "name_en": "Noakhali Sadar",
    "name_bn": "নোয়াখালী সদর",
    "bbs_code": "BD20750087",
    "postal_codes": [
      "3811"
    ]
  },
  {
    "code": "BD-CTG-NOA-SEN",
    "district_code": "BD-CTG-NOA",
    "name_en": "Senbag",
    "name_bn": "সেনবাগ",
    "bbs_code": "BD20750080",
    "postal_codes": [
      "3862"
    ]
  },
  {
    "code": "BD-CTG-NOA-SON",
    "district_code": "BD-CTG-NOA",
    "name_en": "Sonaimuri",
    "name_bn": "সোনাইমুড়ী",
    "bbs_code": "BD20750083",
    "postal_codes": [
      "3827"
    ]
  },
  {
    "code": "BD-CTG-NOA-SUB",
    "district_code": "BD-CTG-NOA",
    "name_en": "Subarnachar",
    "name_bn": "সুবর্ণচর",
    "bbs_code": "BD20750085",
    "postal_codes": [
      "3812"
    ]
  },
  {
    "code": "BD-CTG-RAN-BAG",
    "district_code": "BD-CTG-RAN",
    "name_en": "Baghaichhari",
    "name_bn": "বাঘাইছড়ি",
    "bbs_code": "BD20840007",
    "postal_codes": [
      "4550"
    ]
  },
  {
    "code": "BD-CTG-RAN-BAR",
    "district_code": "BD-CTG-RAN",
    "name_en": "Barkal",
    "name_bn": "বরকল",
    "bbs_code": "BD20840021",
    "postal_codes": [
      "4570"
    ]
  },
  {
    "code": "BD-CTG-RAN-BEL",
    "district_code": "BD-CTG-RAN",
    "name_en": "Belaichhari",
    "name_bn": "বিলাইছড়ি",
    "bbs_code": "BD20840029",
    "postal_codes": [
      "4550"
    ]
  },
  {
    "code": "BD-CTG-RAN-JUR",
    "district_code": "BD-CTG-RAN",
    "name_en": "Jurachhari",
    "name_bn": "জুরাছড়ি",
    "bbs_code": "BD20840047",
    "postal_codes": [
      "4560"
    ]
  },
  {
    "code": "BD-CTG-RAN-KAP",
    "district_code": "BD-CTG-RAN",
    "name_en": "Kaptai",
    "name_bn": "কাপ্তাই",
    "bbs_code": "BD20840036",
    "postal_codes": [
      "4531"
    ]
  },
  {
    "code": "BD-CTG-RAN-KAW",
    "district_code": "BD-CTG-RAN",
    "name_en": "Kawkhali",
    "name_bn": "কাউখালী",
    "bbs_code": "BD20840025",
    "postal_codes": [
      "4510"
    ]
  },
  {
    "code": "BD-CTG-RAN-LAN",
    "district_code": "BD-CTG-RAN",
    "name_en": "Langadu",
    "name_bn": "লংগদু",
    "bbs_code": "BD20840058",
    "postal_codes": [
      "4580"
    ]
  },
  {
    "code": "BD-CTG-RAN-NAN",
    "district_code": "BD-CTG-RAN",
    "name_en": "Naniarchar",
    "name_bn": "নানিয়ারচর",
    "bbs_code": "BD20840075",
    "postal_codes": [
      "2341"
    ]
  },
  {
    "code": "BD-CTG-RAN-RAJ",
    "district_code": "BD-CTG-RAN",
    "name_en": "Rajasthali",
    "name_bn": "রাজস্থলী",
    "bbs_code": "BD20840078",
    "postal_codes": [
      "4540"
    ]
  },
  {
    "code": "BD-CTG-RAN-RAN",
    "district_code": "BD-CTG-RAN",
    "name_en": "Rangamati Sadar",
    "name_bn": "রাঙ্গামাটি সদর",
    "bbs_code": "BD20840087",
    "postal_codes": [
      "4500"
    ]
  },
  {
    "code": "BD-DHK-DHA-DHA",
    "district_code": "BD-DHK-DHA",
    "name_en": "Dhamrai",
    "name_bn": "ধামরাই",
    "bbs_code": "BD30260014",
    "postal_codes": [
      "1350"
    ]
  },
  {
    "code": "BD-DHK-DHA-DOH",
    "district_code": "BD-DHK-DHA",
    "name_en": "Dohar",
    "name_bn": "দোহার",
    "bbs_code": "BD30260018",
    "postal_codes": [
      "1330"
    ]
  },
  {
    "code": "BD-DHK-DHA-KER",
    "district_code": "BD-DHK-DHA",
    "name_en": "Keraniganj",
    "name_bn": "কেরাণীগঞ্জ",
    "bbs_code": "BD30260038",
    "postal_codes": [
      "1312"
    ]
  },
  {
    "code": "BD-DHK-DHA-NAW",
    "district_code": "BD-DHK-DHA",
    "name_en": "Nawabganj",
    "name_bn": "নবাবগঞ্জ",
    "bbs_code": "BD30260062",
    "postal_codes": [
      "1323"
    ]
  },
  {
    "code": "BD-DHK-DHA-SAV",
    "district_code": "BD-DHK-DHA",
    "name_en": "Savar",
    "name_bn": "সাভার",
    "bbs_code": "BD30260072",
    "postal_codes": [
      "1348"
    ]
  },
  {
    "code": "BD-DHK-FAR-ALF",
    "district_code": "BD-DHK-FAR",
    "name_en": "Alfadanga",
    "name_bn": "আলফাডাঙ্গা",
    "bbs_code": "BD30290003",
    "postal_codes": [
      "7870"
    ]
  },
  {
    "code": "BD-DHK-FAR-BHA",
    "district_code": "BD-DHK-FAR",
    "name_en": "Bhanga",
    "name_bn": "ভাঙ্গা",
    "bbs_code": "BD30290010",
    "postal_codes": [
      "7830"
    ]
  },
  {
    "code": "BD-DHK-FAR-BOA",
    "district_code": "BD-DHK-FAR",
    "name_en": "Boalmari",
    "name_bn": "বোয়ালমারী",
    "bbs_code": "BD30290018",
    "postal_codes": [
      "7860"
    ]
  },
  {
    "code": "BD-DHK-FAR-CHA",
    "district_code": "BD-DHK-FAR",
    "name_en": "Char Bhadrasan",
    "name_bn": "চরভদ্রাসন",
    "bbs_code": "BD30290021",
    "postal_codes": [
      "7800"
    ]
  },
  {
    "code": "BD-DHK-FAR-FAR",
    "district_code": "BD-DHK-FAR",
    "name_en": "Faridpur Sadar",
    "name_bn": "ফরিদপুর সদর",
    "bbs_code": "BD30290047",
    "postal_codes": [
      "7802"
    ]
  },
  {
    "code": "BD-DHK-FAR-MAD",
    "district_code": "BD-DHK-FAR",
    "name_en": "Madhukhali",
    "name_bn": "মধুখালী",
    "bbs_code": "BD30290056",
    "postal_codes": [
      "7850"
    ]
  },
  {
    "code": "BD-DHK-FAR-NAG",
    "district_code": "BD-DHK-FAR",
    "name_en": "Nagarkanda",
    "name_bn": "নগরকান্দা",
    "bbs_code": "BD30290062",
    "postal_codes": [
      "7840"
    ]
  },
  {
    "code": "BD-DHK-FAR-SAD",
    "district_code": "BD-DHK-FAR",
    "name_en": "Sadarpur",
    "name_bn": "সদরপুর",
    "bbs_code": "BD30290084",
    "postal_codes": [
      "7822"
    ]
  },
  {
    "code": "BD-DHK-FAR-SAL",
    "district_code": "BD-DHK-FAR",
    "name_en": "Saltha",
    "name_bn": "সালথা",
    "bbs_code": "BD30290090",
    "postal_codes": [
      "7801"
    ]
  },
  {
    "code": "BD-DHK-GAZ-GAZ",
    "district_code": "BD-DHK-GAZ",
    "name_en": "Gazipur Sadar",
    "name_bn": "গাজীপুর সদর",
    "bbs_code": "BD30330030",
    "postal_codes": [
      "1703"
    ]
  },
  {
    "code": "BD-DHK-GAZ-KAL",
    "district_code": "BD-DHK-GAZ",
    "name_en": "Kaliakair",
    "name_bn": "কালিয়াকৈর",
    "bbs_code": "BD30330032",
    "postal_codes": [
      "1750"
    ]
  },
  {
    "code": "BD-DHK-GAZ-KAJ",
    "district_code": "BD-DHK-GAZ",
    "name_en": "Kaliganj",
    "name_bn": "কালীগঞ্জ",
    "bbs_code": "BD30330034",
    "postal_codes": [
      "1720"
    ]
  },
  {
    "code": "BD-DHK-GAZ-KAP",
    "district_code": "BD-DHK-GAZ",
    "name_en": "Kapasia",
    "name_bn": "কাপাসিয়া",
    "bbs_code": "BD30330036",
    "postal_codes": [
      "1730"
    ]
  },
  {
    "code": "BD-DHK-GAZ-SRE",
    "district_code": "BD-DHK-GAZ",
    "name_en": "Sreepur",
    "name_bn": "শ্রীপুর",
    "bbs_code": "BD30330086",
    "postal_codes": [
      "1743"
    ]
  },
  {
    "code": "BD-DHK-GOP-GOP",
    "district_code": "BD-DHK-GOP",
    "name_en": "Gopalganj Sadar",
    "name_bn": "গোপালগঞ্জ সদর",
    "bbs_code": "BD30350032",
    "postal_codes": [
      "8102"
    ]
  },
  {
    "code": "BD-DHK-GOP-KAS",
    "district_code": "BD-DHK-GOP",
    "name_en": "Kashiani",
    "name_bn": "কাশিয়ানী",
    "bbs_code": "BD30350043",
    "postal_codes": [
      "8133"
    ]
  },
  {
    "code": "BD-DHK-GOP-KOT",
    "district_code": "BD-DHK-GOP",
    "name_en": "Kotalipara",
    "name_bn": "কোটালীপাড়া",
    "bbs_code": "BD30350051",
    "postal_codes": [
      "8110"
    ]
  },
  {
    "code": "BD-DHK-GOP-MUK",
    "district_code": "BD-DHK-GOP",
    "name_en": "Muksudpur",
    "name_bn": "মুকসুদপুর",
    "bbs_code": "BD30350058",
    "postal_codes": [
      "8141"
    ]
  },
  {
    "code": "BD-DHK-GOP-TUN",
    "district_code": "BD-DHK-GOP",
    "name_en": "Tungipara",
    "name_bn": "টুংগীপাড়া",
    "bbs_code": "BD30350091",
    "postal_codes": [
      "8121"
    ]
  },
  {
    "code": "BD-DHK-KIS-AUS",
    "district_code": "BD-DHK-KIS",
    "name_en": "Austagram",
    "name_bn": "অষ্টগ্রাম",
    "bbs_code": "BD30480002",
    "postal_codes": [
      "2380"
    ]
  },
  {
    "code": "BD-DHK-KIS-BAJ",
    "district_code": "BD-DHK-KIS",
    "name_en": "Bajitpur",
    "name_bn": "বাজিতপুর",
    "bbs_code": "BD30480006",
    "postal_codes": [
      "2336"
    ]
  },
  {
    "code": "BD-DHK-KIS-BHA",
    "district_code": "BD-DHK-KIS",
    "name_en": "Bhairab",
    "name_bn": "ভৈরব",
    "bbs_code": "BD30480011",
    "postal_codes": [
      "2350"
    ]
  },
  {
    "code": "BD-DHK-KIS-HOS",
    "district_code": "BD-DHK-KIS",
    "name_en": "Hossainpur",
    "name_bn": "হোসেনপুর",
    "bbs_code": "BD30480027",
    "postal_codes": [
      "2320"
    ]
  },
  {
    "code": "BD-DHK-KIS-ITN",
    "district_code": "BD-DHK-KIS",
    "name_en": "Itna",
    "name_bn": "ইটনা",
    "bbs_code": "BD30480033",
    "postal_codes": [
      "2390"
    ]
  },
  {
    "code": "BD-DHK-KIS-KAR",
    "district_code": "BD-DHK-KIS",
    "name_en": "Karimganj",
    "name_bn": "করিমগঞ্জ",
    "bbs_code": "BD30480042",
    "postal_codes": [
      "2310"
    ]
  },
  {
    "code": "BD-DHK-KIS-KAT",
    "district_code": "BD-DHK-KIS",
    "name_en": "Katiadi",
    "name_bn": "কটিয়াদী",
    "bbs_code": "BD30480045",
    "postal_codes": [
      "2331"
    ]
  },
  {
    "code": "BD-DHK-KIS-KIS",
    "district_code": "BD-DHK-KIS",
    "name_en": "Kishoreganj Sadar",
    "name_bn": "কিশোরগঞ্জ সদর",
    "bbs_code": "BD30480049",
    "postal_codes": [
      "2301"
    ]
  },
  {
    "code": "BD-DHK-KIS-KUL",
    "district_code": "BD-DHK-KIS",
    "name_en": "Kuliarchar",
    "name_bn": "কুলিয়ারচর",
    "bbs_code": "BD30480054",
    "postal_codes": [
      "2341"
    ]
  },
  {
    "code": "BD-DHK-KIS-MIT",
    "district_code": "BD-DHK-KIS",
    "name_en": "Mithamain",
    "name_bn": "মিঠামইন",
    "bbs_code": "BD30480059",
    "postal_codes": [
      "2371"
    ]
  },
  {
    "code": "BD-DHK-KIS-NIK",
    "district_code": "BD-DHK-KIS",
    "name_en": "Nikli",
    "name_bn": "নিকলী",
    "bbs_code": "BD30480076",
    "postal_codes": [
      "2360"
    ]
  },
  {
    "code": "BD-DHK-KIS-PAK",
    "district_code": "BD-DHK-KIS",
    "name_en": "Pakundia",
    "name_bn": "পাকুন্দিয়া",
    "bbs_code": "BD30480079",
    "postal_codes": [
      "2326"
    ]
  },
  {
    "code": "BD-DHK-KIS-TAR",
    "district_code": "BD-DHK-KIS",
    "name_en": "Tarail",
    "name_bn": "তাড়াইল",
    "bbs_code": "BD30480092",
    "postal_codes": [
      "3432"
    ]
  },
  {
    "code": "BD-DHK-MAD-DAS",
    "district_code": "BD-DHK-MAD",
    "name_en": "Dasar",
    "name_bn": "ডাসার",
    "bbs_code": "BD30540018",
    "postal_codes": [
      "7900"
    ]
  },
  {
    "code": "BD-DHK-MAD-KAL",
    "district_code": "BD-DHK-MAD",
    "name_en": "Kalkini",
    "name_bn": "কালকিনি",
    "bbs_code": "BD30540040",
    "postal_codes": [
      "7920"
    ]
  },
  {
    "code": "BD-DHK-MAD-MAD",
    "district_code": "BD-DHK-MAD",
    "name_en": "Madaripur Sadar",
    "name_bn": "মাদারীপুর সদর",
    "bbs_code": "BD30540054",
    "postal_codes": [
      "7901"
    ]
  },
  {
    "code": "BD-DHK-MAD-RAJ",
    "district_code": "BD-DHK-MAD",
    "name_en": "Rajoir",
    "name_bn": "রাজৈর",
    "bbs_code": "BD30540080",
    "postal_codes": [
      "7911"
    ]
  },
  {
    "code": "BD-DHK-MAD-SHI",
    "district_code": "BD-DHK-MAD",
    "name_en": "Shibchar",
    "name_bn": "শিবচর",
    "bbs_code": "BD30540087",
    "postal_codes": [
      "7930"
    ]
  },
  {
    "code": "BD-DHK-MAN-DAU",
    "district_code": "BD-DHK-MAN",
    "name_en": "Daulatpur",
    "name_bn": "দৌলতপুর",
    "bbs_code": "BD30560010",
    "postal_codes": [
      "1860"
    ]
  },
  {
    "code": "BD-DHK-MAN-GHI",
    "district_code": "BD-DHK-MAN",
    "name_en": "Ghior",
    "name_bn": "ঘিওর",
    "bbs_code": "BD30560022",
    "postal_codes": [
      "1840"
    ]
  },
  {
    "code": "BD-DHK-MAN-HAR",
    "district_code": "BD-DHK-MAN",
    "name_en": "Harirampur",
    "name_bn": "হরিরামপুর",
    "bbs_code": "BD30560028",
    "postal_codes": [
      "7440"
    ]
  },
  {
    "code": "BD-DHK-MAN-MAN",
    "district_code": "BD-DHK-MAN",
    "name_en": "Manikganj Sadar",
    "name_bn": "মানিকগঞ্জ সদর",
    "bbs_code": "BD30560046",
    "postal_codes": [
      "1804"
    ]
  },
  {
    "code": "BD-DHK-MAN-SAT",
    "district_code": "BD-DHK-MAN",
    "name_en": "Saturia",
    "name_bn": "সাটুরিয়া",
    "bbs_code": "BD30560070",
    "postal_codes": [
      "1811"
    ]
  },
  {
    "code": "BD-DHK-MAN-SHI",
    "district_code": "BD-DHK-MAN",
    "name_en": "Shibalay",
    "name_bn": "শিবালয়",
    "bbs_code": "BD30560078",
    "postal_codes": [
      "1850"
    ]
  },
  {
    "code": "BD-DHK-MAN-SIN",
    "district_code": "BD-DHK-MAN",
    "name_en": "Singair",
    "name_bn": "সিংগাইর",
    "bbs_code": "BD30560082",
    "postal_codes": [
      "1821"
    ]
  },
  {
    "code": "BD-DHK-MUN-GAZ",
    "district_code": "BD-DHK-MUN",
    "name_en": "Gazaria",
    "name_bn": "গজারিয়া",
    "bbs_code": "BD30590024",
    "postal_codes": [
      "1510"
    ]
  },
  {
    "code": "BD-DHK-MUN-LOU",
    "district_code": "BD-DHK-MUN",
    "name_en": "Louhajang",
    "name_bn": "লৌহজং",
    "bbs_code": "BD30590044",
    "postal_codes": [
      "1535"
    ]
  },
  {
    "code": "BD-DHK-MUN-MUN",
    "district_code": "BD-DHK-MUN",
    "name_en": "Munshiganj Sadar",
    "name_bn": "মুন্সিগঞ্জ সদর",
    "bbs_code": "BD30590056",
    "postal_codes": [
      "1503"
    ]
  },
  {
    "code": "BD-DHK-MUN-SIR",
    "district_code": "BD-DHK-MUN",
    "name_en": "Sirajdikhan",
    "name_bn": "সিরাজদিখান",
    "bbs_code": "BD30590074",
    "postal_codes": [
      "1542"
    ]
  },
  {
    "code": "BD-DHK-MUN-SRE",
    "district_code": "BD-DHK-MUN",
    "name_en": "Sreenagar",
    "name_bn": "শ্রীনগর",
    "bbs_code": "BD30590084",
    "postal_codes": [
      "1541"
    ]
  },
  {
    "code": "BD-DHK-MUN-TON",
    "district_code": "BD-DHK-MUN",
    "name_en": "Tongibari",
    "name_bn": "টংগীবাড়ি",
    "bbs_code": "BD30590094",
    "postal_codes": [
      "1523"
    ]
  },
  {
    "code": "BD-DHK-NAR-ARA",
    "district_code": "BD-DHK-NAR",
    "name_en": "Araihazar",
    "name_bn": "আড়াইহাজার",
    "bbs_code": "BD30670002",
    "postal_codes": [
      "1450"
    ]
  },
  {
    "code": "BD-DHK-NAR-BAN",
    "district_code": "BD-DHK-NAR",
    "name_en": "Bandar",
    "name_bn": "বন্দর",
    "bbs_code": "BD30670006",
    "postal_codes": [
      "1410"
    ]
  },
  {
    "code": "BD-DHK-NAR-NAR",
    "district_code": "BD-DHK-NAR",
    "name_en": "Narayanganj Sadar",
    "name_bn": "নারায়নগঞ্জ সদর",
    "bbs_code": "BD30670058",
    "postal_codes": [
      "1400"
    ]
  },
  {
    "code": "BD-DHK-NAR-RUP",
    "district_code": "BD-DHK-NAR",
    "name_en": "Rupganj",
    "name_bn": "রূপগঞ্জ",
    "bbs_code": "BD30670068",
    "postal_codes": [
      "1462"
    ]
  },
  {
    "code": "BD-DHK-NAR-SON",
    "district_code": "BD-DHK-NAR",
    "name_en": "Sonargaon",
    "name_bn": "সোনারগাঁ",
    "bbs_code": "BD30670004",
    "postal_codes": [
      "1440"
    ]
  },
  {
    "code": "BD-DHK-NRS-BEL",
    "district_code": "BD-DHK-NRS",
    "name_en": "Belabo",
    "name_bn": "বেলাবো",
    "bbs_code": "BD30680007",
    "postal_codes": [
      "1640"
    ]
  },
  {
    "code": "BD-DHK-NRS-MAN",
    "district_code": "BD-DHK-NRS",
    "name_en": "Manohardi",
    "name_bn": "মনোহরদী",
    "bbs_code": "BD30680052",
    "postal_codes": [
      "1640"
    ]
  },
  {
    "code": "BD-DHK-NRS-NAR",
    "district_code": "BD-DHK-NRS",
    "name_en": "Narsingdi Sadar",
    "name_bn": "নরসিংদী সদর",
    "bbs_code": "BD30680060",
    "postal_codes": [
      "1605"
    ]
  },
  {
    "code": "BD-DHK-NRS-PAL",
    "district_code": "BD-DHK-NRS",
    "name_en": "Palash",
    "name_bn": "পলাশ",
    "bbs_code": "BD30680063",
    "postal_codes": [
      "1612"
    ]
  },
  {
    "code": "BD-DHK-NRS-RAI",
    "district_code": "BD-DHK-NRS",
    "name_en": "Raipura",
    "name_bn": "রায়পুরা",
    "bbs_code": "BD30680064",
    "postal_codes": [
      "9240"
    ]
  },
  {
    "code": "BD-DHK-NRS-SHI",
    "district_code": "BD-DHK-NRS",
    "name_en": "Shibpur",
    "name_bn": "শিবপুর",
    "bbs_code": "BD30680076",
    "postal_codes": [
      "1620"
    ]
  },
  {
    "code": "BD-DHK-RBJ-BAL",
    "district_code": "BD-DHK-RBJ",
    "name_en": "Baliakandi",
    "name_bn": "বালিয়াকান্দি",
    "bbs_code": "BD30820007",
    "postal_codes": [
      "7730"
    ]
  },
  {
    "code": "BD-DHK-RBJ-GOA",
    "district_code": "BD-DHK-RBJ",
    "name_en": "Goalanda",
    "name_bn": "গোয়ালন্দ",
    "bbs_code": "BD30820029",
    "postal_codes": [
      "2011"
    ]
  },
  {
    "code": "BD-DHK-RBJ-KAL",
    "district_code": "BD-DHK-RBJ",
    "name_en": "Kalukhali",
    "name_bn": "কালুখালী",
    "bbs_code": "BD30820047",
    "postal_codes": [
      "8513"
    ]
  },
  {
    "code": "BD-DHK-RBJ-PAN",
    "district_code": "BD-DHK-RBJ",
    "name_en": "Pangsha",
    "name_bn": "পাংশা",
    "bbs_code": "BD30820073",
    "postal_codes": [
      "7723"
    ]
  },
  {
    "code": "BD-DHK-RBJ-RAJ",
    "district_code": "BD-DHK-RBJ",
    "name_en": "Rajbari Sadar",
    "name_bn": "রাজবাড়ী সদর",
    "bbs_code": "BD30820076",
    "postal_codes": [
      "7710"
    ]
  },
  {
    "code": "BD-DHK-SHA-BHE",
    "district_code": "BD-DHK-SHA",
    "name_en": "Bhedarganj",
    "name_bn": "ভেদরগঞ্জ",
    "bbs_code": "BD30860014",
    "postal_codes": [
      "5721"
    ]
  },
  {
    "code": "BD-DHK-SHA-DAM",
    "district_code": "BD-DHK-SHA",
    "name_en": "Damudya",
    "name_bn": "ডামুড্যা",
    "bbs_code": "BD30860025",
    "postal_codes": [
      "8040"
    ]
  },
  {
    "code": "BD-DHK-SHA-GOS",
    "district_code": "BD-DHK-SHA",
    "name_en": "Gosairhat",
    "name_bn": "গোসাইরহাট",
    "bbs_code": "BD30860036",
    "postal_codes": [
      "8050"
    ]
  },
  {
    "code": "BD-DHK-SHA-NAR",
    "district_code": "BD-DHK-SHA",
    "name_en": "Naria",
    "name_bn": "নড়িয়া",
    "bbs_code": "BD30860065",
    "postal_codes": [
      "8021"
    ]
  },
  {
    "code": "BD-DHK-SHA-SHA",
    "district_code": "BD-DHK-SHA",
    "name_en": "Shariatpur Sadar",
    "name_bn": "শরিয়তপুর সদর",
    "bbs_code": "BD30860069",
    "postal_codes": [
      "8001"
    ]
  },
  {
    "code": "BD-DHK-SHA-ZAJ",
    "district_code": "BD-DHK-SHA",
    "name_en": "Zajira",
    "name_bn": "জাজিরা",
    "bbs_code": "BD30860094",
    "postal_codes": [
      "8010"
    ]
  },
  {
    "code": "BD-DHK-TAN-BAS",
    "district_code": "BD-DHK-TAN",
    "name_en": "Basail",
    "name_bn": "বাসাইল",
    "bbs_code": "BD30930009",
    "postal_codes": [
      "1920"
    ]
  },
  {
    "code": "BD-DHK-TAN-BHU",
    "district_code": "BD-DHK-TAN",
    "name_en": "Bhuanpur",
    "name_bn": "ভূঞাপুর",
    "bbs_code": "BD30930019",
    "postal_codes": [
      "1992"
    ]
  },
  {
    "code": "BD-DHK-TAN-DEL",
    "district_code": "BD-DHK-TAN",
    "name_en": "Delduar",
    "name_bn": "দেলদুয়ার",
    "bbs_code": "BD30930023",
    "postal_codes": [
      "1910"
    ]
  },
  {
    "code": "BD-DHK-TAN-DHA",
    "district_code": "BD-DHK-TAN",
    "name_en": "Dhanbari",
    "name_bn": "ধনবাড়ী",
    "bbs_code": "BD30930025",
    "postal_codes": [
      "1997"
    ]
  },
  {
    "code": "BD-DHK-TAN-GHA",
    "district_code": "BD-DHK-TAN",
    "name_en": "Ghatail",
    "name_bn": "ঘাটাইল",
    "bbs_code": "BD30930028",
    "postal_codes": [
      "1982"
    ]
  },
  {
    "code": "BD-DHK-TAN-GOP",
    "district_code": "BD-DHK-TAN",
    "name_en": "Gopalpur",
    "name_bn": "গোপালপুর",
    "bbs_code": "BD30930038",
    "postal_codes": [
      "1990"
    ]
  },
  {
    "code": "BD-DHK-TAN-KAL",
    "district_code": "BD-DHK-TAN",
    "name_en": "Kalihati",
    "name_bn": "কালিহাতী",
    "bbs_code": "BD30930047",
    "postal_codes": [
      "1973"
    ]
  },
  {
    "code": "BD-DHK-TAN-MAD",
    "district_code": "BD-DHK-TAN",
    "name_en": "Madhupur",
    "name_bn": "মধুপুর",
    "bbs_code": "BD30930057",
    "postal_codes": [
      "1997"
    ]
  },
  {
    "code": "BD-DHK-TAN-MIR",
    "district_code": "BD-DHK-TAN",
    "name_en": "Mirzapur",
    "name_bn": "মির্জাপুর",
    "bbs_code": "BD30930066",
    "postal_codes": [
      "1941"
    ]
  },
  {
    "code": "BD-DHK-TAN-NAG",
    "district_code": "BD-DHK-TAN",
    "name_en": "Nagarpur",
    "name_bn": "নাগরপুর",
    "bbs_code": "BD30930076",
    "postal_codes": [
      "1937"
    ]
  },
  {
    "code": "BD-DHK-TAN-SAK",
    "district_code": "BD-DHK-TAN",
    "name_en": "Sakhipur",
    "name_bn": "সখিপুর",
    "bbs_code": "BD30930085",
    "postal_codes": [
      "1951"
    ]
  },
  {
    "code": "BD-DHK-TAN-TAN",
    "district_code": "BD-DHK-TAN",
    "name_en": "Tangail Sadar",
    "name_bn": "টাঙ্গাইল সদর",
    "bbs_code": "BD30930095",
    "postal_codes": [
      "1901"
    ]
  },
  {
    "code": "BD-KHU-BAG-BAG",
    "district_code": "BD-KHU-BAG",
    "name_en": "Bagerhat Sadar",
    "name_bn": "বাগেরহাট সদর",
    "bbs_code": "BD40010008",
    "postal_codes": [
      "9300"
    ]
  },
  {
    "code": "BD-KHU-BAG-CHI",
    "district_code": "BD-KHU-BAG",
    "name_en": "Chitalmari",
    "name_bn": "চিতলমারী",
    "bbs_code": "BD40010014",
    "postal_codes": [
      "9361"
    ]
  },
  {
    "code": "BD-KHU-BAG-FAK",
    "district_code": "BD-KHU-BAG",
    "name_en": "Fakirhat",
    "name_bn": "ফকিরহাট",
    "bbs_code": "BD40010034",
    "postal_codes": [
      "9372"
    ]
  },
  {
    "code": "BD-KHU-BAG-KAC",
    "district_code": "BD-KHU-BAG",
    "name_en": "Kachua",
    "name_bn": "কচুয়া",
    "bbs_code": "BD40010038",
    "postal_codes": [
      "3630"
    ]
  },
  {
    "code": "BD-KHU-BAG-MOL",
    "district_code": "BD-KHU-BAG",
    "name_en": "Mollahat",
    "name_bn": "মোল্লাহাট",
    "bbs_code": "BD40010056",
    "postal_codes": [
      "9383"
    ]
  },
  {
    "code": "BD-KHU-BAG-MON",
    "district_code": "BD-KHU-BAG",
    "name_en": "Mongla",
    "name_bn": "মোংলা",
    "bbs_code": "BD40010058",
    "postal_codes": [
      "9350"
    ]
  },
  {
    "code": "BD-KHU-BAG-MOR",
    "district_code": "BD-KHU-BAG",
    "name_en": "Morelganj",
    "name_bn": "মোড়েলগঞ্জ",
    "bbs_code": "BD40010060",
    "postal_codes": [
      "9320"
    ]
  },
  {
    "code": "BD-KHU-BAG-RAM",
    "district_code": "BD-KHU-BAG",
    "name_en": "Rampal",
    "name_bn": "রামপাল",
    "bbs_code": "BD40010073",
    "postal_codes": [
      "9341"
    ]
  },
  {
    "code": "BD-KHU-BAG-SHA",
    "district_code": "BD-KHU-BAG",
    "name_en": "Sharankhola",
    "name_bn": "শরণখোলা",
    "bbs_code": "BD40010077",
    "postal_codes": [
      "9330"
    ]
  },
  {
    "code": "BD-KHU-CHU-ALA",
    "district_code": "BD-KHU-CHU",
    "name_en": "Alamdanga",
    "name_bn": "আলমডাঙ্গা",
    "bbs_code": "BD40180007",
    "postal_codes": [
      "7210"
    ]
  },
  {
    "code": "BD-KHU-CHU-CHU",
    "district_code": "BD-KHU-CHU",
    "name_en": "Chuadanga Sadar",
    "name_bn": "চুয়াডাঙ্গা সদর",
    "bbs_code": "BD40180023",
    "postal_codes": [
      "7200"
    ]
  },
  {
    "code": "BD-KHU-CHU-DAM",
    "district_code": "BD-KHU-CHU",
    "name_en": "Damurhuda",
    "name_bn": "দামুড়হুদা",
    "bbs_code": "BD40180031",
    "postal_codes": [
      "7222"
    ]
  },
  {
    "code": "BD-KHU-CHU-JIB",
    "district_code": "BD-KHU-CHU",
    "name_en": "Jibannagar",
    "name_bn": "জীবননগর",
    "bbs_code": "BD40180055",
    "postal_codes": [
      "7230"
    ]
  },
  {
    "code": "BD-KHU-JES-ABH",
    "district_code": "BD-KHU-JES",
    "name_en": "Abhaynagar",
    "name_bn": "অভয়নগর",
    "bbs_code": "BD40410004",
    "postal_codes": [
      "7460"
    ]
  },
  {
    "code": "BD-KHU-JES-BAG",
    "district_code": "BD-KHU-JES",
    "name_en": "Bagharpara",
    "name_bn": "বাঘারপাড়া",
    "bbs_code": "BD40410009",
    "postal_codes": [
      "7470"
    ]
  },
  {
    "code": "BD-KHU-JES-CHA",
    "district_code": "BD-KHU-JES",
    "name_en": "Chaugachha",
    "name_bn": "চৌগাছা",
    "bbs_code": "BD40410011",
    "postal_codes": [
      "7410"
    ]
  },
  {
    "code": "BD-KHU-JES-JAS",
    "district_code": "BD-KHU-JES",
    "name_en": "Jashore Sadar",
    "name_bn": "নাটোর সদর",
    "bbs_code": "BD40410047",
    "postal_codes": [
      "7406"
    ]
  },
  {
    "code": "BD-KHU-JES-JHI",
    "district_code": "BD-KHU-JES",
    "name_en": "Jhikargachha",
    "name_bn": "ঝিকরগাছা",
    "bbs_code": "BD40410023",
    "postal_codes": [
      "7420"
    ]
  },
  {
    "code": "BD-KHU-JES-KES",
    "district_code": "BD-KHU-JES",
    "name_en": "Keshabpur",
    "name_bn": "কেশবপুর",
    "bbs_code": "BD40410038",
    "postal_codes": [
      "7450"
    ]
  },
  {
    "code": "BD-KHU-JES-MAN",
    "district_code": "BD-KHU-JES",
    "name_en": "Manirampur",
    "name_bn": "মণিরামপুর",
    "bbs_code": "BD40410061",
    "postal_codes": [
      "7440"
    ]
  },
  {
    "code": "BD-KHU-JES-SHA",
    "district_code": "BD-KHU-JES",
    "name_en": "Sharsha",
    "name_bn": "শার্শা",
    "bbs_code": "BD40410090",
    "postal_codes": [
      "7432"
    ]
  },
  {
    "code": "BD-KHU-JHE-HAR",
    "district_code": "BD-KHU-JHE",
    "name_en": "Harinakundu",
    "name_bn": "হরিণাকুন্ডু",
    "bbs_code": "BD40440014",
    "postal_codes": [
      "7310"
    ]
  },
  {
    "code": "BD-KHU-JHE-JHE",
    "district_code": "BD-KHU-JHE",
    "name_en": "Jhenaidah Sadar",
    "name_bn": "ঝিনাইদহ সদর",
    "bbs_code": "BD40440019",
    "postal_codes": [
      "7300"
    ]
  },
  {
    "code": "BD-KHU-JHE-KAL",
    "district_code": "BD-KHU-JHE",
    "name_en": "Kaliganj",
    "name_bn": "কালীগঞ্জ",
    "bbs_code": "BD40440033",
    "postal_codes": [
      "1720"
    ]
  },
  {
    "code": "BD-KHU-JHE-KOT",
    "district_code": "BD-KHU-JHE",
    "name_en": "Kotchandpur",
    "name_bn": "কোটচাঁদপুর",
    "bbs_code": "BD40440042",
    "postal_codes": [
      "7330"
    ]
  },
  {
    "code": "BD-KHU-JHE-MAH",
    "district_code": "BD-KHU-JHE",
    "name_en": "Maheshpur",
    "name_bn": "মহেশপুর",
    "bbs_code": "BD40440071",
    "postal_codes": [
      "7340"
    ]
  },
  {
    "code": "BD-KHU-JHE-SHA",
    "district_code": "BD-KHU-JHE",
    "name_en": "Shailkupa",
    "name_bn": "শৈলকুপা",
    "bbs_code": "BD40440080",
    "postal_codes": [
      "7300"
    ]
  },
  {
    "code": "BD-KHU-KHU-BAT",
    "district_code": "BD-KHU-KHU",
    "name_en": "Batiaghata",
    "name_bn": "বটিয়াঘাটা",
    "bbs_code": "BD40470012",
    "postal_codes": [
      "9260"
    ]
  },
  {
    "code": "BD-KHU-KHU-DAC",
    "district_code": "BD-KHU-KHU",
    "name_en": "Dacope",
    "name_bn": "দাকোপ",
    "bbs_code": "BD40470017",
    "postal_codes": [
      "9350"
    ]
  },
  {
    "code": "BD-KHU-KHU-DIG",
    "district_code": "BD-KHU-KHU",
    "name_en": "Dighalia",
    "name_bn": "কাঠালিয়া",
    "bbs_code": "BD40470040",
    "postal_codes": [
      "9220"
    ]
  },
  {
    "code": "BD-KHU-KHU-DUM",
    "district_code": "BD-KHU-KHU",
    "name_en": "Dumuria",
    "name_bn": "ডুমুরিয়া",
    "bbs_code": "BD40470030",
    "postal_codes": [
      "9250"
    ]
  },
  {
    "code": "BD-KHU-KHU-KOY",
    "district_code": "BD-KHU-KHU",
    "name_en": "Koyra",
    "name_bn": "কয়রা",
    "bbs_code": "BD40470053",
    "postal_codes": [
      "9291"
    ]
  },
  {
    "code": "BD-KHU-KHU-PAI",
    "district_code": "BD-KHU-KHU",
    "name_en": "Paikgachha",
    "name_bn": "চৌগাছা",
    "bbs_code": "BD40470064",
    "postal_codes": [
      "9284"
    ]
  },
  {
    "code": "BD-KHU-KHU-PHU",
    "district_code": "BD-KHU-KHU",
    "name_en": "Phultala",
    "name_bn": "ফুলতলা",
    "bbs_code": "BD40470069",
    "postal_codes": [
      "9210"
    ]
  },
  {
    "code": "BD-KHU-KHU-RUP",
    "district_code": "BD-KHU-KHU",
    "name_en": "Rupsa",
    "name_bn": "রূপসা",
    "bbs_code": "BD40470075",
    "postal_codes": [
      "9100"
    ]
  },
  {
    "code": "BD-KHU-KHU-TER",
    "district_code": "BD-KHU-KHU",
    "name_en": "Terokhada",
    "name_bn": "তেরখাদা",
    "bbs_code": "BD40470094",
    "postal_codes": [
      "9230"
    ]
  },
  {
    "code": "BD-KHU-KUS-BHE",
    "district_code": "BD-KHU-KUS",
    "name_en": "Bheramara",
    "name_bn": "ভেড়ামারা",
    "bbs_code": "BD40500015",
    "postal_codes": [
      "7042"
    ]
  },
  {
    "code": "BD-KHU-KUS-DAU",
    "district_code": "BD-KHU-KUS",
    "name_en": "Daulatpur",
    "name_bn": "দৌলতপুর",
    "bbs_code": "BD40500039",
    "postal_codes": [
      "1860"
    ]
  },
  {
    "code": "BD-KHU-KUS-KHO",
    "district_code": "BD-KHU-KUS",
    "name_en": "Khoksa",
    "name_bn": "খোকসা",
    "bbs_code": "BD40500063",
    "postal_codes": [
      "7020"
    ]
  },
  {
    "code": "BD-KHU-KUS-KUM",
    "district_code": "BD-KHU-KUS",
    "name_en": "Kumarkhali",
    "name_bn": "কুমারখালী",
    "bbs_code": "BD40500071",
    "postal_codes": [
      "7010"
    ]
  },
  {
    "code": "BD-KHU-KUS-KUS",
    "district_code": "BD-KHU-KUS",
    "name_en": "Kushtia Sadar",
    "name_bn": "কুষ্টিয়া সদর",
    "bbs_code": "BD40500079",
    "postal_codes": [
      "7003"
    ]
  },
  {
    "code": "BD-KHU-KUS-MIR",
    "district_code": "BD-KHU-KUS",
    "name_en": "Mirpur",
    "name_bn": "মিরপুর",
    "bbs_code": "BD40500094",
    "postal_codes": [
      "1216"
    ]
  },
  {
    "code": "BD-KHU-MAG-MAG",
    "district_code": "BD-KHU-MAG",
    "name_en": "Magura Sadar",
    "name_bn": "মাগুরা সদর",
    "bbs_code": "BD40550057",
    "postal_codes": [
      "7600"
    ]
  },
  {
    "code": "BD-KHU-MAG-MOH",
    "district_code": "BD-KHU-MAG",
    "name_en": "Mohammadpur",
    "name_bn": "মহম্মদপুর",
    "bbs_code": "BD40550066",
    "postal_codes": [
      "1207"
    ]
  },
  {
    "code": "BD-KHU-MAG-SHA",
    "district_code": "BD-KHU-MAG",
    "name_en": "Shalikha",
    "name_bn": "শালিখা",
    "bbs_code": "BD40550085",
    "postal_codes": [
      "7620"
    ]
  },
  {
    "code": "BD-KHU-MAG-SRE",
    "district_code": "BD-KHU-MAG",
    "name_en": "Sreepur",
    "name_bn": "শ্রীপুর",
    "bbs_code": "BD40550095",
    "postal_codes": [
      "1743"
    ]
  },
  {
    "code": "BD-KHU-MEH-GAN",
    "district_code": "BD-KHU-MEH",
    "name_en": "Gangni",
    "name_bn": "গাংনী",
    "bbs_code": "BD40570047",
    "postal_codes": [
      "7110"
    ]
  },
  {
    "code": "BD-KHU-MEH-MEH",
    "district_code": "BD-KHU-MEH",
    "name_en": "Meherpur Sadar",
    "name_bn": "মেহেরপুর সদর",
    "bbs_code": "BD40570087",
    "postal_codes": [
      "7101"
    ]
  },
  {
    "code": "BD-KHU-MEH-MUJ",
    "district_code": "BD-KHU-MEH",
    "name_en": "Mujibnagar",
    "name_bn": "মুজিবনগর",
    "bbs_code": "BD40570060",
    "postal_codes": [
      "7100"
    ]
  },
  {
    "code": "BD-KHU-NRL-KAL",
    "district_code": "BD-KHU-NRL",
    "name_en": "Kalia",
    "name_bn": "কালিয়া",
    "bbs_code": "BD40650028",
    "postal_codes": [
      "7520"
    ]
  },
  {
    "code": "BD-KHU-NRL-LOH",
    "district_code": "BD-KHU-NRL",
    "name_en": "Lohagara",
    "name_bn": "লোহাগড়া",
    "bbs_code": "BD40650052",
    "postal_codes": [
      "4398"
    ]
  },
  {
    "code": "BD-KHU-NRL-NAR",
    "district_code": "BD-KHU-NRL",
    "name_en": "Narail Sadar",
    "name_bn": "নড়াইল সদর",
    "bbs_code": "BD40650076",
    "postal_codes": [
      "7500"
    ]
  },
  {
    "code": "BD-KHU-SAT-ASH",
    "district_code": "BD-KHU-SAT",
    "name_en": "Ashashuni",
    "name_bn": "আশাশুনি",
    "bbs_code": "BD40870004",
    "postal_codes": [
      "9460"
    ]
  },
  {
    "code": "BD-KHU-SAT-DEB",
    "district_code": "BD-KHU-SAT",
    "name_en": "Debhata",
    "name_bn": "দেবহাটা",
    "bbs_code": "BD40870025",
    "postal_codes": [
      "9430"
    ]
  },
  {
    "code": "BD-KHU-SAT-KAL",
    "district_code": "BD-KHU-SAT",
    "name_en": "Kalaroa",
    "name_bn": "কলারোয়া",
    "bbs_code": "BD40870043",
    "postal_codes": [
      "9415"
    ]
  },
  {
    "code": "BD-KHU-SAT-KAJ",
    "district_code": "BD-KHU-SAT",
    "name_en": "Kaliganj",
    "name_bn": "কালীগঞ্জ",
    "bbs_code": "BD40870047",
    "postal_codes": [
      "1720"
    ]
  },
  {
    "code": "BD-KHU-SAT-SAT",
    "district_code": "BD-KHU-SAT",
    "name_en": "Satkhira Sadar",
    "name_bn": "সাতক্ষীরা সদর",
    "bbs_code": "BD40870082",
    "postal_codes": [
      "9403"
    ]
  },
  {
    "code": "BD-KHU-SAT-SHY",
    "district_code": "BD-KHU-SAT",
    "name_en": "Shyamnagar",
    "name_bn": "শ্যামনগর",
    "bbs_code": "BD40870086",
    "postal_codes": [
      "9450"
    ]
  },
  {
    "code": "BD-KHU-SAT-TAL",
    "district_code": "BD-KHU-SAT",
    "name_en": "Tala",
    "name_bn": "তালা",
    "bbs_code": "BD40870090",
    "postal_codes": [
      "9420"
    ]
  },
  {
    "code": "BD-RAJ-BOG-ADA",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Adamdighi",
    "name_bn": "আদমদিঘি",
    "bbs_code": "BD50100006",
    "postal_codes": [
      "5890"
    ]
  },
  {
    "code": "BD-RAJ-BOG-BOG",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Bogura Sadar",
    "name_bn": "মাগুরা সদর",
    "bbs_code": "BD50100020",
    "postal_codes": [
      "7600"
    ]
  },
  {
    "code": "BD-RAJ-BOG-DHU",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Dhunat",
    "name_bn": "ধুনট",
    "bbs_code": "BD50100027",
    "postal_codes": [
      "5850"
    ]
  },
  {
    "code": "BD-RAJ-BOG-DUP",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Dupchachia",
    "name_bn": "দুপচাঁচিয়া",
    "bbs_code": "BD50100033",
    "postal_codes": [
      "5880"
    ]
  },
  {
    "code": "BD-RAJ-BOG-GAB",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Gabtali",
    "name_bn": "গাবতলী",
    "bbs_code": "BD50100040",
    "postal_codes": [
      "5820"
    ]
  },
  {
    "code": "BD-RAJ-BOG-KAH",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Kahaloo",
    "name_bn": "কাহালু",
    "bbs_code": "BD50100054",
    "postal_codes": [
      "5870"
    ]
  },
  {
    "code": "BD-RAJ-BOG-NAN",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Nandigram",
    "name_bn": "নন্দিগ্রাম",
    "bbs_code": "BD50100067",
    "postal_codes": [
      "5860"
    ]
  },
  {
    "code": "BD-RAJ-BOG-SAR",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Sariakandi",
    "name_bn": "সারিয়াকান্দি",
    "bbs_code": "BD50100081",
    "postal_codes": [
      "5831"
    ]
  },
  {
    "code": "BD-RAJ-BOG-SHA",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Shajahanpur",
    "name_bn": "শাজাহানপুর",
    "bbs_code": "BD50100085",
    "postal_codes": [
      "5801"
    ]
  },
  {
    "code": "BD-RAJ-BOG-SHE",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Sherpur",
    "name_bn": "শেরপুর",
    "bbs_code": "BD50100088",
    "postal_codes": [
      "5841"
    ]
  },
  {
    "code": "BD-RAJ-BOG-SHI",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Shibganj",
    "name_bn": "শিবগঞ্জ",
    "bbs_code": "BD50100094",
    "postal_codes": [
      "5810"
    ]
  },
  {
    "code": "BD-RAJ-BOG-SON",
    "district_code": "BD-RAJ-BOG",
    "name_en": "Sonatala",
    "name_bn": "সোনাতলা",
    "bbs_code": "BD50100095",
    "postal_codes": [
      "5826"
    ]
  },
  {
    "code": "BD-RAJ-undefined-BHO",
    "district_code": "BD-RAJ-undefined",
    "name_en": "Bholahat",
    "name_bn": "ভোলাহাট",
    "bbs_code": "BD50700018",
    "postal_codes": [
      "6330"
    ]
  },
  {
    "code": "BD-RAJ-undefined-CHA",
    "district_code": "BD-RAJ-undefined",
    "name_en": "Chapainawabganj Sadar",
    "name_bn": "চাঁপাইনবাবগঞ্জ সদর",
    "bbs_code": "BD50700066",
    "postal_codes": [
      "6303"
    ]
  },
  {
    "code": "BD-RAJ-undefined-GOM",
    "district_code": "BD-RAJ-undefined",
    "name_en": "Gomastapur",
    "name_bn": "গোমস্তাপুর",
    "bbs_code": "BD50700037",
    "postal_codes": [
      "6310"
    ]
  },
  {
    "code": "BD-RAJ-undefined-NAC",
    "district_code": "BD-RAJ-undefined",
    "name_en": "Nachole",
    "name_bn": "নাচোল",
    "bbs_code": "BD50700056",
    "postal_codes": [
      "6311"
    ]
  },
  {
    "code": "BD-RAJ-undefined-SHI",
    "district_code": "BD-RAJ-undefined",
    "name_en": "Shibganj",
    "name_bn": "শিবগঞ্জ",
    "bbs_code": "BD50700088",
    "postal_codes": [
      "5810"
    ]
  },
  {
    "code": "BD-RAJ-JOY-AKK",
    "district_code": "BD-RAJ-JOY",
    "name_en": "Akkelpur",
    "name_bn": "আক্কেলপুর",
    "bbs_code": "BD50380013",
    "postal_codes": [
      "5940"
    ]
  },
  {
    "code": "BD-RAJ-JOY-JOY",
    "district_code": "BD-RAJ-JOY",
    "name_en": "Joypurhat Sadar",
    "name_bn": "জয়পুরহাট সদর",
    "bbs_code": "BD50380047",
    "postal_codes": [
      "5900"
    ]
  },
  {
    "code": "BD-RAJ-JOY-KAL",
    "district_code": "BD-RAJ-JOY",
    "name_en": "Kalai",
    "name_bn": "কালাই",
    "bbs_code": "BD50380058",
    "postal_codes": [
      "5930"
    ]
  },
  {
    "code": "BD-RAJ-JOY-KHE",
    "district_code": "BD-RAJ-JOY",
    "name_en": "Khetlal",
    "name_bn": "ক্ষেতলাল",
    "bbs_code": "BD50380061",
    "postal_codes": [
      "5920"
    ]
  },
  {
    "code": "BD-RAJ-JOY-PAN",
    "district_code": "BD-RAJ-JOY",
    "name_en": "Panchbibi",
    "name_bn": "পাঁচবিবি",
    "bbs_code": "BD50380074",
    "postal_codes": [
      "5910"
    ]
  },
  {
    "code": "BD-RAJ-NAO-ATR",
    "district_code": "BD-RAJ-NAO",
    "name_en": "Atrai",
    "name_bn": "আত্রাই",
    "bbs_code": "BD50640003",
    "postal_codes": [
      "6596"
    ]
  },
  {
    "code": "BD-RAJ-NAO-BAD",
    "district_code": "BD-RAJ-NAO",
    "name_en": "Badalgachhi",
    "name_bn": "বদলগাছী",
    "bbs_code": "BD50640006",
    "postal_codes": [
      "6570"
    ]
  },
  {
    "code": "BD-RAJ-NAO-DHA",
    "district_code": "BD-RAJ-NAO",
    "name_en": "Dhamoirhat",
    "name_bn": "ধামইরহাট",
    "bbs_code": "BD50640028",
    "postal_codes": [
      "6520"
    ]
  },
  {
    "code": "BD-RAJ-NAO-MAH",
    "district_code": "BD-RAJ-NAO",
    "name_en": "Mahadebpur",
    "name_bn": "মহাদেবপুর",
    "bbs_code": "BD50640050",
    "postal_codes": [
      "6530"
    ]
  },
  {
    "code": "BD-RAJ-NAO-MAN",
    "district_code": "BD-RAJ-NAO",
    "name_en": "Manda",
    "name_bn": "মান্দা",
    "bbs_code": "BD50640047",
    "postal_codes": [
      "1410"
    ]
  },
  {
    "code": "BD-RAJ-NAO-NAO",
    "district_code": "BD-RAJ-NAO",
    "name_en": "Naogaon Sadar",
    "name_bn": "নওগাঁ সদর",
    "bbs_code": "BD50640060",
    "postal_codes": [
      "6500"
    ]
  },
  {
    "code": "BD-RAJ-NAO-NIA",
    "district_code": "BD-RAJ-NAO",
    "name_en": "Niamatpur",
    "name_bn": "নিয়ামতপুর",
    "bbs_code": "BD50640069",
    "postal_codes": [
      "6520"
    ]
  },
  {
    "code": "BD-RAJ-NAO-PAT",
    "district_code": "BD-RAJ-NAO",
    "name_en": "Patnitala",
    "name_bn": "পত্নিতলা",
    "bbs_code": "BD50640075",
    "postal_codes": [
      "6540"
    ]
  },
  {
    "code": "BD-RAJ-NAO-POR",
    "district_code": "BD-RAJ-NAO",
    "name_en": "Porsha",
    "name_bn": "পোরশা",
    "bbs_code": "BD50640079",
    "postal_codes": [
      "6550"
    ]
  },
  {
    "code": "BD-RAJ-NAO-RAN",
    "district_code": "BD-RAJ-NAO",
    "name_en": "Raninagar",
    "name_bn": "রাণীনগর",
    "bbs_code": "BD50640085",
    "postal_codes": [
      "6591"
    ]
  },
  {
    "code": "BD-RAJ-NAO-SAP",
    "district_code": "BD-RAJ-NAO",
    "name_en": "Sapahar",
    "name_bn": "সাপাহার",
    "bbs_code": "BD50640086",
    "postal_codes": [
      "6561"
    ]
  },
  {
    "code": "BD-RAJ-NAT-BAG",
    "district_code": "BD-RAJ-NAT",
    "name_en": "Bagatipara",
    "name_bn": "বাগাতিপাড়া",
    "bbs_code": "BD50690009",
    "postal_codes": [
      "6410"
    ]
  },
  {
    "code": "BD-RAJ-NAT-BAR",
    "district_code": "BD-RAJ-NAT",
    "name_en": "Baraigram",
    "name_bn": "বড়াইগ্রাম",
    "bbs_code": "BD50690015",
    "postal_codes": [
      "6430"
    ]
  },
  {
    "code": "BD-RAJ-NAT-GUR",
    "district_code": "BD-RAJ-NAT",
    "name_en": "Gurudaspur",
    "name_bn": "গুরুদাসপুর",
    "bbs_code": "BD50690041",
    "postal_codes": [
      "6440"
    ]
  },
  {
    "code": "BD-RAJ-NAT-LAL",
    "district_code": "BD-RAJ-NAT",
    "name_en": "Lalpur",
    "name_bn": "লালপুর",
    "bbs_code": "BD50690044",
    "postal_codes": [
      "6422"
    ]
  },
  {
    "code": "BD-RAJ-NAT-NAL",
    "district_code": "BD-RAJ-NAT",
    "name_en": "Naldanga",
    "name_bn": "নলডাঙ্গা",
    "bbs_code": "BD50690055",
    "postal_codes": [
      "7351"
    ]
  },
  {
    "code": "BD-RAJ-NAT-NAT",
    "district_code": "BD-RAJ-NAT",
    "name_en": "Natore Sadar",
    "name_bn": "নাটোর সদর",
    "bbs_code": "BD50690063",
    "postal_codes": [
      "6402"
    ]
  },
  {
    "code": "BD-RAJ-NAT-SIN",
    "district_code": "BD-RAJ-NAT",
    "name_en": "Singra",
    "name_bn": "সিংড়া",
    "bbs_code": "BD50690091",
    "postal_codes": [
      "6450"
    ]
  },
  {
    "code": "BD-RAJ-PAB-ATG",
    "district_code": "BD-RAJ-PAB",
    "name_en": "Atgharia",
    "name_bn": "আটঘরিয়া",
    "bbs_code": "BD50760005",
    "postal_codes": [
      "6610"
    ]
  },
  {
    "code": "BD-RAJ-PAB-BER",
    "district_code": "BD-RAJ-PAB",
    "name_en": "Bera",
    "name_bn": "বেড়া",
    "bbs_code": "BD50760016",
    "postal_codes": [
      "6680"
    ]
  },
  {
    "code": "BD-RAJ-PAB-BHA",
    "district_code": "BD-RAJ-PAB",
    "name_en": "Bhangura",
    "name_bn": "ভাঙ্গুড়া",
    "bbs_code": "BD50760019",
    "postal_codes": [
      "6640"
    ]
  },
  {
    "code": "BD-RAJ-PAB-CHA",
    "district_code": "BD-RAJ-PAB",
    "name_en": "Chatmohar",
    "name_bn": "চাটমোহর",
    "bbs_code": "BD50760022",
    "postal_codes": [
      "6630"
    ]
  },
  {
    "code": "BD-RAJ-PAB-FAR",
    "district_code": "BD-RAJ-PAB",
    "name_en": "Faridpur",
    "name_bn": "ফরিদপুর",
    "bbs_code": "BD50760033",
    "postal_codes": [
      "6650"
    ]
  },
  {
    "code": "BD-RAJ-PAB-ISH",
    "district_code": "BD-RAJ-PAB",
    "name_en": "Ishwardi",
    "name_bn": "ঈশ্বরদী",
    "bbs_code": "BD50760039",
    "postal_codes": [
      "6621"
    ]
  },
  {
    "code": "BD-RAJ-PAB-PAB",
    "district_code": "BD-RAJ-PAB",
    "name_en": "Pabna Sadar",
    "name_bn": "পাবনা সদর",
    "bbs_code": "BD50760055",
    "postal_codes": [
      "6602"
    ]
  },
  {
    "code": "BD-RAJ-PAB-SAN",
    "district_code": "BD-RAJ-PAB",
    "name_en": "Santhia",
    "name_bn": "সাঁথিয়া",
    "bbs_code": "BD50760072",
    "postal_codes": [
      "6680"
    ]
  },
  {
    "code": "BD-RAJ-PAB-SUJ",
    "district_code": "BD-RAJ-PAB",
    "name_en": "Sujanagar",
    "name_bn": "সুজানগর",
    "bbs_code": "BD50760083",
    "postal_codes": [
      "6661"
    ]
  },
  {
    "code": "BD-RAJ-RAJ-BAG",
    "district_code": "BD-RAJ-RAJ",
    "name_en": "Bagha",
    "name_bn": "বাঘা",
    "bbs_code": "BD50810010",
    "postal_codes": [
      "6281"
    ]
  },
  {
    "code": "BD-RAJ-RAJ-BAA",
    "district_code": "BD-RAJ-RAJ",
    "name_en": "Bagmara",
    "name_bn": "বাগমারা",
    "bbs_code": "BD50810012",
    "postal_codes": [
      "6251"
    ]
  },
  {
    "code": "BD-RAJ-RAJ-CHA",
    "district_code": "BD-RAJ-RAJ",
    "name_en": "Charghat",
    "name_bn": "চারঘাট",
    "bbs_code": "BD50810025",
    "postal_codes": [
      "6270"
    ]
  },
  {
    "code": "BD-RAJ-RAJ-DUR",
    "district_code": "BD-RAJ-RAJ",
    "name_en": "Durgapur",
    "name_bn": "দুর্গাপুর",
    "bbs_code": "BD50810031",
    "postal_codes": [
      "6240"
    ]
  },
  {
    "code": "BD-RAJ-RAJ-GOD",
    "district_code": "BD-RAJ-RAJ",
    "name_en": "Godagari",
    "name_bn": "গোদাগাড়ী",
    "bbs_code": "BD50810034",
    "postal_codes": [
      "6290"
    ]
  },
  {
    "code": "BD-RAJ-RAJ-MOH",
    "district_code": "BD-RAJ-RAJ",
    "name_en": "Mohanpur",
    "name_bn": "লালমোহন",
    "bbs_code": "BD50810053",
    "postal_codes": [
      "6321"
    ]
  },
  {
    "code": "BD-RAJ-RAJ-PAB",
    "district_code": "BD-RAJ-RAJ",
    "name_en": "Paba",
    "name_bn": "পবা",
    "bbs_code": "BD50810072",
    "postal_codes": [
      "6210"
    ]
  },
  {
    "code": "BD-RAJ-RAJ-PUT",
    "district_code": "BD-RAJ-RAJ",
    "name_en": "Puthia",
    "name_bn": "পুঠিয়া",
    "bbs_code": "BD50810082",
    "postal_codes": [
      "6670"
    ]
  },
  {
    "code": "BD-RAJ-RAJ-TAN",
    "district_code": "BD-RAJ-RAJ",
    "name_en": "Tanore",
    "name_bn": "তানোর",
    "bbs_code": "BD50810094",
    "postal_codes": [
      "6230"
    ]
  },
  {
    "code": "BD-RAJ-SIR-BEL",
    "district_code": "BD-RAJ-SIR",
    "name_en": "Belkuchi",
    "name_bn": "বেলকুচি",
    "bbs_code": "BD50880011",
    "postal_codes": [
      "6740"
    ]
  },
  {
    "code": "BD-RAJ-SIR-CHO",
    "district_code": "BD-RAJ-SIR",
    "name_en": "Chouhali",
    "name_bn": "চৌহালি",
    "bbs_code": "BD50880027",
    "postal_codes": [
      "1930"
    ]
  },
  {
    "code": "BD-RAJ-SIR-KAM",
    "district_code": "BD-RAJ-SIR",
    "name_en": "Kamarkhanda",
    "name_bn": "কামারখন্দ",
    "bbs_code": "BD50880044",
    "postal_codes": [
      "6730"
    ]
  },
  {
    "code": "BD-RAJ-SIR-KAZ",
    "district_code": "BD-RAJ-SIR",
    "name_en": "Kazipur",
    "name_bn": "কাজীপুর",
    "bbs_code": "BD50880050",
    "postal_codes": [
      "6712"
    ]
  },
  {
    "code": "BD-RAJ-SIR-RAY",
    "district_code": "BD-RAJ-SIR",
    "name_en": "Rayganj",
    "name_bn": "রায়গঞ্জ",
    "bbs_code": "BD50880061",
    "postal_codes": [
      "6721"
    ]
  },
  {
    "code": "BD-RAJ-SIR-SHA",
    "district_code": "BD-RAJ-SIR",
    "name_en": "Shahjadpur",
    "name_bn": "শাহজাদপুর",
    "bbs_code": "BD50880067",
    "postal_codes": [
      "6772"
    ]
  },
  {
    "code": "BD-RAJ-SIR-SIR",
    "district_code": "BD-RAJ-SIR",
    "name_en": "Sirajganj Sadar",
    "name_bn": "সিরাজগঞ্জ সদর",
    "bbs_code": "BD50880078",
    "postal_codes": [
      "6701"
    ]
  },
  {
    "code": "BD-RAJ-SIR-TAR",
    "district_code": "BD-RAJ-SIR",
    "name_en": "Tarash",
    "name_bn": "তাড়াশ",
    "bbs_code": "BD50880089",
    "postal_codes": [
      "6780"
    ]
  },
  {
    "code": "BD-RAJ-SIR-ULL",
    "district_code": "BD-RAJ-SIR",
    "name_en": "Ullapara",
    "name_bn": "উল্লাপাড়া",
    "bbs_code": "BD50880094",
    "postal_codes": [
      "6762"
    ]
  },
  {
    "code": "BD-BAR-BRG-AMT",
    "district_code": "BD-BAR-BRG",
    "name_en": "Amtali",
    "name_bn": "আমতলী",
    "bbs_code": "BD10040009",
    "postal_codes": [
      "8710"
    ]
  },
  {
    "code": "BD-BAR-BRG-BAM",
    "district_code": "BD-BAR-BRG",
    "name_en": "Bamna",
    "name_bn": "বামনা",
    "bbs_code": "BD10040019",
    "postal_codes": [
      "8730"
    ]
  },
  {
    "code": "BD-BAR-BRG-BAR",
    "district_code": "BD-BAR-BRG",
    "name_en": "Barguna Sadar",
    "name_bn": "বরগুনা সদর",
    "bbs_code": "BD10040028",
    "postal_codes": [
      "8700"
    ]
  },
  {
    "code": "BD-BAR-BRG-BET",
    "district_code": "BD-BAR-BRG",
    "name_en": "Betagi",
    "name_bn": "বেতাগী",
    "bbs_code": "BD10040047",
    "postal_codes": [
      "8740"
    ]
  },
  {
    "code": "BD-BAR-BRG-PAT",
    "district_code": "BD-BAR-BRG",
    "name_en": "Patharghata",
    "name_bn": "চারঘাট",
    "bbs_code": "BD10040085",
    "postal_codes": [
      "8721"
    ]
  },
  {
    "code": "BD-BAR-BRG-TAL",
    "district_code": "BD-BAR-BRG",
    "name_en": "Taltali",
    "name_bn": "তালতলি",
    "bbs_code": "BD10040090",
    "postal_codes": [
      "8710"
    ]
  },
  {
    "code": "BD-BAR-BAR-AGA",
    "district_code": "BD-BAR-BAR",
    "name_en": "Agailjhara",
    "name_bn": "আগৈলঝাড়া",
    "bbs_code": "BD10060002",
    "postal_codes": [
      "8240"
    ]
  },
  {
    "code": "BD-BAR-BAR-BAB",
    "district_code": "BD-BAR-BAR",
    "name_en": "Babuganj",
    "name_bn": "বাবুগঞ্জ",
    "bbs_code": "BD10060003",
    "postal_codes": [
      "8210"
    ]
  },
  {
    "code": "BD-BAR-BAR-BAK",
    "district_code": "BD-BAR-BAR",
    "name_en": "Bakerganj",
    "name_bn": "বাকেরগঞ্জ",
    "bbs_code": "BD10060007",
    "postal_codes": [
      "8432"
    ]
  },
  {
    "code": "BD-BAR-BAR-BAN",
    "district_code": "BD-BAR-BAR",
    "name_en": "Banaripara",
    "name_bn": "বানারীপাড়া",
    "bbs_code": "BD10060010",
    "postal_codes": [
      "8530"
    ]
  },
  {
    "code": "BD-BAR-BAR-BAR",
    "district_code": "BD-BAR-BAR",
    "name_en": "Barishal Sadar (Kotwali)",
    "name_bn": "বরিশাল সদর (কোতোয়ালি)",
    "bbs_code": "BD10060051",
    "postal_codes": [
      "8200"
    ]
  },
  {
    "code": "BD-BAR-BAR-GAU",
    "district_code": "BD-BAR-BAR",
    "name_en": "Gaurnadi",
    "name_bn": "গৌরনদী",
    "bbs_code": "BD10060032",
    "postal_codes": [
      "8240"
    ]
  },
  {
    "code": "BD-BAR-BAR-HIJ",
    "district_code": "BD-BAR-BAR",
    "name_en": "Hijla",
    "name_bn": "হিজলা",
    "bbs_code": "BD10060036",
    "postal_codes": [
      "8250"
    ]
  },
  {
    "code": "BD-BAR-BAR-MEH",
    "district_code": "BD-BAR-BAR",
    "name_en": "Mehendiganj",
    "name_bn": "মেহেন্দিগঞ্জ",
    "bbs_code": "BD10060062",
    "postal_codes": [
      "8274"
    ]
  },
  {
    "code": "BD-BAR-BAR-MUL",
    "district_code": "BD-BAR-BAR",
    "name_en": "Muladi",
    "name_bn": "মুলাদী",
    "bbs_code": "BD10060069",
    "postal_codes": [
      "8252"
    ]
  },
  {
    "code": "BD-BAR-BAR-UJI",
    "district_code": "BD-BAR-BAR",
    "name_en": "Ujirpur",
    "name_bn": "মিরপুর",
    "bbs_code": "BD10060094",
    "postal_codes": [
      "8223"
    ]
  },
  {
    "code": "BD-BAR-BHO-BHO",
    "district_code": "BD-BAR-BHO",
    "name_en": "Bhola Sadar",
    "name_bn": "ভোলা সদর",
    "bbs_code": "BD10090018",
    "postal_codes": [
      "8300"
    ]
  },
  {
    "code": "BD-BAR-BHO-BOR",
    "district_code": "BD-BAR-BHO",
    "name_en": "Borhanuddin",
    "name_bn": "বোরহানউদ্দিন",
    "bbs_code": "BD10090021",
    "postal_codes": [
      "8320"
    ]
  },
  {
    "code": "BD-BAR-BHO-CHA",
    "district_code": "BD-BAR-BHO",
    "name_en": "Charfasson",
    "name_bn": "চরফ্যাশন",
    "bbs_code": "BD10090025",
    "postal_codes": [
      "8340"
    ]
  },
  {
    "code": "BD-BAR-BHO-DAU",
    "district_code": "BD-BAR-BHO",
    "name_en": "Daulatkhan",
    "name_bn": "দৌলতখান",
    "bbs_code": "BD10090029",
    "postal_codes": [
      "8310"
    ]
  },
  {
    "code": "BD-BAR-BHO-LAL",
    "district_code": "BD-BAR-BHO",
    "name_en": "Lalmohan",
    "name_bn": "লালমোহন",
    "bbs_code": "BD10090054",
    "postal_codes": [
      "8331"
    ]
  },
  {
    "code": "BD-BAR-BHO-MON",
    "district_code": "BD-BAR-BHO",
    "name_en": "Monpura",
    "name_bn": "মনপুরা",
    "bbs_code": "BD10090065",
    "postal_codes": [
      "8360"
    ]
  },
  {
    "code": "BD-BAR-BHO-TAZ",
    "district_code": "BD-BAR-BHO",
    "name_en": "Tazumuddin",
    "name_bn": "তজুমদ্দিন",
    "bbs_code": "BD10090091",
    "postal_codes": [
      "8320"
    ]
  },
  {
    "code": "BD-BAR-JHA-JHA",
    "district_code": "BD-BAR-JHA",
    "name_en": "Jhalokathi Sadar",
    "name_bn": "ঝালকাঠি সদর",
    "bbs_code": "BD10420040",
    "postal_codes": [
      "8402"
    ]
  },
  {
    "code": "BD-BAR-JHA-KAN",
    "district_code": "BD-BAR-JHA",
    "name_en": "Kanthalia",
    "name_bn": "কাঠালিয়া",
    "bbs_code": "BD10420043",
    "postal_codes": [
      "8431"
    ]
  },
  {
    "code": "BD-BAR-JHA-NAL",
    "district_code": "BD-BAR-JHA",
    "name_en": "Nalchhity",
    "name_bn": "নলছিটি",
    "bbs_code": "BD10420073",
    "postal_codes": [
      "8421"
    ]
  },
  {
    "code": "BD-BAR-JHA-RAJ",
    "district_code": "BD-BAR-JHA",
    "name_en": "Rajapur",
    "name_bn": "রাজাপুর",
    "bbs_code": "BD10420084",
    "postal_codes": [
      "8410"
    ]
  },
  {
    "code": "BD-BAR-PAT-BAU",
    "district_code": "BD-BAR-PAT",
    "name_en": "Bauphal",
    "name_bn": "বাউফল",
    "bbs_code": "BD10780038",
    "postal_codes": [
      "8621"
    ]
  },
  {
    "code": "BD-BAR-PAT-DAS",
    "district_code": "BD-BAR-PAT",
    "name_en": "Dashmina",
    "name_bn": "দশমিনা",
    "bbs_code": "BD10780052",
    "postal_codes": [
      "8630"
    ]
  },
  {
    "code": "BD-BAR-PAT-DUM",
    "district_code": "BD-BAR-PAT",
    "name_en": "Dumki",
    "name_bn": "দুমকি",
    "bbs_code": "BD10780055",
    "postal_codes": [
      "8602"
    ]
  },
  {
    "code": "BD-BAR-PAT-GAL",
    "district_code": "BD-BAR-PAT",
    "name_en": "Galachipa",
    "name_bn": "গলাচিপা",
    "bbs_code": "BD10780057",
    "postal_codes": [
      "8640"
    ]
  },
  {
    "code": "BD-BAR-PAT-KAL",
    "district_code": "BD-BAR-PAT",
    "name_en": "Kalapara",
    "name_bn": "কলাপাড়া",
    "bbs_code": "BD10780066",
    "postal_codes": [
      "6762"
    ]
  },
  {
    "code": "BD-BAR-PAT-MIR",
    "district_code": "BD-BAR-PAT",
    "name_en": "Mirzaganj",
    "name_bn": "মির্জাগঞ্জ",
    "bbs_code": "BD10780076",
    "postal_codes": [
      "8610"
    ]
  },
  {
    "code": "BD-BAR-PAT-PAT",
    "district_code": "BD-BAR-PAT",
    "name_en": "Patuakhali Sadar",
    "name_bn": "পটুয়াখালী সদর",
    "bbs_code": "BD10780095",
    "postal_codes": [
      "8602"
    ]
  },
  {
    "code": "BD-BAR-PAT-RAN",
    "district_code": "BD-BAR-PAT",
    "name_en": "Rangabali",
    "name_bn": "রাঙ্গাবালী",
    "bbs_code": "BD10780097",
    "postal_codes": [
      "8640"
    ]
  },
  {
    "code": "BD-BAR-PIR-BHA",
    "district_code": "BD-BAR-PIR",
    "name_en": "Bhandaria",
    "name_bn": "ভান্ডারিয়া",
    "bbs_code": "BD10790014",
    "postal_codes": [
      "8550"
    ]
  },
  {
    "code": "BD-BAR-PIR-IND",
    "district_code": "BD-BAR-PIR",
    "name_en": "Indurkani",
    "name_bn": "ইন্দুরকানী",
    "bbs_code": "BD10790090",
    "postal_codes": [
      "8502"
    ]
  },
  {
    "code": "BD-BAR-PIR-KAW",
    "district_code": "BD-BAR-PIR",
    "name_en": "Kawkhali",
    "name_bn": "কাউখালী",
    "bbs_code": "BD10790047",
    "postal_codes": [
      "4510"
    ]
  },
  {
    "code": "BD-BAR-PIR-MAT",
    "district_code": "BD-BAR-PIR",
    "name_en": "Mathbaria",
    "name_bn": "মঠবাড়ীয়া",
    "bbs_code": "BD10790058",
    "postal_codes": [
      "8565"
    ]
  },
  {
    "code": "BD-BAR-PIR-NAZ",
    "district_code": "BD-BAR-PIR",
    "name_en": "Nazirpur",
    "name_bn": "নাজিরপুর",
    "bbs_code": "BD10790076",
    "postal_codes": [
      "8540"
    ]
  },
  {
    "code": "BD-BAR-PIR-NES",
    "district_code": "BD-BAR-PIR",
    "name_en": "Nesarabad (Swarupkathi)",
    "name_bn": "নেছারাবাদ (স্বরূপকাঠি)",
    "bbs_code": "BD10790087",
    "postal_codes": [
      "8522"
    ]
  },
  {
    "code": "BD-BAR-PIR-PIR",
    "district_code": "BD-BAR-PIR",
    "name_en": "Pirojpur Sadar",
    "name_bn": "পিরোজপুর সদর",
    "bbs_code": "BD10790080",
    "postal_codes": [
      "8501"
    ]
  },
  {
    "code": "BD-MYM-JAM-BAK",
    "district_code": "BD-MYM-JAM",
    "name_en": "Bakshiganj",
    "name_bn": "বকশীগঞ্জ",
    "bbs_code": "BD45390007",
    "postal_codes": [
      "2140"
    ]
  },
  {
    "code": "BD-MYM-JAM-DEW",
    "district_code": "BD-MYM-JAM",
    "name_en": "Dewanganj",
    "name_bn": "দেওয়ানগঞ্জ",
    "bbs_code": "BD45390015",
    "postal_codes": [
      "2030"
    ]
  },
  {
    "code": "BD-MYM-JAM-ISL",
    "district_code": "BD-MYM-JAM",
    "name_en": "Islampur",
    "name_bn": "ইসলামপুর",
    "bbs_code": "BD45390029",
    "postal_codes": [
      "2021"
    ]
  },
  {
    "code": "BD-MYM-JAM-JAM",
    "district_code": "BD-MYM-JAM",
    "name_en": "Jamalpur Sadar",
    "name_bn": "জামালপুর সদর",
    "bbs_code": "BD45390036",
    "postal_codes": [
      "2000"
    ]
  },
  {
    "code": "BD-MYM-JAM-MAD",
    "district_code": "BD-MYM-JAM",
    "name_en": "Madarganj",
    "name_bn": "মাদারগঞ্জ",
    "bbs_code": "BD45390058",
    "postal_codes": [
      "5430"
    ]
  },
  {
    "code": "BD-MYM-JAM-MEL",
    "district_code": "BD-MYM-JAM",
    "name_en": "Melandaha",
    "name_bn": "মেলান্দহ",
    "bbs_code": "BD45390061",
    "postal_codes": [
      "2011"
    ]
  },
  {
    "code": "BD-MYM-JAM-SAR",
    "district_code": "BD-MYM-JAM",
    "name_en": "Sarishabari",
    "name_bn": "সরিষাবাড়ী",
    "bbs_code": "BD45390085",
    "postal_codes": [
      "2052"
    ]
  },
  {
    "code": "BD-MYM-MYM-BHA",
    "district_code": "BD-MYM-MYM",
    "name_en": "Bhaluka",
    "name_bn": "ভালুকা",
    "bbs_code": "BD45610013",
    "postal_codes": [
      "2240"
    ]
  },
  {
    "code": "BD-MYM-MYM-DHO",
    "district_code": "BD-MYM-MYM",
    "name_en": "Dhobaura",
    "name_bn": "ধোবাউড়া",
    "bbs_code": "BD45610016",
    "postal_codes": [
      "2416"
    ]
  },
  {
    "code": "BD-MYM-MYM-FUL",
    "district_code": "BD-MYM-MYM",
    "name_en": "Fulbaria",
    "name_bn": "ফুলবাড়ীয়া",
    "bbs_code": "BD45610020",
    "postal_codes": [
      "2216"
    ]
  },
  {
    "code": "BD-MYM-MYM-FUR",
    "district_code": "BD-MYM-MYM",
    "name_en": "Fulpur",
    "name_bn": "ফুলপুর",
    "bbs_code": "BD45610081",
    "postal_codes": [
      "2251"
    ]
  },
  {
    "code": "BD-MYM-MYM-GAF",
    "district_code": "BD-MYM-MYM",
    "name_en": "Gafargaon",
    "name_bn": "গফরগাঁও",
    "bbs_code": "BD45610022",
    "postal_codes": [
      "2230"
    ]
  },
  {
    "code": "BD-MYM-MYM-GOU",
    "district_code": "BD-MYM-MYM",
    "name_en": "Gouripur",
    "name_bn": "গৌরীপুর",
    "bbs_code": "BD45610023",
    "postal_codes": [
      "2270"
    ]
  },
  {
    "code": "BD-MYM-MYM-HAL",
    "district_code": "BD-MYM-MYM",
    "name_en": "Haluaghat",
    "name_bn": "হালুয়াঘাট",
    "bbs_code": "BD45610024",
    "postal_codes": [
      "2261"
    ]
  },
  {
    "code": "BD-MYM-MYM-ISH",
    "district_code": "BD-MYM-MYM",
    "name_en": "Ishwarganj",
    "name_bn": "ঈশ্বরগঞ্জ",
    "bbs_code": "BD45610031",
    "postal_codes": [
      "2282"
    ]
  },
  {
    "code": "BD-MYM-MYM-MUK",
    "district_code": "BD-MYM-MYM",
    "name_en": "Muktagachha",
    "name_bn": "মুক্তাগাছা",
    "bbs_code": "BD45610065",
    "postal_codes": [
      "2210"
    ]
  },
  {
    "code": "BD-MYM-MYM-MYM",
    "district_code": "BD-MYM-MYM",
    "name_en": "Mymensingh Sadar",
    "name_bn": "ময়মনসিংহ সদর",
    "bbs_code": "BD45610052",
    "postal_codes": [
      "2202"
    ]
  },
  {
    "code": "BD-MYM-MYM-NAN",
    "district_code": "BD-MYM-MYM",
    "name_en": "Nandail",
    "name_bn": "নান্দাইল",
    "bbs_code": "BD45610072",
    "postal_codes": [
      "2291"
    ]
  },
  {
    "code": "BD-MYM-MYM-TAR",
    "district_code": "BD-MYM-MYM",
    "name_en": "Tarakanda",
    "name_bn": "তারাকান্দা",
    "bbs_code": "BD45610088",
    "postal_codes": [
      "2252"
    ]
  },
  {
    "code": "BD-MYM-MYM-TRI",
    "district_code": "BD-MYM-MYM",
    "name_en": "Trishal",
    "name_bn": "ত্রিশাল",
    "bbs_code": "BD45610094",
    "postal_codes": [
      "2221"
    ]
  },
  {
    "code": "BD-MYM-undefined-ATP",
    "district_code": "BD-MYM-undefined",
    "name_en": "Atpara",
    "name_bn": "আটপাড়া",
    "bbs_code": "BD45720004",
    "postal_codes": [
      "2470"
    ]
  },
  {
    "code": "BD-MYM-undefined-BAR",
    "district_code": "BD-MYM-undefined",
    "name_en": "Barhatta",
    "name_bn": "বারহাট্টা",
    "bbs_code": "BD45720009",
    "postal_codes": [
      "2440"
    ]
  },
  {
    "code": "BD-MYM-undefined-DUR",
    "district_code": "BD-MYM-undefined",
    "name_en": "Durgapur",
    "name_bn": "দুর্গাপুর",
    "bbs_code": "BD45720018",
    "postal_codes": [
      "6240"
    ]
  },
  {
    "code": "BD-MYM-undefined-KAL",
    "district_code": "BD-MYM-undefined",
    "name_en": "Kalmakanda",
    "name_bn": "কলমাকান্দা",
    "bbs_code": "BD45720040",
    "postal_codes": [
      "2430"
    ]
  },
  {
    "code": "BD-MYM-undefined-KEN",
    "district_code": "BD-MYM-undefined",
    "name_en": "Kendua",
    "name_bn": "কেন্দুয়া",
    "bbs_code": "BD45720047",
    "postal_codes": [
      "2480"
    ]
  },
  {
    "code": "BD-MYM-undefined-KHA",
    "district_code": "BD-MYM-undefined",
    "name_en": "Khaliajuri",
    "name_bn": "খালিয়াজুরী",
    "bbs_code": "BD45720038",
    "postal_codes": [
      "2460"
    ]
  },
  {
    "code": "BD-MYM-undefined-MAD",
    "district_code": "BD-MYM-undefined",
    "name_en": "Madan",
    "name_bn": "মদন",
    "bbs_code": "BD45720056",
    "postal_codes": [
      "2490"
    ]
  },
  {
    "code": "BD-MYM-undefined-MOH",
    "district_code": "BD-MYM-undefined",
    "name_en": "Mohanganj",
    "name_bn": "মোহনগঞ্জ",
    "bbs_code": "BD45720063",
    "postal_codes": [
      "2446"
    ]
  },
  {
    "code": "BD-MYM-undefined-NET",
    "district_code": "BD-MYM-undefined",
    "name_en": "Netrakona Sadar",
    "name_bn": "নেত্রকোণা সদর",
    "bbs_code": "BD45720074",
    "postal_codes": [
      "2401"
    ]
  },
  {
    "code": "BD-MYM-undefined-PUR",
    "district_code": "BD-MYM-undefined",
    "name_en": "Purbadhala",
    "name_bn": "পূর্বধলা",
    "bbs_code": "BD45720083",
    "postal_codes": [
      "2412"
    ]
  },
  {
    "code": "BD-MYM-SHE-JHE",
    "district_code": "BD-MYM-SHE",
    "name_en": "Jhenaigati",
    "name_bn": "ঝিনাইগাতী",
    "bbs_code": "BD45890037",
    "postal_codes": [
      "2120"
    ]
  },
  {
    "code": "BD-MYM-SHE-NAK",
    "district_code": "BD-MYM-SHE",
    "name_en": "Nakla",
    "name_bn": "নকলা",
    "bbs_code": "BD45890067",
    "postal_codes": [
      "2151"
    ]
  },
  {
    "code": "BD-MYM-SHE-NAL",
    "district_code": "BD-MYM-SHE",
    "name_en": "Nalitabari",
    "name_bn": "নালিতাবাড়ী",
    "bbs_code": "BD45890070",
    "postal_codes": [
      "2111"
    ]
  },
  {
    "code": "BD-MYM-SHE-SHE",
    "district_code": "BD-MYM-SHE",
    "name_en": "Sherpur Sadar",
    "name_bn": "শেরপুর সদর",
    "bbs_code": "BD45890088",
    "postal_codes": [
      "7101"
    ]
  },
  {
    "code": "BD-MYM-SHE-SRE",
    "district_code": "BD-MYM-SHE",
    "name_en": "Sreebardi",
    "name_bn": "শ্রীবরদী",
    "bbs_code": "BD45890090",
    "postal_codes": [
      "2130"
    ]
  },
  {
    "code": "BD-RNG-DIN-BIR",
    "district_code": "BD-RNG-DIN",
    "name_en": "Birampur",
    "name_bn": "বিরামপুর",
    "bbs_code": "BD55270010",
    "postal_codes": [
      "5266"
    ]
  },
  {
    "code": "BD-RNG-DIN-BIJ",
    "district_code": "BD-RNG-DIN",
    "name_en": "Birganj",
    "name_bn": "বীরগঞ্জ",
    "bbs_code": "BD55270012",
    "postal_codes": [
      "5220"
    ]
  },
  {
    "code": "BD-RNG-DIN-BIL",
    "district_code": "BD-RNG-DIN",
    "name_en": "Birol",
    "name_bn": "বিরল",
    "bbs_code": "BD55270017",
    "postal_codes": [
      "5210"
    ]
  },
  {
    "code": "BD-RNG-DIN-BOC",
    "district_code": "BD-RNG-DIN",
    "name_en": "Bochaganj",
    "name_bn": "বোচাগঞ্জ",
    "bbs_code": "BD55270021",
    "postal_codes": [
      "5216"
    ]
  },
  {
    "code": "BD-RNG-DIN-CHI",
    "district_code": "BD-RNG-DIN",
    "name_en": "Chirirbandar",
    "name_bn": "চিরিরবন্দর",
    "bbs_code": "BD55270030",
    "postal_codes": [
      "5240"
    ]
  },
  {
    "code": "BD-RNG-DIN-DIN",
    "district_code": "BD-RNG-DIN",
    "name_en": "Dinajpur Sadar",
    "name_bn": "দিনাজপুর সদর",
    "bbs_code": "BD55270064",
    "postal_codes": [
      "5201"
    ]
  },
  {
    "code": "BD-RNG-DIN-FUL",
    "district_code": "BD-RNG-DIN",
    "name_en": "Fulbari",
    "name_bn": "ফুলবাড়ী",
    "bbs_code": "BD55270038",
    "postal_codes": [
      "2216"
    ]
  },
  {
    "code": "BD-RNG-DIN-GHO",
    "district_code": "BD-RNG-DIN",
    "name_en": "Ghoraghat",
    "name_bn": "ঘোড়াঘাট",
    "bbs_code": "BD55270043",
    "postal_codes": [
      "5282"
    ]
  },
  {
    "code": "BD-RNG-DIN-HAK",
    "district_code": "BD-RNG-DIN",
    "name_en": "Hakimpur",
    "name_bn": "হাকিমপুর",
    "bbs_code": "BD55270047",
    "postal_codes": [
      "5270"
    ]
  },
  {
    "code": "BD-RNG-DIN-KAH",
    "district_code": "BD-RNG-DIN",
    "name_en": "Kaharole",
    "name_bn": "কাহারোল",
    "bbs_code": "BD55270056",
    "postal_codes": [
      "5226"
    ]
  },
  {
    "code": "BD-RNG-DIN-KHA",
    "district_code": "BD-RNG-DIN",
    "name_en": "Khansama",
    "name_bn": "খানসামা",
    "bbs_code": "BD55270060",
    "postal_codes": [
      "5230"
    ]
  },
  {
    "code": "BD-RNG-DIN-NAB",
    "district_code": "BD-RNG-DIN",
    "name_en": "Nababganj",
    "name_bn": "নবাবগঞ্জ",
    "bbs_code": "BD55270069",
    "postal_codes": [
      "5281"
    ]
  },
  {
    "code": "BD-RNG-DIN-PAR",
    "district_code": "BD-RNG-DIN",
    "name_en": "Parbatipur",
    "name_bn": "পার্বতীপুর",
    "bbs_code": "BD55270077",
    "postal_codes": [
      "5250"
    ]
  },
  {
    "code": "BD-RNG-GAI-FUL",
    "district_code": "BD-RNG-GAI",
    "name_en": "Fulchhari",
    "name_bn": "ফুলছড়ি",
    "bbs_code": "BD55320021",
    "postal_codes": [
      "5761"
    ]
  },
  {
    "code": "BD-RNG-GAI-GAI",
    "district_code": "BD-RNG-GAI",
    "name_en": "Gaibandha Sadar",
    "name_bn": "গাইবান্ধা সদর",
    "bbs_code": "BD55320024",
    "postal_codes": [
      "5700"
    ]
  },
  {
    "code": "BD-RNG-GAI-GOB",
    "district_code": "BD-RNG-GAI",
    "name_en": "Gobindaganj",
    "name_bn": "গোবিন্দগঞ্জ",
    "bbs_code": "BD55320030",
    "postal_codes": [
      "5740"
    ]
  },
  {
    "code": "BD-RNG-GAI-PAL",
    "district_code": "BD-RNG-GAI",
    "name_en": "Palashbari",
    "name_bn": "পলাশবাড়ী",
    "bbs_code": "BD55320067",
    "postal_codes": [
      "5730"
    ]
  },
  {
    "code": "BD-RNG-GAI-SAD",
    "district_code": "BD-RNG-GAI",
    "name_en": "Sadullapur",
    "name_bn": "সাদুল্লাপুর",
    "bbs_code": "BD55320082",
    "postal_codes": [
      "5711"
    ]
  },
  {
    "code": "BD-RNG-GAI-SAG",
    "district_code": "BD-RNG-GAI",
    "name_en": "Saghata",
    "name_bn": "সাঘাটা",
    "bbs_code": "BD55320088",
    "postal_codes": [
      "1982"
    ]
  },
  {
    "code": "BD-RNG-GAI-SUN",
    "district_code": "BD-RNG-GAI",
    "name_en": "Sundarganj",
    "name_bn": "সুন্দরগঞ্জ",
    "bbs_code": "BD55320091",
    "postal_codes": [
      "5721"
    ]
  },
  {
    "code": "BD-RNG-KUR-BHU",
    "district_code": "BD-RNG-KUR",
    "name_en": "Bhurungamari",
    "name_bn": "ভুরুঙ্গামারী",
    "bbs_code": "BD55490006",
    "postal_codes": [
      "5670"
    ]
  },
  {
    "code": "BD-RNG-KUR-CHI",
    "district_code": "BD-RNG-KUR",
    "name_en": "Chilmari",
    "name_bn": "চিলমারী",
    "bbs_code": "BD55490009",
    "postal_codes": [
      "5630"
    ]
  },
  {
    "code": "BD-RNG-KUR-KUR",
    "district_code": "BD-RNG-KUR",
    "name_en": "Kurigram Sadar",
    "name_bn": "কুড়িগ্রাম সদর",
    "bbs_code": "BD55490052",
    "postal_codes": [
      "5600"
    ]
  },
  {
    "code": "BD-RNG-KUR-NAG",
    "district_code": "BD-RNG-KUR",
    "name_en": "Nageshwari",
    "name_bn": "নাগেশ্বরী",
    "bbs_code": "BD55490061",
    "postal_codes": [
      "5660"
    ]
  },
  {
    "code": "BD-RNG-KUR-PHU",
    "district_code": "BD-RNG-KUR",
    "name_en": "Phulbari",
    "name_bn": "ফুলবাড়ী",
    "bbs_code": "BD55490018",
    "postal_codes": [
      "5260"
    ]
  },
  {
    "code": "BD-RNG-KUR-RAJ",
    "district_code": "BD-RNG-KUR",
    "name_en": "Rajarhat",
    "name_bn": "রাজারহাট",
    "bbs_code": "BD55490077",
    "postal_codes": [
      "5611"
    ]
  },
  {
    "code": "BD-RNG-KUR-RAR",
    "district_code": "BD-RNG-KUR",
    "name_en": "Rajibpur",
    "name_bn": "চর রাজিবপুর",
    "bbs_code": "BD55490008",
    "postal_codes": [
      "5650"
    ]
  },
  {
    "code": "BD-RNG-KUR-ROU",
    "district_code": "BD-RNG-KUR",
    "name_en": "Roumari",
    "name_bn": "রৌমারী",
    "bbs_code": "BD55490079",
    "postal_codes": [
      "5640"
    ]
  },
  {
    "code": "BD-RNG-KUR-ULI",
    "district_code": "BD-RNG-KUR",
    "name_en": "Ulipur",
    "name_bn": "উলিপুর",
    "bbs_code": "BD55490094",
    "postal_codes": [
      "5621"
    ]
  },
  {
    "code": "BD-RNG-LAL-ADI",
    "district_code": "BD-RNG-LAL",
    "name_en": "Aditmari",
    "name_bn": "আদিতমারী",
    "bbs_code": "BD55520002",
    "postal_codes": [
      "5510"
    ]
  },
  {
    "code": "BD-RNG-LAL-HAT",
    "district_code": "BD-RNG-LAL",
    "name_en": "Hatibandha",
    "name_bn": "হাতীবান্ধা",
    "bbs_code": "BD55520033",
    "postal_codes": [
      "5530"
    ]
  },
  {
    "code": "BD-RNG-LAL-KAL",
    "district_code": "BD-RNG-LAL",
    "name_en": "Kaliganj",
    "name_bn": "কালীগঞ্জ",
    "bbs_code": "BD55520039",
    "postal_codes": [
      "1720"
    ]
  },
  {
    "code": "BD-RNG-LAL-LAL",
    "district_code": "BD-RNG-LAL",
    "name_en": "Lalmonirhat Sadar",
    "name_bn": "লালমনিরহাট সদর",
    "bbs_code": "BD55520055",
    "postal_codes": [
      "5502"
    ]
  },
  {
    "code": "BD-RNG-LAL-PAT",
    "district_code": "BD-RNG-LAL",
    "name_en": "Patgram",
    "name_bn": "পাটগ্রাম",
    "bbs_code": "BD55520070",
    "postal_codes": [
      "5541"
    ]
  },
  {
    "code": "BD-RNG-NIL-DIM",
    "district_code": "BD-RNG-NIL",
    "name_en": "Dimla",
    "name_bn": "ডিমলা",
    "bbs_code": "BD55730012",
    "postal_codes": [
      "5350"
    ]
  },
  {
    "code": "BD-RNG-NIL-DOM",
    "district_code": "BD-RNG-NIL",
    "name_en": "Domar",
    "name_bn": "ডোমার",
    "bbs_code": "BD55730015",
    "postal_codes": [
      "5341"
    ]
  },
  {
    "code": "BD-RNG-NIL-JAL",
    "district_code": "BD-RNG-NIL",
    "name_en": "Jaldhaka",
    "name_bn": "জলঢাকা",
    "bbs_code": "BD55730036",
    "postal_codes": [
      "5330"
    ]
  },
  {
    "code": "BD-RNG-NIL-KIS",
    "district_code": "BD-RNG-NIL",
    "name_en": "Kishoreganj",
    "name_bn": "কিশোরগঞ্জ সদর",
    "bbs_code": "BD55730045",
    "postal_codes": [
      "5320"
    ]
  },
  {
    "code": "BD-RNG-NIL-NIL",
    "district_code": "BD-RNG-NIL",
    "name_en": "Nilphamari Sadar",
    "name_bn": "নীলফামারী সদর",
    "bbs_code": "BD55730064",
    "postal_codes": [
      "5300"
    ]
  },
  {
    "code": "BD-RNG-NIL-SAI",
    "district_code": "BD-RNG-NIL",
    "name_en": "Saidpur",
    "name_bn": "ফরিদপুর",
    "bbs_code": "BD55730085",
    "postal_codes": [
      "5310"
    ]
  },
  {
    "code": "BD-RNG-PAN-ATO",
    "district_code": "BD-RNG-PAN",
    "name_en": "Atowari",
    "name_bn": "আটোয়ারী",
    "bbs_code": "BD55770004",
    "postal_codes": [
      "5041"
    ]
  },
  {
    "code": "BD-RNG-PAN-BOD",
    "district_code": "BD-RNG-PAN",
    "name_en": "Boda",
    "name_bn": "বোদা",
    "bbs_code": "BD55770025",
    "postal_codes": [
      "5010"
    ]
  },
  {
    "code": "BD-RNG-PAN-DEB",
    "district_code": "BD-RNG-PAN",
    "name_en": "Debiganj",
    "name_bn": "দেবীগঞ্জ",
    "bbs_code": "BD55770034",
    "postal_codes": [
      "5020"
    ]
  },
  {
    "code": "BD-RNG-PAN-PAN",
    "district_code": "BD-RNG-PAN",
    "name_en": "Panchagarh Sadar",
    "name_bn": "পঞ্চগড় সদর",
    "bbs_code": "BD55770073",
    "postal_codes": [
      "5000"
    ]
  },
  {
    "code": "BD-RNG-PAN-TET",
    "district_code": "BD-RNG-PAN",
    "name_en": "Tetulia",
    "name_bn": "তেতুলিয়া",
    "bbs_code": "BD55770090",
    "postal_codes": [
      "5030"
    ]
  },
  {
    "code": "BD-RNG-RNG-BAD",
    "district_code": "BD-RNG-RNG",
    "name_en": "Badarganj",
    "name_bn": "মাদারগঞ্জ",
    "bbs_code": "BD55850003",
    "postal_codes": [
      "5430"
    ]
  },
  {
    "code": "BD-RNG-RNG-GAN",
    "district_code": "BD-RNG-RNG",
    "name_en": "Gangachara",
    "name_bn": "গংগাচড়া",
    "bbs_code": "BD55850027",
    "postal_codes": [
      "5410"
    ]
  },
  {
    "code": "BD-RNG-RNG-KAU",
    "district_code": "BD-RNG-RNG",
    "name_en": "Kaunia",
    "name_bn": "কাউনিয়া",
    "bbs_code": "BD55850042",
    "postal_codes": [
      "5441"
    ]
  },
  {
    "code": "BD-RNG-RNG-MIT",
    "district_code": "BD-RNG-RNG",
    "name_en": "Mithapukur",
    "name_bn": "মিঠাপুকুর",
    "bbs_code": "BD55850058",
    "postal_codes": [
      "5460"
    ]
  },
  {
    "code": "BD-RNG-RNG-PIR",
    "district_code": "BD-RNG-RNG",
    "name_en": "Pirgachha",
    "name_bn": "পীরগাছা",
    "bbs_code": "BD55850073",
    "postal_codes": [
      "5450"
    ]
  },
  {
    "code": "BD-RNG-RNG-PIJ",
    "district_code": "BD-RNG-RNG",
    "name_en": "Pirganj",
    "name_bn": "পীরগঞ্জ",
    "bbs_code": "BD55850076",
    "postal_codes": [
      "5110"
    ]
  },
  {
    "code": "BD-RNG-RNG-RAN",
    "district_code": "BD-RNG-RNG",
    "name_en": "Rangpur Sadar",
    "name_bn": "রংপুর সদর",
    "bbs_code": "BD55850049",
    "postal_codes": [
      "5402"
    ]
  },
  {
    "code": "BD-RNG-RNG-TAR",
    "district_code": "BD-RNG-RNG",
    "name_en": "Taraganj",
    "name_bn": "বালাগঞ্জ",
    "bbs_code": "BD55850092",
    "postal_codes": [
      "5420"
    ]
  },
  {
    "code": "BD-RNG-THA-BAL",
    "district_code": "BD-RNG-THA",
    "name_en": "Baliadangi",
    "name_bn": "বালিয়াডাঙ্গী",
    "bbs_code": "BD55940008",
    "postal_codes": [
      "5140"
    ]
  },
  {
    "code": "BD-RNG-THA-HAR",
    "district_code": "BD-RNG-THA",
    "name_en": "Haripur",
    "name_bn": "হরিপুর",
    "bbs_code": "BD55940051",
    "postal_codes": [
      "1741"
    ]
  },
  {
    "code": "BD-RNG-THA-PIR",
    "district_code": "BD-RNG-THA",
    "name_en": "Pirganj",
    "name_bn": "পীরগঞ্জ",
    "bbs_code": "BD55940082",
    "postal_codes": [
      "5110"
    ]
  },
  {
    "code": "BD-RNG-THA-RAN",
    "district_code": "BD-RNG-THA",
    "name_en": "Ranishankail",
    "name_bn": "রাণীশংকৈল",
    "bbs_code": "BD55940086",
    "postal_codes": [
      "5120"
    ]
  },
  {
    "code": "BD-RNG-THA-THA",
    "district_code": "BD-RNG-THA",
    "name_en": "Thakurgaon Sadar",
    "name_bn": "ঠাকুরগাঁও সদর",
    "bbs_code": "BD55940094",
    "postal_codes": [
      "5103"
    ]
  },
  {
    "code": "BD-SYL-HAB-AJM",
    "district_code": "BD-SYL-HAB",
    "name_en": "Ajmiriganj",
    "name_bn": "আজমিরীগঞ্জ",
    "bbs_code": "BD60360002",
    "postal_codes": [
      "3360"
    ]
  },
  {
    "code": "BD-SYL-HAB-BAH",
    "district_code": "BD-SYL-HAB",
    "name_en": "Bahubal",
    "name_bn": "বাহুবল",
    "bbs_code": "BD60360005",
    "postal_codes": [
      "3310"
    ]
  },
  {
    "code": "BD-SYL-HAB-BAN",
    "district_code": "BD-SYL-HAB",
    "name_en": "Baniachong",
    "name_bn": "বানিয়াচং",
    "bbs_code": "BD60360011",
    "postal_codes": [
      "3350"
    ]
  },
  {
    "code": "BD-SYL-HAB-CHU",
    "district_code": "BD-SYL-HAB",
    "name_en": "Chunarughat",
    "name_bn": "চুনারুঘাট",
    "bbs_code": "BD60360026",
    "postal_codes": [
      "3321"
    ]
  },
  {
    "code": "BD-SYL-HAB-HAB",
    "district_code": "BD-SYL-HAB",
    "name_en": "Habiganj Sadar",
    "name_bn": "হবিগঞ্জ সদর",
    "bbs_code": "BD60360044",
    "postal_codes": [
      "3302"
    ]
  },
  {
    "code": "BD-SYL-HAB-LAK",
    "district_code": "BD-SYL-HAB",
    "name_en": "Lakhai",
    "name_bn": "লাখাই",
    "bbs_code": "BD60360068",
    "postal_codes": [
      "3340"
    ]
  },
  {
    "code": "BD-SYL-HAB-MAD",
    "district_code": "BD-SYL-HAB",
    "name_en": "Madhabpur",
    "name_bn": "মাধবপুর",
    "bbs_code": "BD60360071",
    "postal_codes": [
      "3331"
    ]
  },
  {
    "code": "BD-SYL-HAB-NAB",
    "district_code": "BD-SYL-HAB",
    "name_en": "Nabiganj",
    "name_bn": "নবীগঞ্জ",
    "bbs_code": "BD60360077",
    "postal_codes": [
      "3373"
    ]
  },
  {
    "code": "BD-SYL-HAB-SHA",
    "district_code": "BD-SYL-HAB",
    "name_en": "Shayestaganj",
    "name_bn": "শায়েস্তাগঞ্জ",
    "bbs_code": "BD60360087",
    "postal_codes": [
      "3342"
    ]
  },
  {
    "code": "BD-SYL-MOU-BAR",
    "district_code": "BD-SYL-MOU",
    "name_en": "Baralekha",
    "name_bn": "বড়লেখা",
    "bbs_code": "BD60580014",
    "postal_codes": [
      "3250"
    ]
  },
  {
    "code": "BD-SYL-MOU-JUR",
    "district_code": "BD-SYL-MOU",
    "name_en": "Juri",
    "name_bn": "জুড়ী",
    "bbs_code": "BD60580035",
    "postal_codes": [
      "3251"
    ]
  },
  {
    "code": "BD-SYL-MOU-KAM",
    "district_code": "BD-SYL-MOU",
    "name_en": "Kamalganj",
    "name_bn": "জামালগঞ্জ",
    "bbs_code": "BD60580056",
    "postal_codes": [
      "3220"
    ]
  },
  {
    "code": "BD-SYL-MOU-KUL",
    "district_code": "BD-SYL-MOU",
    "name_en": "Kulaura",
    "name_bn": "কুলাউড়া",
    "bbs_code": "BD60580065",
    "postal_codes": [
      "3237"
    ]
  },
  {
    "code": "BD-SYL-MOU-MOU",
    "district_code": "BD-SYL-MOU",
    "name_en": "Moulvibazar Sadar",
    "name_bn": "মৌলভীবাজার সদর",
    "bbs_code": "BD60580074",
    "postal_codes": [
      "3203"
    ]
  },
  {
    "code": "BD-SYL-MOU-RAJ",
    "district_code": "BD-SYL-MOU",
    "name_en": "Rajnagar",
    "name_bn": "রাজনগর",
    "bbs_code": "BD60580080",
    "postal_codes": [
      "3240"
    ]
  },
  {
    "code": "BD-SYL-MOU-SRE",
    "district_code": "BD-SYL-MOU",
    "name_en": "Sreemangal",
    "name_bn": "শ্রীমঙ্গল",
    "bbs_code": "BD60580083",
    "postal_codes": [
      "3214"
    ]
  },
  {
    "code": "BD-SYL-SUN-BIS",
    "district_code": "BD-SYL-SUN",
    "name_en": "Bishwambharpur",
    "name_bn": "বিশ্বম্ভরপুর",
    "bbs_code": "BD60900018",
    "postal_codes": [
      "3060"
    ]
  },
  {
    "code": "BD-SYL-SUN-CHH",
    "district_code": "BD-SYL-SUN",
    "name_en": "Chhatak",
    "name_bn": "ছাতক",
    "bbs_code": "BD60900023",
    "postal_codes": [
      "3080"
    ]
  },
  {
    "code": "BD-SYL-SUN-DER",
    "district_code": "BD-SYL-SUN",
    "name_en": "Derai",
    "name_bn": "দিরাই",
    "bbs_code": "BD60900029",
    "postal_codes": [
      "3002"
    ]
  },
  {
    "code": "BD-SYL-SUN-DHA",
    "district_code": "BD-SYL-SUN",
    "name_en": "Dharmapasha",
    "name_bn": "ধর্মপাশা",
    "bbs_code": "BD60900032",
    "postal_codes": [
      "2450"
    ]
  },
  {
    "code": "BD-SYL-SUN-DOW",
    "district_code": "BD-SYL-SUN",
    "name_en": "Dowarabazar",
    "name_bn": "দোয়ারাবাজার",
    "bbs_code": "BD60900033",
    "postal_codes": [
      "3000"
    ]
  },
  {
    "code": "BD-SYL-SUN-JAG",
    "district_code": "BD-SYL-SUN",
    "name_en": "Jagannathpur",
    "name_bn": "জগন্নাথপুর",
    "bbs_code": "BD60900047",
    "postal_codes": [
      "3062"
    ]
  },
  {
    "code": "BD-SYL-SUN-JAM",
    "district_code": "BD-SYL-SUN",
    "name_en": "Jamalganj",
    "name_bn": "জামালগঞ্জ",
    "bbs_code": "BD60900050",
    "postal_codes": [
      "3220"
    ]
  },
  {
    "code": "BD-SYL-SUN-MAD",
    "district_code": "BD-SYL-SUN",
    "name_en": "Madhyanagar",
    "name_bn": "মধ্যনগর",
    "bbs_code": "BD60900063",
    "postal_codes": [
      "3040"
    ]
  },
  {
    "code": "BD-SYL-SUN-SHA",
    "district_code": "BD-SYL-SUN",
    "name_en": "Shalla",
    "name_bn": "শাল্লা",
    "bbs_code": "BD60900086",
    "postal_codes": [
      "3050"
    ]
  },
  {
    "code": "BD-SYL-SUN-SHJ",
    "district_code": "BD-SYL-SUN",
    "name_en": "Shantiganj",
    "name_bn": "শান্তিগঞ্জ",
    "bbs_code": "BD60900087",
    "postal_codes": [
      "3060"
    ]
  },
  {
    "code": "BD-SYL-SUN-SUN",
    "district_code": "BD-SYL-SUN",
    "name_en": "Sunamganj Sadar",
    "name_bn": "সুনামগঞ্জ সদর",
    "bbs_code": "BD60900089",
    "postal_codes": [
      "3001"
    ]
  },
  {
    "code": "BD-SYL-SUN-TAH",
    "district_code": "BD-SYL-SUN",
    "name_en": "Tahirpur",
    "name_bn": "তাহিরপুর",
    "bbs_code": "BD60900092",
    "postal_codes": [
      "3030"
    ]
  },
  {
    "code": "BD-SYL-SYL-BAL",
    "district_code": "BD-SYL-SYL",
    "name_en": "Balaganj",
    "name_bn": "বালাগঞ্জ",
    "bbs_code": "BD60910008",
    "postal_codes": [
      "3120"
    ]
  },
  {
    "code": "BD-SYL-SYL-BEA",
    "district_code": "BD-SYL-SYL",
    "name_en": "Beanibazar",
    "name_bn": "বিয়ানীবাজার",
    "bbs_code": "BD60910017",
    "postal_codes": [
      "3170"
    ]
  },
  {
    "code": "BD-SYL-SYL-BIS",
    "district_code": "BD-SYL-SYL",
    "name_en": "Bishwanath",
    "name_bn": "বিশ্বনাথ",
    "bbs_code": "BD60910020",
    "postal_codes": [
      "3130"
    ]
  },
  {
    "code": "BD-SYL-SYL-COM",
    "district_code": "BD-SYL-SYL",
    "name_en": "Companiganj",
    "name_bn": "কোম্পানীগঞ্জ",
    "bbs_code": "BD60910027",
    "postal_codes": [
      "3140"
    ]
  },
  {
    "code": "BD-SYL-SYL-DAK",
    "district_code": "BD-SYL-SYL",
    "name_en": "Dakkhin Surma",
    "name_bn": "দক্ষিণ সুরমা",
    "bbs_code": "BD60910031",
    "postal_codes": [
      "3106"
    ]
  },
  {
    "code": "BD-SYL-SYL-FEN",
    "district_code": "BD-SYL-SYL",
    "name_en": "Fenchuganj",
    "name_bn": "ফেঞ্চুগঞ্জ",
    "bbs_code": "BD60910035",
    "postal_codes": [
      "3116"
    ]
  },
  {
    "code": "BD-SYL-SYL-GOL",
    "district_code": "BD-SYL-SYL",
    "name_en": "Golapganj",
    "name_bn": "গোলাপগঞ্জ",
    "bbs_code": "BD60910038",
    "postal_codes": [
      "3165"
    ]
  },
  {
    "code": "BD-SYL-SYL-GOW",
    "district_code": "BD-SYL-SYL",
    "name_en": "Gowainghat",
    "name_bn": "গোয়াইনঘাট",
    "bbs_code": "BD60910041",
    "postal_codes": [
      "3150"
    ]
  },
  {
    "code": "BD-SYL-SYL-JAI",
    "district_code": "BD-SYL-SYL",
    "name_en": "Jaintapur",
    "name_bn": "জৈন্তাপুর",
    "bbs_code": "BD60910053",
    "postal_codes": [
      "3152"
    ]
  },
  {
    "code": "BD-SYL-SYL-KAN",
    "district_code": "BD-SYL-SYL",
    "name_en": "Kanaighat",
    "name_bn": "কানাইঘাট",
    "bbs_code": "BD60910059",
    "postal_codes": [
      "3181"
    ]
  },
  {
    "code": "BD-SYL-SYL-OSM",
    "district_code": "BD-SYL-SYL",
    "name_en": "Osmaninagar",
    "name_bn": "ওসমানী নগর",
    "bbs_code": "BD60910060",
    "postal_codes": [
      "6591"
    ]
  },
  {
    "code": "BD-SYL-SYL-SYL",
    "district_code": "BD-SYL-SYL",
    "name_en": "Sylhet Sadar",
    "name_bn": "সিলেট সদর",
    "bbs_code": "BD60910062",
    "postal_codes": [
      "3106"
    ]
  },
  {
    "code": "BD-SYL-SYL-ZAK",
    "district_code": "BD-SYL-SYL",
    "name_en": "Zakiganj",
    "name_bn": "জকিগঞ্জ",
    "bbs_code": "BD60910094",
    "postal_codes": [
      "3191"
    ]
  }
]
