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
  Transform,
  RemoveCircle,
} from "@mui/icons-material";
import axios from "axios";
import { Quotation, Customer, Product } from "@/types";
import { PDFViewerModal } from "@/components/common/PDFViewerModal";
import { DriveStatusBadge } from "@/components/common/DriveStatusBadge";
import { calculateGST } from "@/lib/gst";
import dayjs from "dayjs";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // PDF Preview State
  const [pdfModal, setPdfModal] = useState<{
    open: boolean;
    quotation: Quotation | null;
  }>({ open: false, quotation: null });

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [validDays, setValidDays] = useState(30);
  const [terms, setTerms] = useState(
    "1. Validity: 30 Days from quotation date.\n2. Payment terms: 50% advance along with P.O.\n3. Taxes: GST 18% extra as applicable."
  );
  const [notes, setNotes] = useState("");
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
      description: "15 KVA Cummins Silent Diesel Generator Set with Stamford Alternator",
      hsnCode: "8502",
      quantity: 1,
      unit: "NOS",
      rate: 125000,
      discount: 0,
      gstPercentage: 18,
      amount: 125000,
    },
  ]);

  const fetchQuotations = () => {
    axios
      .get("/api/v1/quotations", { params: { search, status: statusFilter } })
      .then((res) => setQuotations(res.data.quotations))
      .catch((err) => console.error(err));
  };

  const fetchMasterData = () => {
    axios.get("/api/v1/customers").then((res) => setCustomers(res.data.customers));
    axios.get("/api/v1/products").then((res) => setProducts(res.data.products));
  };

  useEffect(() => {
    fetchQuotations();
    fetchMasterData();
  }, [search, statusFilter]);

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
      description: `${prod.name}${prod.kva ? ` (${prod.kva} KVA)` : ""} - ${prod.description || ""}`,
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

  const handleCreateQuotation = async () => {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    try {
      const res = await axios.post("/api/v1/quotations", {
        customerId: selectedCustomerId,
        validDays,
        items,
        terms,
        notes,
      });

      setToast(`Quotation ${res.data.quotation.quotationNo} created successfully!`);
      setOpenModal(false);
      fetchQuotations();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create quotation");
    }
  };

  const handleConvert = async (id: string, qNo: string) => {
    if (confirm(`Convert Quotation ${qNo} into Tax Invoice?`)) {
      try {
        const res = await axios.post(`/api/v1/quotations/${id}/convert`);
        setToast(`Converted Quotation ${qNo} to Tax Invoice ${res.data.taxInvoice.invoiceNo}!`);
        fetchQuotations();
      } catch (err: any) {
        alert(err.response?.data?.error || "Conversion failed");
      }
    }
  };

  const handleDelete = async (id: string, qNo: string) => {
    if (confirm(`Delete Quotation ${qNo}?`)) {
      try {
        await axios.delete(`/api/v1/quotations/${id}`);
        setToast(`Quotation ${qNo} deleted`);
        fetchQuotations();
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
            Quotation Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate QT-2026-XXXXXX Series, A4 PDF Proposals & Instant Invoice Conversions
          </Typography>
        </Box>

        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setOpenModal(true)}>
          Create Quotation
        </Button>
      </Box>

      {/* Search & Filters */}
      <Card>
        <CardContent sx={{ p: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            sx={{ flex: 1, minWidth: 250 }}
            placeholder="Search by Quotation No (e.g. QT-2026-000001), Customer Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <TextField
            select
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ width: 180 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="SENT">Sent</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="CONVERTED">Converted to Invoice</MenuItem>
          </TextField>
        </CardContent>
      </Card>

      {/* Quotations List Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Quotation No</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date & Validity</TableCell>
                <TableCell>Grand Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Google Drive Sync</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quotations.map((q) => (
                <TableRow key={q.id} hover>
                  <TableCell sx={{ fontWeight: 700, color: "primary.main" }}>{q.quotationNo}</TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {q.customer.companyName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {q.customer.gstin ? `GST: ${q.customer.gstin}` : q.customer.phone}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{dayjs(q.date).format("DD/MM/YYYY")}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Valid to {dayjs(q.validUntil).format("DD/MM/YYYY")}
                    </Typography>
                  </TableCell>

                  <TableCell sx={{ fontWeight: 800 }}>
                    Rs. {q.grandTotal.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={q.status}
                      size="small"
                      color={
                        q.status === "CONVERTED"
                          ? "success"
                          : q.status === "APPROVED"
                          ? "primary"
                          : "warning"
                      }
                      sx={{ fontWeight: 700 }}
                    />
                    {q.convertedToInvoiceNo && (
                      <Typography variant="caption" display="block" color="success.main" fontWeight={600}>
                        → {q.convertedToInvoiceNo}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <DriveStatusBadge status="SUCCESS" driveUrl={null} onRetry={() => {}} />
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="Preview & Download A4 PDF">
                      <IconButton color="primary" onClick={() => setPdfModal({ open: true, quotation: q })}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>

                    {q.status !== "CONVERTED" && (
                      <Tooltip title="Convert into Tax Invoice (INV Series)">
                        <IconButton color="secondary" onClick={() => handleConvert(q.id, q.quotationNo)}>
                          <Transform />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Delete Quotation">
                      <IconButton color="error" onClick={() => handleDelete(q.id, q.quotationNo)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {quotations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No quotations found. Click 'Create Quotation' to generate a proposal!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Quotation Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Generate New Quotation (Surya Power A4 Format)</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
            {/* Customer Selection & Validity */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 2 }}>
              <TextField
                select
                fullWidth
                label="Select Customer *"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                required
              >
                {customers.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.companyName} {c.gstin ? `(${c.gstin})` : ""} - {c.phone}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Validity (Days)"
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(Number(e.target.value))}
              />
            </Box>

            {/* Line Items Builder */}
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Quotation Line Items
                </Typography>
                <Button size="small" variant="outlined" startIcon={<Add />} onClick={handleAddItemRow}>
                  Add Item Row
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
                        label="Select from Product Master (Optional)"
                        onChange={(e) => handleProductSelect(idx, e.target.value)}
                      >
                        <MenuItem value="">Custom Item Entry</MenuItem>
                        {products.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name} (Rs. {p.sellingPrice})
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        fullWidth
                        size="small"
                        label="Item Particulars / Description *"
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
                        label="Quantity"
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

            {/* Calculations Summary Box */}
            <Card variant="outlined" sx={{ p: 2, bgcolor: "primary.50" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 2 }}>
                <Box>
                  <Typography variant="caption">SUBTOTAL</Typography>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Rs. {gstCalc.subTotal.toLocaleString("en-IN")}
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

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Terms and Conditions"
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateQuotation}>
            Save & Generate PDF + Upload Drive
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Preview Modal */}
      {pdfModal.open && pdfModal.quotation && (
        <PDFViewerModal
          open={pdfModal.open}
          onClose={() => setPdfModal({ open: false, quotation: null })}
          documentNo={pdfModal.quotation.quotationNo}
          pdfUrl={`/api/v1/quotations/${pdfModal.quotation.id}/pdf`}
          entityType="QUOTATION"
          entityId={pdfModal.quotation.id}
          customerName={pdfModal.quotation.customer.companyName}
          customerPhone={pdfModal.quotation.customer.phone}
          grandTotal={pdfModal.quotation.grandTotal}
          onConverted={fetchQuotations}
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
