// Pure pricing functions — no DB, no side effects — so they're cheap to
// unit test and are the single source of truth for how markup/commission
// numbers are derived across flights, hotels and packages.

export function computeMarkup(netFare: number, markupPct: number) {
  const markupAmount = Math.round(netFare * (markupPct / 100));
  const sellingFare = netFare + markupAmount;
  return { markupAmount, sellingFare };
}

export function computeCommissionSplit(totalMarkup: number, commissionPct: number) {
  const commissionAmount = Math.round(totalMarkup * (commissionPct / 100));
  const agencyShare = totalMarkup - commissionAmount;
  return { commissionAmount, agencyShare };
}

/**
 * Full pricing breakdown for `quantity` units (passengers / room-nights /
 * travelers) of a single net-fare line item.
 */
export function computeBookingPricing(netFare: number, markupPct: number, commissionPct: number, quantity: number) {
  const { markupAmount, sellingFare } = computeMarkup(netFare, markupPct);
  const totalAmount = sellingFare * quantity;
  const netCost = netFare * quantity;
  const totalMarkup = markupAmount * quantity;
  const { commissionAmount, agencyShare } = computeCommissionSplit(totalMarkup, commissionPct);

  return {
    markupAmount,
    sellingFare,
    totalAmount,
    netCost,
    totalMarkup,
    commissionAmount,
    agencyShare,
  };
}
