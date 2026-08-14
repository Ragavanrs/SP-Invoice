import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: "insensitive" } },
        { gstin: { contains: search, mode: "insensitive" } },
        { contactPerson: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { companyName: "asc" },
      include: {
        _count: {
          select: {
            quotations: true,
            taxInvoices: true,
            deliveryChallans: true,
          },
        },
      },
    });

    return NextResponse.json({ customers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { companyName, gstin, pan, address, shippingAddress, contactPerson, phone, email, state, stateCode, placeOfSupply, remarks } = body;

    if (!companyName || !phone || !address) {
      return NextResponse.json({ error: "Company Name, Phone, and Address are required" }, { status: 400 });
    }

    // Basic GSTIN Validation regex (15 chars)
    if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin.trim().toUpperCase())) {
      return NextResponse.json({ error: "Invalid GSTIN format. Example: 33AKNPR3914K1ZT" }, { status: 400 });
    }

    const cleanGstin = gstin ? gstin.trim().toUpperCase() : null;

    if (cleanGstin) {
      const existing = await prisma.customer.findUnique({ where: { gstin: cleanGstin } });
      if (existing) {
        return NextResponse.json({ error: "Customer with this GSTIN already exists" }, { status: 400 });
      }
    }

    const customer = await prisma.customer.create({
      data: {
        companyName: companyName.trim(),
        gstin: cleanGstin,
        pan: pan ? pan.trim().toUpperCase() : cleanGstin ? cleanGstin.substring(2, 12) : null,
        address: address.trim(),
        shippingAddress: shippingAddress ? shippingAddress.trim() : address.trim(),
        contactPerson: contactPerson ? contactPerson.trim() : null,
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : null,
        state: state || "Tamil Nadu",
        stateCode: stateCode || "33",
        placeOfSupply: placeOfSupply || `${state || "Tamil Nadu"} (${stateCode || "33"})`,
        remarks,
      },
    });

    await logAudit("Customer", customer.id, "CREATE", authUser.name, authUser.id, `Created customer ${customer.companyName}`);

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
