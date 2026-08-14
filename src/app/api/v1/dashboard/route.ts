import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import dayjs from "dayjs";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const todayStart = dayjs().startOf("day").toDate();
    const monthStart = dayjs().startOf("month").toDate();

    // 1. Today's Sales
    const todaysInvoices = await prisma.taxInvoice.aggregate({
      where: { invoiceDate: { gte: todayStart } },
      _sum: { grandTotal: true },
    });
    const todaysSales = todaysInvoices._sum.grandTotal || 0;

    // 2. Monthly Sales
    const monthlyInvoices = await prisma.taxInvoice.aggregate({
      where: { invoiceDate: { gte: monthStart } },
      _sum: { grandTotal: true },
    });
    const monthlySales = monthlyInvoices._sum.grandTotal || 0;

    // 3. Pending Quotations Count
    const pendingQuotations = await prisma.quotation.count({
      where: { status: { in: ["DRAFT", "SENT"] } },
    });

    // 4. Pending Deliveries Count
    const pendingDeliveries = await prisma.deliveryChallan.count({
      where: { status: "PENDING" },
    });

    // 5. Pending Payments
    const pendingPaymentsAgg = await prisma.taxInvoice.aggregate({
      where: { paymentStatus: { in: ["PENDING", "OVERDUE", "PARTIAL"] } },
      _sum: { grandTotal: true },
      _count: { id: true },
    });
    const pendingPaymentsAmount = pendingPaymentsAgg._sum.grandTotal || 0;
    const pendingPaymentsCount = pendingPaymentsAgg._count.id || 0;

    // 6. Recent Documents
    const recentQuotations = await prisma.quotation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    });

    const recentInvoices = await prisma.taxInvoice.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    });

    const recentDocuments = [
      ...recentInvoices.map((i) => ({
        id: i.id,
        type: "TAX_INVOICE",
        number: i.invoiceNo,
        customer: i.customer.companyName,
        amount: i.grandTotal,
        date: dayjs(i.invoiceDate).format("DD/MM/YYYY"),
        status: i.paymentStatus,
      })),
      ...recentQuotations.map((q) => ({
        id: q.id,
        type: "QUOTATION",
        number: q.quotationNo,
        customer: q.customer.companyName,
        amount: q.grandTotal,
        date: dayjs(q.date).format("DD/MM/YYYY"),
        status: q.status,
      })),
    ]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 8);

    // 7. Monthly Revenue Chart (Last 6 Months)
    const monthlyRevenueChart = [];
    for (let i = 5; i >= 0; i--) {
      const start = dayjs().subtract(i, "month").startOf("month").toDate();
      const end = dayjs().subtract(i, "month").endOf("month").toDate();
      const monthLabel = dayjs().subtract(i, "month").format("MMM YYYY");

      const invAgg = await prisma.taxInvoice.aggregate({
        where: { invoiceDate: { gte: start, lte: end } },
        _sum: { grandTotal: true },
      });

      const qtAgg = await prisma.quotation.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { grandTotal: true },
      });

      monthlyRevenueChart.push({
        month: monthLabel,
        sales: invAgg._sum.grandTotal || 0,
        quotations: qtAgg._sum.grandTotal || 0,
      });
    }

    // 8. Top Customers
    const topCustomersGroup = await prisma.taxInvoice.groupBy({
      by: ["customerId"],
      _sum: { grandTotal: true },
      _count: { id: true },
      orderBy: { _sum: { grandTotal: "desc" } },
      take: 5,
    });

    const topCustomers = await Promise.all(
      topCustomersGroup.map(async (group) => {
        const customer = await prisma.customer.findUnique({ where: { id: group.customerId } });
        return {
          id: group.customerId,
          name: customer ? customer.companyName : "Unknown",
          totalAmount: group._sum.grandTotal || 0,
          invoiceCount: group._count.id,
        };
      })
    );

    // 9. Latest Audit Activities
    const latestActivities = await prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      todaysSales,
      monthlySales,
      pendingQuotations,
      pendingDeliveries,
      pendingPaymentsAmount,
      pendingPaymentsCount,
      recentDocuments,
      monthlyRevenueChart,
      topCustomers,
      latestActivities,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
