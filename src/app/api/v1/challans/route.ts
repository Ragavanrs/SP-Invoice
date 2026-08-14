import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getNextDocumentNumber } from "@/lib/sequence";
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

    const where: any = {};
    if (search) {
      where.OR = [
        { challanNo: { contains: search, mode: "insensitive" } },
        { vehicleNumber: { contains: search, mode: "insensitive" } },
        { driverName: { contains: search, mode: "insensitive" } },
        { customer: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    const challans = await prisma.deliveryChallan.findMany({
      where,
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ challans });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { customerId, vehicleNumber, driverName, dispatchTime, remarks, items } = body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Customer and at least one material item are required" }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    // 1. Auto Document Number (DC-2026-000001)
    const challanNo = await getNextDocumentNumber("DC");

    // 2. Save Delivery Challan in DB
    const challan = await prisma.deliveryChallan.create({
      data: {
        challanNo,
        date: new Date(),
        customerId,
        vehicleNumber,
        driverName,
        dispatchTime: dispatchTime || dayjs().format("hh:mm A"),
        status: "DISPATCHED",
        remarks,
        items: {
          create: items.map((it: any) => ({
            particulars: it.particulars || it.description,
            hsnCode: it.hsnCode || "8502",
            quantity: parseFloat(it.quantity) || 1,
            unit: it.unit || "NOS",
            remarks: it.remarks || "",
          })),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    await logAudit("DeliveryChallan", challan.id, "CREATE", authUser.name, authUser.id, `Created Delivery Challan ${challanNo}`);

    // 3. Generate A4 PDF & Upload to Drive
    try {
      const pdfBuffer = await generateA4PDFBuffer({
        documentNo: challan.challanNo,
        documentType: "DELIVERY_CHALLAN",
        date: dayjs(challan.date).format("DD/MM/YYYY"),
        vehicleNumber: challan.vehicleNumber || undefined,
        driverName: challan.driverName || undefined,
        dispatchTime: challan.dispatchTime || undefined,
        customer: {
          companyName: customer.companyName,
          gstin: customer.gstin || undefined,
          address: customer.address,
          phone: customer.phone,
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

      await uploadPDFToDrive(
        pdfBuffer,
        `${challan.challanNo}_${customer.companyName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        "Delivery Challans",
        "DELIVERY_CHALLAN",
        challan.id,
        challan.challanNo
      );
    } catch (e) {
      console.error("DC Drive Upload error:", e);
    }

    return NextResponse.json({ challan }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
