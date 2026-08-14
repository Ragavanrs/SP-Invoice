import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const challan = await prisma.deliveryChallan.findUnique({
      where: { id },
      include: { customer: true, items: true },
    });

    if (!challan) return NextResponse.json({ error: "Delivery Challan not found" }, { status: 404 });

    const driveDoc = await prisma.driveDocument.findUnique({
      where: { entityType_entityId: { entityType: "DELIVERY_CHALLAN", entityId: id } },
    });

    return NextResponse.json({ challan, driveDoc });
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
    const challan = await prisma.deliveryChallan.update({
      where: { id },
      data: {
        status: body.status,
        remarks: body.remarks,
        vehicleNumber: body.vehicleNumber,
        driverName: body.driverName,
      },
    });

    await logAudit("DeliveryChallan", id, "UPDATE", authUser.name, authUser.id, `Updated Delivery Challan ${challan.challanNo}`);

    return NextResponse.json({ challan });
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
      return NextResponse.json({ error: "Only Admin can delete delivery challans" }, { status: 403 });
    }

    const challan = await prisma.deliveryChallan.delete({ where: { id } });
    await logAudit("DeliveryChallan", id, "DELETE", authUser.name, authUser.id, `Deleted Delivery Challan ${challan.challanNo}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
