import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateA4PDFBuffer } from "@/lib/pdfGenerator";
import dayjs from "dayjs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const challan = await prisma.deliveryChallan.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!challan) {
      return NextResponse.json({ error: "Delivery Challan not found" }, { status: 404 });
    }

    const pdfBuffer = await generateA4PDFBuffer({
      documentNo: challan.challanNo,
      documentType: "DELIVERY_CHALLAN",
      date: dayjs(challan.date).format("DD/MM/YYYY"),
      vehicleNumber: challan.vehicleNumber || undefined,
      driverName: challan.driverName || undefined,
      dispatchTime: challan.dispatchTime || undefined,
      customer: {
        companyName: challan.customer.companyName,
        gstin: challan.customer.gstin || undefined,
        address: challan.customer.address,
        phone: challan.customer.phone,
      },
      items: challan.items.map((i) => ({
        description: i.particulars,
        hsnCode: i.hsnCode,
        quantity: i.quantity,
        unit: i.unit,
        rate: 0,
        amount: 0,
      })),
      subTotal: 0,
      grandTotal: 0,
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${challan.challanNo}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
