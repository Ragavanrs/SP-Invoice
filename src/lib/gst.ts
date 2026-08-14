export interface GSTBreakup {
  subTotal: number;
  discount: number;
  taxableAmount: number;
  isInterstate: boolean;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  rawTotal: number;
  roundOff: number;
  grandTotal: number;
}

export function calculateGST(
  items: Array<{ rate: number; quantity: number; discount?: number; gstPercentage?: number }>,
  customerStateCode: string = "33" // Tamil Nadu default
): GSTBreakup {
  const isInterstate = customerStateCode.trim() !== "33";

  let subTotal = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  items.forEach((item) => {
    const qty = item.quantity || 1;
    const rate = item.rate || 0;
    const disc = item.discount || 0;
    const itemSub = qty * rate;
    const itemTaxable = Math.max(0, itemSub - disc);
    const gstRate = item.gstPercentage || 18;

    subTotal += itemSub;
    totalDiscount += disc;
    taxableAmount += itemTaxable;

    if (isInterstate) {
      const igst = (itemTaxable * gstRate) / 100;
      totalIgst += igst;
    } else {
      const halfRate = gstRate / 2;
      const cgst = (itemTaxable * halfRate) / 100;
      const sgst = (itemTaxable * halfRate) / 100;
      totalCgst += cgst;
      totalSgst += sgst;
    }
  });

  const totalTax = totalCgst + totalSgst + totalIgst;
  const rawTotal = taxableAmount + totalTax;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Number((grandTotal - rawTotal).toFixed(2));

  return {
    subTotal: Number(subTotal.toFixed(2)),
    discount: Number(totalDiscount.toFixed(2)),
    taxableAmount: Number(taxableAmount.toFixed(2)),
    isInterstate,
    cgstRate: isInterstate ? 0 : 9,
    cgstAmount: Number(totalCgst.toFixed(2)),
    sgstRate: isInterstate ? 0 : 9,
    sgstAmount: Number(totalSgst.toFixed(2)),
    igstRate: isInterstate ? 18 : 0,
    igstAmount: Number(totalIgst.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    rawTotal: Number(rawTotal.toFixed(2)),
    roundOff,
    grandTotal,
  };
}
