import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ product });
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
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...body,
        kva: body.kva ? parseFloat(body.kva) : null,
        purchaseCost: body.purchaseCost ? parseFloat(body.purchaseCost) : 0,
        sellingPrice: body.sellingPrice ? parseFloat(body.sellingPrice) : 0,
        gstPercentage: body.gstPercentage ? parseFloat(body.gstPercentage) : 18,
      },
    });

    await logAudit("Product", id, "UPDATE", authUser.name, authUser.id, `Updated product ${product.name}`);

    return NextResponse.json({ product });
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
      return NextResponse.json({ error: "Forbidden: Only Admin can delete products" }, { status: 403 });
    }

    const product = await prisma.product.delete({ where: { id } });
    await logAudit("Product", id, "DELETE", authUser.name, authUser.id, `Deleted product ${product.name}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
