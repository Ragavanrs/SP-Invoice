import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { uploadPDFToDrive } from "@/lib/googleDrive";
import { generateA4PDFBuffer } from "@/lib/pdfGenerator";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "";
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (folder) where.folderName = folder;
    if (search) {
      where.OR = [
        { documentNo: { contains: search, mode: "insensitive" } },
        { fileName: { contains: search, mode: "insensitive" } },
        { driveFileId: { contains: search, mode: "insensitive" } },
      ];
    }

    const driveDocs = await prisma.driveDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ driveDocs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { entityType, entityId } = body;

    let docNo = "";
    let folderName: "Quotations" | "Tax Invoices" | "Delivery Challans" = "Quotations";
    let customerName = "Customer";
    let pdfBuffer: Buffer | null = null;

    if (entityType === "QUOTATION") {
      folderName = "Quotations";
      const q = await prisma.quotation.findUnique({ where: { id: entityId }, include: { customer: true, items: true } });
      if (!q) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
      docNo = q.quotationNo;
      customerName = q.customer.companyName;
      pdfBuffer = await generateA4PDFBuffer({
        documentNo: q.quotationNo,
        documentType: "QUOTATION",
        date: dayjs(q.date).format("DD/MM/YYYY"),
        customer: { companyName: q.customer.companyName, address: q.customer.address, phone: q.customer.phone, gstin: q.customer.gstin || undefined },
        items: q.items.map((i) => ({ description: i.description, hsnCode: i.hsnCode, quantity: i.quantity, unit: i.unit, rate: i.rate, amount: i.amount })),
        subTotal: q.subTotal,
        grandTotal: q.grandTotal,
      });
    } else if (entityType === "TAX_INVOICE") {
      folderName = "Tax Invoices";
      const inv = await prisma.taxInvoice.findUnique({ where: { id: entityId }, include: { customer: true, items: true } });
      if (!inv) return NextResponse.json({ error: "Tax Invoice not found" }, { status: 404 });
      docNo = inv.invoiceNo;
      customerName = inv.customer.companyName;
      pdfBuffer = await generateA4PDFBuffer({
        documentNo: inv.invoiceNo,
        documentType: "TAX_INVOICE",
        date: dayjs(inv.invoiceDate).format("DD/MM/YYYY"),
        customer: { companyName: inv.customer.companyName, address: inv.billingAddress, phone: inv.customer.phone, gstin: inv.customer.gstin || undefined },
        items: inv.items.map((i) => ({ description: i.description, hsnCode: i.hsnCode, quantity: i.quantity, unit: i.unit, rate: i.rate, amount: i.amount })),
        subTotal: inv.subTotal,
        cgstAmount: inv.cgstAmount,
        sgstAmount: inv.sgstAmount,
        igstAmount: inv.igstAmount,
        grandTotal: inv.grandTotal,
      });
    } else if (entityType === "DELIVERY_CHALLAN") {
      folderName = "Delivery Challans";
      const dc = await prisma.deliveryChallan.findUnique({ where: { id: entityId }, include: { customer: true, items: true } });
      if (!dc) return NextResponse.json({ error: "Delivery Challan not found" }, { status: 404 });
      docNo = dc.challanNo;
      customerName = dc.customer.companyName;
      pdfBuffer = await generateA4PDFBuffer({
        documentNo: dc.challanNo,
        documentType: "DELIVERY_CHALLAN",
        date: dayjs(dc.date).format("DD/MM/YYYY"),
        customer: { companyName: dc.customer.companyName, address: dc.customer.address, phone: dc.customer.phone, gstin: dc.customer.gstin || undefined },
        items: dc.items.map((i) => ({ description: i.particulars, hsnCode: i.hsnCode, quantity: i.quantity, unit: i.unit, rate: 0, amount: 0 })),
        subTotal: 0,
        grandTotal: 0,
      });
    }

    if (!pdfBuffer) {
      return NextResponse.json({ error: "Could not generate PDF buffer" }, { status: 400 });
    }

    const fileName = `${docNo}_${customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    const uploadRes = await uploadPDFToDrive(pdfBuffer, fileName, folderName, entityType, entityId, docNo);

    return NextResponse.json({ success: uploadRes.success, driveDoc: uploadRes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
