export const PARTNER_BASE_RATES: Record<string, number> = {
  "6_1": 6.50,
  "8_1": 8.00,
  "10_1": 9.50,
  "10_2": 8.00,
  "12_2": 9.50,
};

/**
 * Calculates the applicable partner commission rate (%) for a loan.
 * 
 * Rules:
 * 1. Base partner commission rate = School.partnerCommissionRate || Partner.defaultCommission || 1.0%
 * 2. If negotiated school discount rate exceeds the Partner Base Rate for that tenure/advanceEmi,
 *    the excess percentage is added directly to the partner's commission rate.
 *    Extra Commission Rate = max(0, schoolDiscountRate - partnerBaseRate)
 * 
 * Example: 6M/1A (Partner Base Rate = 6.5%). Closed at 7.5%.
 * Extra = 7.5% - 6.5% = 1.0%. Total Commission Rate = 1.0% (default) + 1.0% (extra) = 2.0%.
 */
export function calculatePartnerCommissionRate(params: {
  tenure: number;
  advanceEmi: number;
  schoolDiscountRate: number;
  partnerDefaultCommission?: number | null;
  schoolCommissionOverride?: number | null;
}): number {
  const { tenure, advanceEmi, schoolDiscountRate, partnerDefaultCommission, schoolCommissionOverride } = params;

  let baseCommission = partnerDefaultCommission !== null && partnerDefaultCommission !== undefined
    ? partnerDefaultCommission
    : 1.0;

  if (schoolCommissionOverride !== null && schoolCommissionOverride !== undefined) {
    baseCommission = schoolCommissionOverride;
  }

  const key = `${tenure}_${advanceEmi}`;
  const partnerBaseRate = PARTNER_BASE_RATES[key];

  let extraCommission = 0;
  if (partnerBaseRate !== undefined && schoolDiscountRate > partnerBaseRate) {
    extraCommission = schoolDiscountRate - partnerBaseRate;
  }

  return parseFloat((baseCommission + extraCommission).toFixed(4));
}
