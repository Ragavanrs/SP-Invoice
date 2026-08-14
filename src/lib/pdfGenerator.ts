import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { convertAmountToWords } from "./numberToWords";

export interface PDFInvoiceData {
  documentNo: string;
  documentType: "TAX_INVOICE" | "QUOTATION" | "DELIVERY_CHALLAN";
  date: string;
  poNumber?: string;
  deliveryChallanNo?: string;
  vehicleNumber?: string;
  driverName?: string;
  dispatchTime?: string;
  customer: {
    companyName: string;
    gstin?: string;
    address: string;
    shippingAddress?: string;
    phone: string;
  };
  items: Array<{
    description: string;
    hsnCode: string;
    quantity: number;
    unit?: string;
    rate: number;
    gstPercentage?: number;
    amount: number;
    remarks?: string;
  }>;
  subTotal: number;
  discount?: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  roundOff?: number;
  grandTotal: number;
  paymentStatus?: string;
  paymentMode?: string;
  terms?: string;
}

export async function generateA4PDFBuffer(data: PDFInvoiceData): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // Standard A4 Dimensions in Points
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const primaryColor = rgb(0.08, 0.22, 0.45); // Deep Blue Header
  const darkTextColor = rgb(0.1, 0.1, 0.1);
  const grayBorderColor = rgb(0.6, 0.6, 0.6);
  const lightBgColor = rgb(0.95, 0.96, 0.98);

  const margin = 25;
  const contentWidth = width - margin * 2;

  // Outer Border
  page.drawRectangle({
    x: margin,
    y: margin,
    width: contentWidth,
    height: height - margin * 2,
    borderColor: darkTextColor,
    borderWidth: 1.5,
  });

  // Top Header Banner
  let y = height - margin - 20;

  // Company GSTIN Top Left
  page.drawText("GSTIN : 33AKNPR3914K1ZT", {
    x: margin + 10,
    y,
    size: 9,
    font: fontBold,
    color: darkTextColor,
  });

  // Document Title Top Center
  const docTitle =
    data.documentType === "TAX_INVOICE"
      ? "TAX INVOICE"
      : data.documentType === "QUOTATION"
      ? "QUOTATION"
      : "DELIVERY CHALLAN";

  const titleWidth = fontBold.widthOfTextAtSize(docTitle, 12);
  page.drawText(docTitle, {
    x: (width - titleWidth) / 2,
    y,
    size: 12,
    font: fontBold,
    color: primaryColor,
  });

  // Mobile Top Right
  page.drawText("Mob : 9790987190", {
    x: width - margin - 110,
    y,
    size: 8.5,
    font: fontBold,
    color: darkTextColor,
  });
  page.drawText("9840841887", {
    x: width - margin - 86,
    y: y - 10,
    size: 8.5,
    font: fontBold,
    color: darkTextColor,
  });

  y -= 22;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: darkTextColor,
  });

  // Main Brand Title
  y -= 25;
  const brandName = "SURYA POWER";
  const brandWidth = fontBold.widthOfTextAtSize(brandName, 22);
  page.drawText(brandName, {
    x: (width - brandWidth) / 2,
    y,
    size: 22,
    font: fontBold,
    color: primaryColor,
  });

  // Subtitle / Tagline
  y -= 14;
  const subtitle = "DG Set Hiring, Old DG Set Buying, Selling & Servicing";
  const subWidth = fontBold.widthOfTextAtSize(subtitle, 10);
  page.drawText(subtitle, {
    x: (width - subWidth) / 2,
    y,
    size: 10,
    font: fontBold,
    color: darkTextColor,
  });

  // Address
  y -= 12;
  const addr = "No.1/11, G.N.T Road, Padiyanallur Redhills, Chennai, Thiruvallur, Tamil Nadu - 600 052.";
  const addrWidth = fontRegular.widthOfTextAtSize(addr, 8.5);
  page.drawText(addr, {
    x: (width - addrWidth) / 2,
    y,
    size: 8.5,
    font: fontRegular,
    color: darkTextColor,
  });

  y -= 12;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: darkTextColor,
  });

  // Customer & Meta Data Box Split (Left Customer, Right Meta)
  const metaBoxY = y;
  const colSplitX = width - margin - 200;

  y -= 15;
  // Left: Customer Details
  page.drawText("To:", { x: margin + 10, y, size: 9, font: fontBold });
  page.drawText(data.customer.companyName.toUpperCase(), {
    x: margin + 30,
    y,
    size: 9.5,
    font: fontBold,
    color: primaryColor,
  });

  y -= 12;
  const custAddrLines = data.customer.address.split("\n");
  custAddrLines.slice(0, 2).forEach((line) => {
    page.drawText(line, { x: margin + 30, y, size: 8, font: fontRegular });
    y -= 10;
  });

  if (data.customer.gstin) {
    page.drawText(`Party GSTIN : ${data.customer.gstin}`, {
      x: margin + 10,
      y,
      size: 8.5,
      font: fontBold,
    });
  }

  // Right Meta Column
  let rY = metaBoxY - 15;
  page.drawText(`${data.documentType === "TAX_INVOICE" ? "Invoice" : data.documentType === "QUOTATION" ? "Quotation" : "D.C."} No. :`, {
    x: colSplitX + 10,
    y: rY,
    size: 9,
    font: fontBold,
  });
  page.drawText(data.documentNo, {
    x: colSplitX + 85,
    y: rY,
    size: 9.5,
    font: fontBold,
    color: primaryColor,
  });

  rY -= 14;
  page.drawText("Date :", { x: colSplitX + 10, y: rY, size: 9, font: fontBold });
  page.drawText(data.date, { x: colSplitX + 85, y: rY, size: 9, font: fontRegular });

  if (data.poNumber) {
    rY -= 12;
    page.drawText("P.O. No. :", { x: colSplitX + 10, y: rY, size: 8.5, font: fontBold });
    page.drawText(data.poNumber, { x: colSplitX + 85, y: rY, size: 8.5, font: fontRegular });
  }

  if (data.deliveryChallanNo) {
    rY -= 12;
    page.drawText("D.C. No. :", { x: colSplitX + 10, y: rY, size: 8.5, font: fontBold });
    page.drawText(data.deliveryChallanNo, { x: colSplitX + 85, y: rY, size: 8.5, font: fontRegular });
  }

  if (data.vehicleNumber) {
    rY -= 12;
    page.drawText("Vehicle No :", { x: colSplitX + 10, y: rY, size: 8.5, font: fontBold });
    page.drawText(data.vehicleNumber, { x: colSplitX + 85, y: rY, size: 8.5, font: fontRegular });
  }

  y = Math.min(y - 5, rY - 5);

  // Vertical divider for Header meta box
  page.drawLine({
    start: { x: colSplitX, y: metaBoxY },
    end: { x: colSplitX, y },
    thickness: 1,
    color: darkTextColor,
  });

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: darkTextColor,
  });

  // Table Headers
  const tableHeaderY = y;
  const tableHeaderHeight = 20;
  y -= tableHeaderHeight;

  page.drawRectangle({
    x: margin,
    y,
    width: contentWidth,
    height: tableHeaderHeight,
    color: lightBgColor,
  });

  // Header Titles
  const headers = [
    { title: "S.No.", x: margin + 5, width: 35 },
    { title: "DESCRIPTION / PARTICULARS", x: margin + 45, width: 220 },
    { title: "HSN", x: margin + 270, width: 45 },
    { title: "QTY", x: margin + 320, width: 35 },
    { title: "GST%", x: margin + 360, width: 40 },
    { title: "RATE", x: margin + 405, width: 55 },
    { title: "AMOUNT (Rs.)", x: margin + 465, width: 75 },
  ];

  headers.forEach((h) => {
    page.drawText(h.title, {
      x: h.x,
      y: y + 5,
      size: 8,
      font: fontBold,
      color: darkTextColor,
    });
  });

  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: darkTextColor,
  });

  const tableStartY = y;
  const tableBottomY = margin + 175; // Leave space for Footer & Bank details

  // Render Table Rows
  data.items.forEach((item, index) => {
    if (y < tableBottomY + 25) return; // Prevent overflow

    y -= 18;
    // Zebra row background
    if (index % 2 === 1) {
      page.drawRectangle({
        x: margin + 1,
        y: y - 2,
        width: contentWidth - 2,
        height: 18,
        color: rgb(0.98, 0.98, 0.99),
      });
    }

    page.drawText(String(index + 1), { x: margin + 10, y: y + 3, size: 8, font: fontRegular });
    page.drawText(item.description.substring(0, 45), {
      x: margin + 45,
      y: y + 3,
      size: 8,
      font: fontRegular,
    });
    page.drawText(item.hsnCode || "8502", { x: margin + 272, y: y + 3, size: 8, font: fontRegular });
    page.drawText(String(item.quantity), { x: margin + 325, y: y + 3, size: 8, font: fontRegular });
    page.drawText(`${item.gstPercentage || 18}%`, {
      x: margin + 365,
      y: y + 3,
      size: 8,
      font: fontRegular,
    });
    page.drawText(item.rate.toFixed(2), { x: margin + 405, y: y + 3, size: 8, font: fontRegular });
    page.drawText(item.amount.toFixed(2), { x: margin + 465, y: y + 3, size: 8, font: fontBold });
  });

  // Vertical Column Grid Lines
  const colLines = [margin + 40, margin + 265, margin + 315, margin + 355, margin + 400, margin + 460];
  colLines.forEach((colX) => {
    page.drawLine({
      start: { x: colX, y: tableHeaderY },
      end: { x: colX, y: tableBottomY },
      thickness: 0.5,
      color: grayBorderColor,
    });
  });

  // Bottom Line of Table
  page.drawLine({
    start: { x: margin, y: tableBottomY },
    end: { x: width - margin, y: tableBottomY },
    thickness: 1,
    color: darkTextColor,
  });

  // Totals & Tax Breakdown Block (Bottom Right)
  let bY = tableBottomY;

  const totalsBoxX = margin + 320;
  const totalsBoxWidth = contentWidth - 320;

  // Left side of bottom block: Bank Details & Amount in Words
  let bankY = bY - 15;
  page.drawText("TAMILNAD MERCANTILE BANK", {
    x: margin + 10,
    y: bankY,
    size: 8.5,
    font: fontBold,
    color: primaryColor,
  });
  bankY -= 11;
  page.drawText("NAME          : SURYA POWER", { x: margin + 10, y: bankY, size: 8, font: fontBold });
  bankY -= 10;
  page.drawText("AC.NO           : 228150050800163", { x: margin + 10, y: bankY, size: 8, font: fontBold });
  bankY -= 10;
  page.drawText("BRANCH       : NARAVARIKUPPAM BRANCH", {
    x: margin + 10,
    y: bankY,
    size: 8,
    font: fontBold,
  });
  bankY -= 10;
  page.drawText("IFSC CODE   : TMBL0000228", { x: margin + 10, y: bankY, size: 8, font: fontBold });

  bankY -= 15;
  const words = convertAmountToWords(data.grandTotal);
  page.drawText(`Amount in Words: ${words}`, {
    x: margin + 10,
    y: bankY,
    size: 8,
    font: fontBold,
    color: darkTextColor,
  });

  // Right side of bottom block: SGST/CGST/Grand Total Table
  let tY = bY - 15;
  page.drawText("SUB TOTAL", { x: totalsBoxX + 10, y: tY, size: 8, font: fontBold });
  page.drawText(`Rs. ${data.subTotal.toFixed(2)}`, {
    x: width - margin - 80,
    y: tY,
    size: 8,
    font: fontRegular,
  });

  if (data.cgstAmount && data.cgstAmount > 0) {
    tY -= 12;
    page.drawText("CGST 9%", { x: totalsBoxX + 10, y: tY, size: 8, font: fontRegular });
    page.drawText(`Rs. ${data.cgstAmount.toFixed(2)}`, {
      x: width - margin - 80,
      y: tY,
      size: 8,
      font: fontRegular,
    });
  }

  if (data.sgstAmount && data.sgstAmount > 0) {
    tY -= 12;
    page.drawText("SGST 9%", { x: totalsBoxX + 10, y: tY, size: 8, font: fontRegular });
    page.drawText(`Rs. ${data.sgstAmount.toFixed(2)}`, {
      x: width - margin - 80,
      y: tY,
      size: 8,
      font: fontRegular,
    });
  }

  if (data.igstAmount && data.igstAmount > 0) {
    tY -= 12;
    page.drawText("IGST 18%", { x: totalsBoxX + 10, y: tY, size: 8, font: fontRegular });
    page.drawText(`Rs. ${data.igstAmount.toFixed(2)}`, {
      x: width - margin - 80,
      y: tY,
      size: 8,
      font: fontRegular,
    });
  }

  if (data.roundOff !== undefined && data.roundOff !== 0) {
    tY -= 12;
    page.drawText("ROUND OFF", { x: totalsBoxX + 10, y: tY, size: 8, font: fontRegular });
    page.drawText(`Rs. ${data.roundOff.toFixed(2)}`, {
      x: width - margin - 80,
      y: tY,
      size: 8,
      font: fontRegular,
    });
  }

  tY -= 15;
  page.drawRectangle({
    x: totalsBoxX,
    y: tY - 3,
    width: totalsBoxWidth,
    height: 18,
    color: lightBgColor,
  });
  page.drawText("GRAND TOTAL", {
    x: totalsBoxX + 10,
    y: tY,
    size: 9,
    font: fontBold,
    color: primaryColor,
  });
  page.drawText(`Rs. ${data.grandTotal.toFixed(2)}`, {
    x: width - margin - 90,
    y: tY,
    size: 10,
    font: fontBold,
    color: primaryColor,
  });

  // Vertical line separating Bank details and Totals box
  page.drawLine({
    start: { x: totalsBoxX, y: tableBottomY },
    end: { x: totalsBoxX, y: margin + 70 },
    thickness: 1,
    color: darkTextColor,
  });

  // Horizontal line above Terms & Signatures
  page.drawLine({
    start: { x: margin, y: margin + 70 },
    end: { x: width - margin, y: margin + 70 },
    thickness: 1,
    color: darkTextColor,
  });

  // Terms and Conditions Left
  let termY = margin + 60;
  page.drawText("1. Interest 24% p.a. will be charged on all invoices if not paid within due date.", {
    x: margin + 10,
    y: termY,
    size: 7,
    font: fontRegular,
  });
  termY -= 10;
  page.drawText("2. All Payment to be made only by crossed cheques drawn in own favour.", {
    x: margin + 10,
    y: termY,
    size: 7,
    font: fontRegular,
  });
  termY -= 10;
  page.drawText("3. PAYMENT WITHIN 30 DAYS.", { x: margin + 10, y: termY, size: 7, font: fontRegular });

  // Signature Block Right
  page.drawText("For SURYA POWER", {
    x: width - margin - 130,
    y: margin + 55,
    size: 9.5,
    font: fontBold,
    color: primaryColor,
  });
  page.drawText("Proprietor / Auth. Signatory", {
    x: width - margin - 145,
    y: margin + 15,
    size: 8,
    font: fontRegular,
  });

  // QR Code Generation for Invoice Payment / Verification
  try {
    const upiUri = `upi://pay?pa=228150050800163@tmb&pn=SURYA%20POWER&am=${data.grandTotal}&cu=INR&tn=${data.documentNo}`;
    const qrDataUrl = await QRCode.toDataURL(upiUri, { margin: 1 });
    const qrImageBytes = Buffer.from(qrDataUrl.split(",")[1], "base64");
    const qrEmbed = await pdfDoc.embedPng(qrImageBytes);
    page.drawImage(qrEmbed, {
      x: margin + 240,
      y: margin + 10,
      width: 52,
      height: 52,
    });
    page.drawText("Scan to Pay", { x: margin + 242, y: margin + 3, size: 6.5, font: fontRegular });
  } catch (err) {
    // QR code fallback ignored
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
