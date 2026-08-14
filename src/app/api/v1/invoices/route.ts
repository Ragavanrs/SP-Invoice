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
    const paymentStatus = searchParams.get("paymentStatus") || "";

    const where: any = {};
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: "insensitive" } },
        { poNumber: { contains: search, mode: "insensitive" } },
        { deliveryChallanNo: { contains: search, mode: "insensitive" } },
        { vehicleNumber: { contains: search, mode: "insensitive" } },
        { customer: { companyName: { contains: search, mode: "insensitive" } } },
        { customer: { gstin: { contains: search, mode: "insensitive" } } },
      ];
    }

    const invoices = await prisma.taxInvoice.findMany({
      where,
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      customerId,
      billingAddress,
      shippingAddress,
      poNumber,
      deliveryChallanNo,
      vehicleNumber,
      paymentMode = "Cheque/NEFT",
      items,
      terms,
      notes,
    } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Customer and at least one line item are required" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // 1. GST Calculation
    const gstCalc = calculateGST(items, customer.stateCode);

    // 2. Generate Invoice Number (INV-2026-000001)
    const invoiceNo = await getNextDocumentNumber("INV");

    // 3. Save Tax Invoice in Database
    const taxInvoice = await prisma.taxInvoice.create({
      data: {
        invoiceNo,
        invoiceDate: new Date(),
        customerId,
        gstin: customer.gstin,
        billingAddress: billingAddress || customer.address,
        shippingAddress: shippingAddress || customer.shippingAddress || customer.address,
        poNumber,
        deliveryChallanNo,
        vehicleNumber,
        subTotal: gstCalc.subTotal,
        discount: gstCalc.discount,
        taxableAmount: gstCalc.taxableAmount,
        cgstRate: gstCalc.cgstRate,
        cgstAmount: gstCalc.cgstAmount,
        sgstRate: gstCalc.sgstRate,
        sgstAmount: gstCalc.sgstAmount,
        igstRate: gstCalc.igstRate,
        igstAmount: gstCalc.igstAmount,
        roundOff: gstCalc.roundOff,
        grandTotal: gstCalc.grandTotal,
        paymentStatus: "PENDING",
        paymentMode,
        terms,
        notes,
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

    await logAudit("TaxInvoice", taxInvoice.id, "CREATE", authUser.name, authUser.id, `Created Tax Invoice ${invoiceNo}`);

    // 4. Generate A4 PDF & Upload to Drive
    try {
      const pdfBuffer = await generateA4PDFBuffer({
        documentNo: taxInvoice.invoiceNo,
        documentType: "TAX_INVOICE",
        date: dayjs(taxInvoice.invoiceDate).format("DD/MM/YYYY"),
        poNumber: taxInvoice.poNumber || undefined,
        deliveryChallanNo: taxInvoice.deliveryChallanNo || undefined,
        vehicleNumber: taxInvoice.vehicleNumber || undefined,
        customer: {
          companyName: customer.companyName,
          gstin: customer.gstin || undefined,
          address: taxInvoice.billingAddress,
          phone: customer.phone,
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
        `${taxInvoice.invoiceNo}_${customer.companyName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        "Tax Invoices",
        "TAX_INVOICE",
        taxInvoice.id,
        taxInvoice.invoiceNo
      );
    } catch (e) {
      console.error("Tax Invoice Drive Auto Upload error:", e);
    }

    return NextResponse.json({ taxInvoice }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
