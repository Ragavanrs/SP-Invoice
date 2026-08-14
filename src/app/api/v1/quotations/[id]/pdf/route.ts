import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateA4PDFBuffer } from "@/lib/pdfGenerator";
import dayjs from "dayjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const pdfBuffer = await generateA4PDFBuffer({
      documentNo: quotation.quotationNo,
      documentType: "QUOTATION",
      date: dayjs(quotation.date).format("DD/MM/YYYY"),
      customer: {
        companyName: quotation.customer.companyName,
        gstin: quotation.customer.gstin || undefined,
        address: quotation.customer.address,
        phone: quotation.customer.phone,
      },
      items: quotation.items.map((i) => ({
        description: i.description,
        hsnCode: i.hsnCode,
        quantity: i.quantity,
        unit: i.unit,
        rate: i.rate,
        gstPercentage: i.gstPercentage,
        amount: i.amount,
      })),
      subTotal: quotation.subTotal,
      discount: quotation.discount,
      taxableAmount: quotation.taxableAmount,
      cgstAmount: quotation.cgst,
      sgstAmount: quotation.sgst,
      igstAmount: quotation.igst,
      roundOff: quotation.roundOff,
      grandTotal: quotation.grandTotal,
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${quotation.quotationNo}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
