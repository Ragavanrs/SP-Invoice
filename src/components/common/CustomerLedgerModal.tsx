"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/material";
import { Close, Receipt, Description } from "@mui/icons-material";
import axios from "axios";
import dayjs from "dayjs";

interface CustomerLedgerModalProps {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  open,
  onClose,
  customerId,
  customerName,
}) => {
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<any>(null);

  useEffect(() => {
    if (open && customerId) {
      setLoading(true);
      axios
        .get(`/api/v1/customers/${customerId}/ledger`)
        .then((res) => setLedger(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [open, customerId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Customer Ledger Statement - {customerName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Surya Power Complete Transaction & Payment History
          </Typography>
        </Box>
        <Button onClick={onClose} color="inherit" startIcon={<Close />}>
          Close
        </Button>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress />
          </Box>
        ) : ledger ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Financial Summary Cards */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
              <Card variant="outlined" sx={{ bgcolor: "primary.50" }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    TOTAL BILLED AMOUNT
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="primary.main">
                    Rs. {ledger.summary.totalBilled.toLocaleString("en-IN")}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ bgcolor: "success.50" }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    TOTAL RECEIVED (PAID)
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="success.main">
                    Rs. {ledger.summary.totalPaid.toLocaleString("en-IN")}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ bgcolor: "warning.50" }}>
                <CardContent sx={{ py: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    PENDING BALANCE DUE
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="warning.main">
                    Rs. {ledger.summary.totalPending.toLocaleString("en-IN")}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Tax Invoices History */}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <Receipt color="primary" fontSize="small" /> Tax Invoices ({ledger.invoices.length})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Vehicle No</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Payment Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledger.invoices.map((inv: any) => (
                    <TableRow key={inv.id}>
                      <TableCell sx={{ fontWeight: 700 }}>{inv.invoiceNo}</TableCell>
                      <TableCell>{dayjs(inv.invoiceDate).format("DD/MM/YYYY")}</TableCell>
                      <TableCell>{inv.vehicleNumber || "-"}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Rs. {inv.grandTotal.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Chip
                          label={inv.paymentStatus}
                          size="small"
                          color={inv.paymentStatus === "PAID" ? "success" : "warning"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {ledger.invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No Tax Invoices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            <Divider />

            {/* Quotations History */}
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <Description color="secondary" fontSize="small" /> Quotations ({ledger.quotations.length})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Quotation No</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Valid Until</TableCell>
                    <TableCell>Grand Total</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ledger.quotations.map((q: any) => (
                    <TableRow key={q.id}>
                      <TableCell sx={{ fontWeight: 700 }}>{q.quotationNo}</TableCell>
                      <TableCell>{dayjs(q.date).format("DD/MM/YYYY")}</TableCell>
                      <TableCell>{dayjs(q.validUntil).format("DD/MM/YYYY")}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Rs. {q.grandTotal.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Chip label={q.status} size="small" color={q.status === "CONVERTED" ? "success" : "info"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};
