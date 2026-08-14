import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        quotations: { orderBy: { createdAt: "desc" }, take: 10 },
        taxInvoices: { orderBy: { createdAt: "desc" }, take: 10 },
        deliveryChallans: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    return NextResponse.json({ customer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...body,
        gstin: body.gstin ? body.gstin.trim().toUpperCase() : null,
      },
    });

    await logAudit("Customer", id, "UPDATE", authUser.name, authUser.id, `Updated customer ${customer.companyName}`);

    return NextResponse.json({ customer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (authUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Admin can delete customer records" }, { status: 403 });
    }

    const customer = await prisma.customer.delete({ where: { id } });
    await logAudit("Customer", id, "DELETE", authUser.name, authUser.id, `Deleted customer ${customer.companyName}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
