import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getNextDocumentNumber } from "@/lib/sequence";
import { calculateGST } from "@/lib/gst";
import { generateA4PDFBuffer } from "@/lib/pdfGenerator";
import { uploadPDFToDrive } from "@/lib/googleDrive";
import { logAudit } from "@/lib/audit";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { quotationNo: { contains: search, mode: "insensitive" } },
        { customer: { companyName: { contains: search, mode: "insensitive" } } },
        { customer: { gstin: { contains: search, mode: "insensitive" } } },
      ];
    }

    const quotations = await prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quotations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { customerId, validDays = 30, items, terms, notes, preparedBy } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Customer and at least one line item are required" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // 1. Calculate GST and Totals
    const gstCalc = calculateGST(items, customer.stateCode);

    // 2. Generate Auto Document Number (QT-2026-000001)
    const quotationNo = await getNextDocumentNumber("QT");

    const validUntil = dayjs().add(validDays, "day").toDate();

    // 3. Save Quotation and Items in Database
    const quotation = await prisma.quotation.create({
      data: {
        quotationNo,
        customerId,
        date: new Date(),
        validUntil,
        subTotal: gstCalc.subTotal,
        discount: gstCalc.discount,
        taxableAmount: gstCalc.taxableAmount,
        cgst: gstCalc.cgstAmount,
        sgst: gstCalc.sgstAmount,
        igst: gstCalc.igstAmount,
        roundOff: gstCalc.roundOff,
        grandTotal: gstCalc.grandTotal,
        status: "DRAFT",
        terms,
        notes,
        preparedBy: preparedBy || authUser.name,
        items: {
          create: items.map((it: any) => ({
            description: it.description,
            hsnCode: it.hsnCode || "8502",
            quantity: parseFloat(it.quantity) || 1,
            unit: it.unit || "NOS",
            rate: parseFloat(it.rate) || 0,
            discount: parseFloat(it.discount) || 0,
            gstPercentage: parseFloat(it.gstPercentage) || 18,
            amount: (parseFloat(it.quantity) || 1) * (parseFloat(it.rate) || 0) - (parseFloat(it.discount) || 0),
          })),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    await logAudit("Quotation", quotation.id, "CREATE", authUser.name, authUser.id, `Created Quotation ${quotationNo}`);

    // 4. Generate A4 PDF
    try {
      const pdfBuffer = await generateA4PDFBuffer({
        documentNo: quotation.quotationNo,
        documentType: "QUOTATION",
        date: dayjs(quotation.date).format("DD/MM/YYYY"),
        customer: {
          companyName: customer.companyName,
          gstin: customer.gstin || undefined,
          address: customer.address,
          phone: customer.phone,
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

      // 5. Upload automatically to Google Drive
      await uploadPDFToDrive(
        pdfBuffer,
        `${quotation.quotationNo}_${customer.companyName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        "Quotations",
        "QUOTATION",
        quotation.id,
        quotation.quotationNo
      );
    } catch (pdfErr) {
      console.error("PDF / Drive Auto Upload Error:", pdfErr);
    }

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
