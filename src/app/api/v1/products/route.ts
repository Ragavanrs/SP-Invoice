import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const brand = searchParams.get("brand") || "";

    const where: any = {};
    if (brand) {
      where.OR = [
        { dgBrand: { contains: brand, mode: "insensitive" } },
        { engineBrand: { contains: brand, mode: "insensitive" } },
        { alternatorBrand: { contains: brand, mode: "insensitive" } },
      ];
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { model: { contains: search, mode: "insensitive" } },
        { serialNumber: { contains: search, mode: "insensitive" } },
        { hsnCode: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, dgBrand, engineBrand, alternatorBrand, model, serialNumber, engineNumber, alternatorNumber, kva, fuelType, purchaseCost, sellingPrice, gstPercentage, hsnCode, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Product Name is required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        dgBrand: dgBrand ? dgBrand.trim() : null,
        engineBrand: engineBrand ? engineBrand.trim() : null,
        alternatorBrand: alternatorBrand ? alternatorBrand.trim() : null,
        model: model ? model.trim() : null,
        serialNumber: serialNumber ? serialNumber.trim() : null,
        engineNumber: engineNumber ? engineNumber.trim() : null,
        alternatorNumber: alternatorNumber ? alternatorNumber.trim() : null,
        kva: kva ? parseFloat(kva) : null,
        fuelType: fuelType || "Diesel",
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : 0.0,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0.0,
        gstPercentage: gstPercentage ? parseFloat(gstPercentage) : 18.0,
        hsnCode: hsnCode || "8502",
        description,
      },
    });

    await logAudit("Product", product.id, "CREATE", authUser.name, authUser.id, `Added product ${product.name}`);

    return NextResponse.json({ product }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
