import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const invoice = await prisma.taxInvoice.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const driveDoc = await prisma.driveDocument.findUnique({
      where: { entityType_entityId: { entityType: "TAX_INVOICE", entityId: id } },
    });

    return NextResponse.json({ invoice, driveDoc });
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
    const { paymentStatus, paymentMode, notes } = body;

    const invoice = await prisma.taxInvoice.update({
      where: { id },
      data: {
        paymentStatus,
        paymentMode,
        notes,
      },
    });

    await logAudit("TaxInvoice", id, "UPDATE", authUser.name, authUser.id, `Updated Invoice ${invoice.invoiceNo} payment status to ${paymentStatus}`);

    return NextResponse.json({ invoice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (authUser.role === "STAFF") {
      return NextResponse.json({ error: "Forbidden: Staff members cannot delete tax invoices" }, { status: 403 });
    }

    const invoice = await prisma.taxInvoice.delete({ where: { id } });
    await logAudit("TaxInvoice", id, "DELETE", authUser.name, authUser.id, `Deleted Invoice ${invoice.invoiceNo}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
