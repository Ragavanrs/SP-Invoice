"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  Add,
  Search,
  Visibility,
  Delete,
  CheckCircle,
  HourglassEmpty,
  RemoveCircle,
} from "@mui/icons-material";
import axios from "axios";
import { TaxInvoice, Customer, Product } from "@/types";
import { PDFViewerModal } from "@/components/common/PDFViewerModal";
import { DriveStatusBadge } from "@/components/common/DriveStatusBadge";
import { calculateGST } from "@/lib/gst";
import dayjs from "dayjs";

export default function TaxInvoicesPage() {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [pdfModal, setPdfModal] = useState<{ open: boolean; invoice: TaxInvoice | null }>({
    open: false,
    invoice: null,
  });

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [deliveryChallanNo, setDeliveryChallanNo] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cheque/NEFT");
  const [terms, setTerms] = useState(
    "1. Interest 24% p.a. will be charged on all invoices if not paid within due date.\n2. All Payment to be made only by crossed cheques drawn in own favour.\n3. PAYMENT WITHIN 30 DAYS."
  );
  const [items, setItems] = useState<
    Array<{
      description: string;
      hsnCode: string;
      quantity: number;
      unit: string;
      rate: number;
      discount: number;
      gstPercentage: number;
      amount: number;
    }>
  >([
    {
      description: "15 KVA Cummins Silent DG Set (S/N: DG-2026-015)",
      hsnCode: "8502",
      quantity: 1,
      unit: "NOS",
      rate: 125000,
      discount: 0,
      gstPercentage: 18,
      amount: 125000,
    },
  ]);

  const fetchInvoices = () => {
    axios
      .get("/api/v1/invoices", { params: { search, paymentStatus: paymentFilter } })
      .then((res) => setInvoices(res.data.invoices))
      .catch((err) => console.error(err));
  };

  const fetchMasterData = () => {
    axios.get("/api/v1/customers").then((res) => setCustomers(res.data.customers));
    axios.get("/api/v1/products").then((res) => setProducts(res.data.products));
  };

  useEffect(() => {
    fetchInvoices();
    fetchMasterData();
  }, [search, paymentFilter]);

  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        description: "",
        hsnCode: "8502",
        quantity: 1,
        unit: "NOS",
        rate: 0,
        discount: 0,
        gstPercentage: 18,
        amount: 0,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      description: `${prod.name} ${prod.model ? `(Model: ${prod.model})` : ""}`,
      hsnCode: prod.hsnCode || "8502",
      rate: prod.sellingPrice,
      gstPercentage: prod.gstPercentage || 18,
      amount: newItems[index].quantity * prod.sellingPrice - newItems[index].discount,
    };
    setItems(newItems);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index], [field]: value };
    const qty = parseFloat(item.quantity as any) || 0;
    const rate = parseFloat(item.rate as any) || 0;
    const disc = parseFloat(item.discount as any) || 0;
    item.amount = Math.max(0, qty * rate - disc);
    newItems[index] = item;
    setItems(newItems);
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const gstCalc = calculateGST(items, selectedCustomer?.stateCode || "33");

  const handleCreateInvoice = async () => {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    try {
      const res = await axios.post("/api/v1/invoices", {
        customerId: selectedCustomerId,
        poNumber,
        deliveryChallanNo,
        vehicleNumber,
        paymentMode,
        items,
        terms,
      });

      setToast(`Tax Invoice ${res.data.taxInvoice.invoiceNo} generated & uploaded to Drive!`);
      setOpenModal(false);
      fetchInvoices();
    } catch (err: any) {
      alert(err.response?.data?.error || "Invoice creation failed");
    }
  };

  const handleTogglePaymentStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "PAID" ? "PENDING" : "PAID";
    try {
      await axios.put(`/api/v1/invoices/${id}`, { paymentStatus: nextStatus });
      setToast(`Payment status updated to ${nextStatus}`);
      fetchInvoices();
    } catch (err: any) {
      alert("Status update failed");
    }
  };

  const handleDelete = async (id: string, invNo: string) => {
    if (confirm(`Delete Tax Invoice ${invNo}?`)) {
      try {
        await axios.delete(`/api/v1/invoices/${id}`);
        setToast(`Invoice ${invNo} deleted`);
        fetchInvoices();
      } catch (err: any) {
        alert(err.response?.data?.error || "Delete failed");
      }
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Tax Invoice Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            INV-2026-XXXXXX Series, GST Tax Invoices, Bank Details & Drive Sync
          </Typography>
        </Box>

        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setOpenModal(true)}>
          Create Tax Invoice
        </Button>
      </Box>

      {/* Search & Payment Status Filter */}
      <Card>
        <CardContent sx={{ p: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            sx={{ flex: 1, minWidth: 250 }}
            placeholder="Search by Invoice No (e.g. INV-2026-000001), Vehicle No, P.O. No, GSTIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <TextField
            select
            label="Payment Status"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="">All Payments</MenuItem>
            <MenuItem value="PAID">Paid</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="OVERDUE">Overdue</MenuItem>
          </TextField>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice Number</TableCell>
                <TableCell>Customer & GSTIN</TableCell>
                <TableCell>Date & Vehicle No</TableCell>
                <TableCell>Tax Breakdown</TableCell>
                <TableCell>Grand Total</TableCell>
                <TableCell>Payment Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} hover>
                  <TableCell sx={{ fontWeight: 800, color: "primary.main" }}>{inv.invoiceNo}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {inv.customer.companyName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {inv.gstin ? `GST: ${inv.gstin}` : inv.customer.phone}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{dayjs(inv.invoiceDate).format("DD/MM/YYYY")}</Typography>
                    {inv.vehicleNumber && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Veh: {inv.vehicleNumber}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption" display="block">
                      Taxable: Rs. {inv.taxableAmount.toLocaleString("en-IN")}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      CGST+SGST: Rs. {(inv.cgstAmount + inv.sgstAmount + inv.igstAmount).toLocaleString("en-IN")}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ fontWeight: 800 }}>
                    Rs. {inv.grandTotal.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell>
                    <Chip
                      icon={inv.paymentStatus === "PAID" ? <CheckCircle fontSize="small" /> : <HourglassEmpty fontSize="small" />}
                      label={inv.paymentStatus}
                      size="small"
                      color={inv.paymentStatus === "PAID" ? "success" : "warning"}
                      onClick={() => handleTogglePaymentStatus(inv.id, inv.paymentStatus)}
                      clickable
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="Preview A4 Printable PDF">
                      <IconButton color="primary" onClick={() => setPdfModal({ open: true, invoice: inv })}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Invoice">
                      <IconButton color="error" onClick={() => handleDelete(inv.id, inv.invoiceNo)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No tax invoices found. Click 'Create Tax Invoice' to generate a bill.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Tax Invoice Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Generate Tax Invoice (Surya Power Format)</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" }, gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Customer *"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.companyName} {c.gstin ? `(${c.gstin})` : ""}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="P.O. Number"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
              />

              <TextField
                fullWidth
                label="Vehicle Number"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="TN 18 A V 1040"
              />
            </Box>

            {/* Line Items */}
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Invoice Particulars & DG Items
                </Typography>
                <Button size="small" variant="outlined" startIcon={<Add />} onClick={handleAddItemRow}>
                  Add Row
                </Button>
              </Box>

              {items.map((item, idx) => (
                <Card key={idx} variant="outlined" sx={{ p: 1.5, mb: 1.5, bgcolor: "background.default" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr" }, gap: 1.5 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Select Product Master Item"
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                      >
                        <MenuItem value="">Custom Description Entry</MenuItem>
                        {products.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name} (Rs. {p.sellingPrice})
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        fullWidth
                        size="small"
                        label="Description *"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        required
                      />
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(5, 1fr) auto" }, gap: 1.5, alignItems: "center" }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="HSN Code"
                        value={item.hsnCode}
                        onChange={(e) => handleItemChange(idx, "hsnCode", e.target.value)}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label="Qty"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label="Rate (Rs.)"
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label="GST %"
                        type="number"
                        value={item.gstPercentage}
                        onChange={(e) => handleItemChange(idx, "gstPercentage", e.target.value)}
                      />

                      <Typography variant="body2" fontWeight={800} color="primary">
                        Rs. {item.amount.toLocaleString("en-IN")}
                      </Typography>

                      <IconButton color="error" onClick={() => handleRemoveItemRow(idx)}>
                        <RemoveCircle />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>

            {/* GST Summary */}
            <Card variant="outlined" sx={{ p: 2, bgcolor: "primary.50" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2 }}>
                <Box>
                  <Typography variant="caption">TAXABLE AMOUNT</Typography>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Rs. {gstCalc.taxableAmount.toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption">CGST + SGST / IGST</Typography>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Rs. {(gstCalc.cgstAmount + gstCalc.sgstAmount + gstCalc.igstAmount).toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption">ROUND OFF</Typography>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Rs. {gstCalc.roundOff}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="primary.main" fontWeight={700}>
                    GRAND TOTAL
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="primary.main">
                    Rs. {gstCalc.grandTotal.toLocaleString("en-IN")}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateInvoice}>
            Generate Tax Invoice & Upload Drive
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Modal */}
      {pdfModal.open && pdfModal.invoice && (
        <PDFViewerModal
          open={pdfModal.open}
          onClose={() => setPdfModal({ open: false, invoice: null })}
          documentNo={pdfModal.invoice.invoiceNo}
          pdfUrl={`/api/v1/invoices/${pdfModal.invoice.id}/pdf`}
          entityType="TAX_INVOICE"
          entityId={pdfModal.invoice.id}
          customerName={pdfModal.invoice.customer.companyName}
          customerPhone={pdfModal.invoice.customer.phone}
          grandTotal={pdfModal.invoice.grandTotal}
        />
      )}

      {toast && (
        <Snackbar open autoHideDuration={4000} onClose={() => setToast(null)}>
          <Alert severity="success">{toast}</Alert>
        </Snackbar>
      )}
    </Box>
  );
}
