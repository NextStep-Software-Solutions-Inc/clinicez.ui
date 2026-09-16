import type { DiscountType } from "@prisma/client";

export interface LineItemForCalculation {
  unitPrice: number;
  quantity: number;
  isVatable?: boolean;
}

export interface TaxCalculationResult {
  rawSubtotal: number;
  vatableSales: number;
  vatExemptSales: number;
  vatAmount: number;
  discountAmount: number;
  discountRatePercent: number;
  totalAmount: number;
}

/**
 * Calculates itemized Philippine tax and discount breakdowns compliant with:
 * - RA 9994 (Expanded Senior Citizens Act)
 * - RA 10754 (An Act Expanding the Benefits and Privileges of Persons with Disability)
 * - RA 11976 (Ease of Paying Taxes Act - 2024)
 *
 * PH Statutory Discount Rule:
 * 1. For Senior Citizen or PWD discounts:
 *    - The vatable amount is made VAT-exempt: Net = Gross / (1 + vatRate)
 *    - A 20% discount is applied to the net amount: Discount = Net * 0.20
 *    - Final Amount = Net - Discount
 *    - VAT is 0 (Exempt)
 */
export function calculateBillTotals(
  items: LineItemForCalculation[],
  discountType: DiscountType = "NONE",
  customDiscountPercent = 0,
  vatRate = 0.12 // 12% in the Philippines
): TaxCalculationResult {
  const rawSubtotal = items.reduce((sum, item) => sum + Number(item.unitPrice) * Number(item.quantity), 0);

  if (rawSubtotal <= 0) {
    return {
      rawSubtotal: 0,
      vatableSales: 0,
      vatExemptSales: 0,
      vatAmount: 0,
      discountAmount: 0,
      discountRatePercent: 0,
      totalAmount: 0,
    };
  }

  // 1. Senior Citizen or PWD (20% + VAT Exemption)
  if (discountType === "SENIOR_CITIZEN" || discountType === "PWD") {
    // Separate vatable vs non-vatable items
    let netTotal = 0;
    for (const item of items) {
      const itemGross = Number(item.unitPrice) * Number(item.quantity);
      if (item.isVatable !== false) {
        // Strip 12% VAT
        netTotal += itemGross / (1 + vatRate);
      } else {
        netTotal += itemGross;
      }
    }

    const discountRate = 0.20;
    const discountAmount = netTotal * discountRate;
    const finalPayable = netTotal - discountAmount;

    return {
      rawSubtotal: roundToTwoDecimals(rawSubtotal),
      vatableSales: 0,
      vatExemptSales: roundToTwoDecimals(netTotal),
      vatAmount: 0,
      discountAmount: roundToTwoDecimals(rawSubtotal - finalPayable),
      discountRatePercent: 20,
      totalAmount: roundToTwoDecimals(finalPayable),
    };
  }

  // 2. Custom or Employee Discount (Percentage)
  if (customDiscountPercent > 0) {
    const discountRate = customDiscountPercent / 100;
    const discountAmount = rawSubtotal * discountRate;
    const netTotal = rawSubtotal - discountAmount;

    const vatableSales = netTotal / (1 + vatRate);
    const vatAmount = netTotal - vatableSales;

    return {
      rawSubtotal: roundToTwoDecimals(rawSubtotal),
      vatableSales: roundToTwoDecimals(vatableSales),
      vatExemptSales: 0,
      vatAmount: roundToTwoDecimals(vatAmount),
      discountAmount: roundToTwoDecimals(discountAmount),
      discountRatePercent: customDiscountPercent,
      totalAmount: roundToTwoDecimals(netTotal),
    };
  }

  // 3. Regular Bill (No Discount)
  let vatableGross = 0;
  let exemptGross = 0;

  for (const item of items) {
    const itemTotal = Number(item.unitPrice) * Number(item.quantity);
    if (item.isVatable !== false) {
      vatableGross += itemTotal;
    } else {
      exemptGross += itemTotal;
    }
  }

  const vatableSales = vatableGross / (1 + vatRate);
  const vatAmount = vatableGross - vatableSales;

  return {
    rawSubtotal: roundToTwoDecimals(rawSubtotal),
    vatableSales: roundToTwoDecimals(vatableSales),
    vatExemptSales: roundToTwoDecimals(exemptGross),
    vatAmount: roundToTwoDecimals(vatAmount),
    discountAmount: 0,
    discountRatePercent: 0,
    totalAmount: roundToTwoDecimals(rawSubtotal),
  };
}

function roundToTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}
