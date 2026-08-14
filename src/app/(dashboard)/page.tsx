"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Avatar,
} from "@mui/material";
import {
  TrendingUp,
  Receipt,
  Description,
  LocalShipping,
  AccountBalanceWallet,
  ArrowForward,
} from "@mui/icons-material";
import axios from "axios";
import { useRouter } from "next/navigation";
import { DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    axios
      .get("/api/v1/dashboard")
      .then((res) => setStats(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Welcome Banner & Quick Action Buttons */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Surya Power Executive Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            DG Set Hiring, Buying, Selling & Servicing Real-time Metrics
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Description />}
            onClick={() => router.push("/quotations")}
          >
            New Quotation
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<Receipt />}
            onClick={() => router.push("/invoices")}
          >
            New Tax Invoice
          </Button>

          <Button
            variant="outlined"
            startIcon={<LocalShipping />}
            onClick={() => router.push("/delivery-challans")}
          >
            New Delivery Challan
          </Button>
        </Box>
      </Box>

      {/* Summary Stat Cards Grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" }, gap: 2 }}>
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                TODAY'S SALES
              </Typography>
              <Avatar sx={{ bgcolor: "primary.light", width: 32, height: 32 }}>
                <TrendingUp fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h6" fontWeight={800}>
              Rs. {(stats?.todaysSales || 0).toLocaleString("en-IN")}
            </Typography>
            <Typography variant="caption" color="success.main" fontWeight={600}>
              Live Today's Revenue
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                MONTHLY SALES
              </Typography>
              <Avatar sx={{ bgcolor: "success.light", width: 32, height: 32 }}>
                <Receipt fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h6" fontWeight={800}>
              Rs. {(stats?.monthlySales || 0).toLocaleString("en-IN")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Current Month Total
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                PENDING QUOTATIONS
              </Typography>
              <Avatar sx={{ bgcolor: "warning.light", width: 32, height: 32 }}>
                <Description fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h6" fontWeight={800}>
              {stats?.pendingQuotations || 0}
            </Typography>
            <Typography variant="caption" color="warning.main" fontWeight={600}>
              Awaiting Approval / Sent
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                PENDING DELIVERIES
              </Typography>
              <Avatar sx={{ bgcolor: "info.light", width: 32, height: 32 }}>
                <LocalShipping fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h6" fontWeight={800}>
              {stats?.pendingDeliveries || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              In Transit / Scheduled
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                PENDING PAYMENTS
              </Typography>
              <Avatar sx={{ bgcolor: "error.light", width: 32, height: 32 }}>
                <AccountBalanceWallet fontSize="small" />
              </Avatar>
            </Box>
            <Typography variant="h6" fontWeight={800} color="error.main">
              Rs. {(stats?.pendingPaymentsAmount || 0).toLocaleString("en-IN")}
            </Typography>
            <Typography variant="caption" color="error.main" fontWeight={600}>
              {stats?.pendingPaymentsCount || 0} Unpaid Invoices
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content Area: Recent Documents & Top Customers */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 3 }}>
        {/* Left Column: Recent Documents Table */}
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Recent ERP Documents
              </Typography>
              <Button
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => router.push("/invoices")}
              >
                View All
              </Button>
            </Box>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Doc Type</TableCell>
                  <TableCell>Doc Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.recentDocuments.map((doc) => (
                  <TableRow key={doc.id} hover>
                    <TableCell>
                      <Chip
                        label={doc.type === "TAX_INVOICE" ? "INVOICE" : "QUOTATION"}
                        size="small"
                        color={doc.type === "TAX_INVOICE" ? "primary" : "secondary"}
                        sx={{ fontSize: 10, fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{doc.number}</TableCell>
                    <TableCell>{doc.customer}</TableCell>
                    <TableCell>{doc.date}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Rs. {doc.amount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.status}
                        size="small"
                        color={
                          doc.status === "PAID"
                            ? "success"
                            : doc.status === "CONVERTED"
                            ? "success"
                            : "warning"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats?.recentDocuments || stats.recentDocuments.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      No recent documents found. Create your first quotation or invoice!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right Column: Top Customers & Recent Activity */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Top Valued Customers
              </Typography>

              {stats?.topCustomers.map((cust, idx) => (
                <Box
                  key={cust.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1.5,
                    borderBottom: idx < stats.topCustomers.length - 1 ? "1px solid #E2E8F0" : "none",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {cust.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cust.invoiceCount} Tax Invoices
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                    Rs. {cust.totalAmount.toLocaleString("en-IN")}
                  </Typography>
                </Box>
              ))}

              {(!stats?.topCustomers || stats.topCustomers.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  No billing history recorded yet.
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Activity Trail */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Latest Activity Audit Log
              </Typography>

              {stats?.latestActivities.map((act) => (
                <Box key={act.id} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} color="primary">
                    {act.action} - {act.entityName}
                  </Typography>
                  <Typography variant="body2" fontSize={12}>
                    {act.details}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    By {act.performedBy}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
