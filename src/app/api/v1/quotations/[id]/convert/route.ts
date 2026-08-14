import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getNextDocumentNumber } from "@/lib/sequence";
import { generateA4PDFBuffer } from "@/lib/pdfGenerator";
import { uploadPDFToDrive } from "@/lib/googleDrive";
import { logAudit } from "@/lib/audit";
import dayjs from "dayjs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (quotation.status === "CONVERTED" && quotation.convertedToInvoiceNo) {
      return NextResponse.json(
        { error: `Quotation already converted to Invoice ${quotation.convertedToInvoiceNo}` },
        { status: 400 }
      );
    }

    // 1. Generate Invoice Number (INV-2026-000001)
    const invoiceNo = await getNextDocumentNumber("INV");

    // 2. Create Tax Invoice from Quotation
    const taxInvoice = await prisma.taxInvoice.create({
      data: {
        invoiceNo,
        invoiceDate: new Date(),
        customerId: quotation.customerId,
        gstin: quotation.customer.gstin,
        billingAddress: quotation.customer.address,
        shippingAddress: quotation.customer.shippingAddress || quotation.customer.address,
        poNumber: `Ref QT ${quotation.quotationNo}`,
        subTotal: quotation.subTotal,
        discount: quotation.discount,
        taxableAmount: quotation.taxableAmount,
        cgstRate: quotation.cgst > 0 ? 9 : 0,
        cgstAmount: quotation.cgst,
        sgstRate: quotation.sgst > 0 ? 9 : 0,
        sgstAmount: quotation.sgst,
        igstRate: quotation.igst > 0 ? 18 : 0,
        igstAmount: quotation.igst,
        roundOff: quotation.roundOff,
        grandTotal: quotation.grandTotal,
        paymentStatus: "PENDING",
        paymentMode: "Cheque/NEFT",
        terms: quotation.terms,
        notes: quotation.notes,
        items: {
          create: quotation.items.map((i) => ({
            description: i.description,
            hsnCode: i.hsnCode,
            quantity: i.quantity,
            unit: i.unit,
            rate: i.rate,
            discount: i.discount,
            gstPercentage: i.gstPercentage,
            amount: i.amount,
          })),
        },
      },
      include: { customer: true, items: true },
    });

    // 3. Mark Quotation as CONVERTED
    await prisma.quotation.update({
      where: { id },
      data: {
        status: "CONVERTED",
        convertedToInvoiceNo: invoiceNo,
      },
    });

    await logAudit("Quotation", id, "CONVERT", authUser.name, authUser.id, `Converted Quotation ${quotation.quotationNo} to Invoice ${invoiceNo}`);

    // 4. Generate Invoice PDF & Upload to Drive
    try {
      const pdfBuffer = await generateA4PDFBuffer({
        documentNo: taxInvoice.invoiceNo,
        documentType: "TAX_INVOICE",
        date: dayjs(taxInvoice.invoiceDate).format("DD/MM/YYYY"),
        poNumber: taxInvoice.poNumber || undefined,
        customer: {
          companyName: quotation.customer.companyName,
          gstin: quotation.customer.gstin || undefined,
          address: quotation.customer.address,
          phone: quotation.customer.phone,
        },
        items: taxInvoice.items.map((i) => ({
          description: i.description,
          hsnCode: i.hsnCode,
          quantity: i.quantity,
          unit: i.unit,
          rate: i.rate,
          gstPercentage: i.gstPercentage,
          amount: i.amount,
        })),
        subTotal: taxInvoice.subTotal,
        discount: taxInvoice.discount,
        taxableAmount: taxInvoice.taxableAmount,
        cgstAmount: taxInvoice.cgstAmount,
        sgstAmount: taxInvoice.sgstAmount,
        igstAmount: taxInvoice.igstAmount,
        roundOff: taxInvoice.roundOff,
        grandTotal: taxInvoice.grandTotal,
      });

      await uploadPDFToDrive(
        pdfBuffer,
        `${taxInvoice.invoiceNo}_${quotation.customer.companyName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        "Tax Invoices",
        "TAX_INVOICE",
        taxInvoice.id,
        taxInvoice.invoiceNo
      );
    } catch (e) {
      console.error("Invoice Drive upload error:", e);
    }

    return NextResponse.json({ success: true, taxInvoice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
