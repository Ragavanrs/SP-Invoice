import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const quotations = await prisma.quotation.findMany({
      where: { customerId: id },
      orderBy: { date: "desc" },
    });

    const invoices = await prisma.taxInvoice.findMany({
      where: { customerId: id },
      orderBy: { invoiceDate: "desc" },
    });

    const challans = await prisma.deliveryChallan.findMany({
      where: { customerId: id },
      orderBy: { date: "desc" },
    });

    let totalBilled = 0;
    let totalPaid = 0;
    let totalPending = 0;

    invoices.forEach((inv) => {
      totalBilled += inv.grandTotal;
      if (inv.paymentStatus === "PAID") {
        totalPaid += inv.grandTotal;
      } else if (inv.paymentStatus === "PENDING" || inv.paymentStatus === "OVERDUE") {
        totalPending += inv.grandTotal;
      }
    });

    return NextResponse.json({
      customer,
      summary: {
        totalBilled,
        totalPaid,
        totalPending,
        totalQuotations: quotations.length,
        totalInvoices: invoices.length,
        totalChallans: challans.length,
      },
      quotations,
      invoices,
      challans,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
