import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateA4PDFBuffer } from "@/lib/pdfGenerator";
import dayjs from "dayjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await prisma.taxInvoice.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const pdfBuffer = await generateA4PDFBuffer({
      documentNo: invoice.invoiceNo,
      documentType: "TAX_INVOICE",
      date: dayjs(invoice.invoiceDate).format("DD/MM/YYYY"),
      poNumber: invoice.poNumber || undefined,
      deliveryChallanNo: invoice.deliveryChallanNo || undefined,
      vehicleNumber: invoice.vehicleNumber || undefined,
      customer: {
        companyName: invoice.customer.companyName,
        gstin: invoice.customer.gstin || undefined,
        address: invoice.billingAddress,
        phone: invoice.customer.phone,
      },
      items: invoice.items.map((i) => ({
        description: i.description,
        hsnCode: i.hsnCode,
        quantity: i.quantity,
        unit: i.unit,
        rate: i.rate,
        gstPercentage: i.gstPercentage,
        amount: i.amount,
      })),
      subTotal: invoice.subTotal,
      discount: invoice.discount,
      taxableAmount: invoice.taxableAmount,
      cgstAmount: invoice.cgstAmount,
      sgstAmount: invoice.sgstAmount,
      igstAmount: invoice.igstAmount,
      roundOff: invoice.roundOff,
      grandTotal: invoice.grandTotal,
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNo}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
