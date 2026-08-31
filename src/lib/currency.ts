export const SUPPORTED_CURRENCIES = [
  { code: "PKR", symbol: "PKR", name: "Pakistani Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "SAR", symbol: "SAR", name: "Saudi Riyal" },
  { code: "GBP", symbol: "£", name: "British Pound" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export const DEFAULT_CURRENCY: CurrencyCode = "PKR";

// Mock exchange rates (PKR per 1 unit of foreign currency) — no live forex
// API is configured in this demo, so these are fixed approximate rates.
// All amounts are stored and calculated internally in PKR; this only
// converts for display.
const PKR_PER_UNIT: Record<CurrencyCode, number> = {
  PKR: 1,
  USD: 278,
  AED: 76,
  SAR: 74,
  GBP: 353,
};

export function isSupportedCurrency(value: string): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((c) => c.code === value);
}

export function convertFromPKR(amountInPkr: number, currency: CurrencyCode) {
  return amountInPkr / PKR_PER_UNIT[currency];
}

// Reverse of convertFromPKR — used when a live provider (e.g. Duffel Stays)
// returns a price in its own currency and we need to store it internally
// as PKR, since all stored/calculated amounts in this app are PKR-only.
export function convertToPKR(amount: number, currency: string): number {
  const code: CurrencyCode = isSupportedCurrency(currency) ? currency : DEFAULT_CURRENCY;
  return Math.round(amount * PKR_PER_UNIT[code]);
}

export function formatCurrency(amountInPkr: number, currency: string) {
  const code: CurrencyCode = isSupportedCurrency(currency) ? currency : DEFAULT_CURRENCY;
  const converted = convertFromPKR(amountInPkr, code);
  const symbol = SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
  const decimals = code === "PKR" ? 0 : 2;
  const formattedNumber = converted.toLocaleString("en-PK", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol} ${formattedNumber}`;
}