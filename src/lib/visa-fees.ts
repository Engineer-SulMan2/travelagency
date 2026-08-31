export type VisaType = "TOURIST" | "BUSINESS" | "STUDENT" | "WORK" | "UMRAH" | "TRANSIT";

export const VISA_COUNTRIES = [
  "Saudi Arabia",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Schengen (Europe)",
  "Malaysia",
  "Thailand",
  "China",
] as const;

export const VISA_TYPES: { value: VisaType; label: string }[] = [
  { value: "TOURIST", label: "Tourist" },
  { value: "BUSINESS", label: "Business" },
  { value: "STUDENT", label: "Student" },
  { value: "WORK", label: "Work" },
  { value: "UMRAH", label: "Umrah" },
  { value: "TRANSIT", label: "Transit" },
];

// Base processing fee per country (PKR), before the visa-type multiplier.
// Stands in for a real visa-processing partner's fee schedule/API.
const BASE_FEE_BY_COUNTRY: Record<string, number> = {
  "Saudi Arabia": 45000,
  "United Arab Emirates": 15000,
  "United Kingdom": 35000,
  "United States": 40000,
  "Schengen (Europe)": 30000,
  Malaysia: 12000,
  Thailand: 10000,
  China: 18000,
};

const TYPE_MULTIPLIER: Record<VisaType, number> = {
  TOURIST: 1,
  BUSINESS: 1.3,
  STUDENT: 1.5,
  WORK: 1.8,
  UMRAH: 1,
  TRANSIT: 0.5,
};

/** Net processing fee per applicant, in PKR. */
export function getVisaNetFee(country: string, visaType: VisaType): number {
  const base = BASE_FEE_BY_COUNTRY[country] ?? 20000;
  const fee = base * TYPE_MULTIPLIER[visaType];
  return Math.round(fee / 100) * 100;
}
