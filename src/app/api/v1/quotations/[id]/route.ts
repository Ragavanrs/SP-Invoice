import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 });

    const driveDoc = await prisma.driveDocument.findUnique({
      where: { entityType_entityId: { entityType: "QUOTATION", entityId: id } },
    });

    return NextResponse.json({ quotation, driveDoc });
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
    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        status: body.status,
        notes: body.notes,
        terms: body.terms,
        approvedBy: body.approvedBy,
      },
    });

    await logAudit("Quotation", id, "UPDATE", authUser.name, authUser.id, `Updated Quotation ${quotation.quotationNo}`);

    return NextResponse.json({ quotation });
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
      return NextResponse.json({ error: "Only Admin can delete quotations" }, { status: 403 });
    }

    const quotation = await prisma.quotation.delete({ where: { id } });
    await logAudit("Quotation", id, "DELETE", authUser.name, authUser.id, `Deleted Quotation ${quotation.quotationNo}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
