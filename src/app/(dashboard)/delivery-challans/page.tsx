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
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
} from "@mui/material";
import { Add, Search, Visibility, Delete, LocalShipping, RemoveCircle } from "@mui/icons-material";
import axios from "axios";
import { DeliveryChallan, Customer, Product } from "@/types";
import { PDFViewerModal } from "@/components/common/PDFViewerModal";
import { DriveStatusBadge } from "@/components/common/DriveStatusBadge";
import dayjs from "dayjs";

export default function DeliveryChallansPage() {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [pdfModal, setPdfModal] = useState<{ open: boolean; challan: DeliveryChallan | null }>({
    open: false,
    challan: null,
  });

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [dispatchTime, setDispatchTime] = useState("");
  const [remarks, setRemarks] = useState("");
  const [items, setItems] = useState<
    Array<{
      particulars: string;
      hsnCode: string;
      quantity: number;
      unit: string;
      remarks: string;
    }>
  >([
    {
      particulars: "15 KVA Cummins Silent Diesel Generator Set (S/N: DG-2026-015)",
      hsnCode: "8502",
      quantity: 1,
      unit: "NOS",
      remarks: "Despatched for site installation",
    },
  ]);

  const fetchChallans = () => {
    axios
      .get("/api/v1/challans", { params: { search } })
      .then((res) => setChallans(res.data.challans))
      .catch((err) => console.error(err));
  };

  const fetchMasterData = () => {
    axios.get("/api/v1/customers").then((res) => setCustomers(res.data.customers));
    axios.get("/api/v1/products").then((res) => setProducts(res.data.products));
  };

  useEffect(() => {
    fetchChallans();
    fetchMasterData();
  }, [search]);

  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        particulars: "",
        hsnCode: "8502",
        quantity: 1,
        unit: "NOS",
        remarks: "",
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
      particulars: `${prod.name} (Engine S/N: ${prod.engineNumber || "-"})`,
      hsnCode: prod.hsnCode || "8502",
    };
    setItems(newItems);
  };

  const handleCreateChallan = async () => {
    if (!selectedCustomerId) {
      alert("Please select a customer");
      return;
    }

    try {
      const res = await axios.post("/api/v1/challans", {
        customerId: selectedCustomerId,
        vehicleNumber,
        driverName,
        dispatchTime: dispatchTime || dayjs().format("hh:mm A"),
        remarks,
        items,
      });

      setToast(`Delivery Challan ${res.data.challan.challanNo} generated & uploaded to Drive!`);
      setOpenModal(false);
      fetchChallans();
    } catch (err: any) {
      alert(err.response?.data?.error || "Challan creation failed");
    }
  };

  const handleDelete = async (id: string, dcNo: string) => {
    if (confirm(`Delete Delivery Challan ${dcNo}?`)) {
      try {
        await axios.delete(`/api/v1/challans/${id}`);
        setToast(`Delivery Challan ${dcNo} deleted`);
        fetchChallans();
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
            Delivery Challan Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            DC-2026-XXXXXX Series, DG Set Material Dispatch & Site Delivery Slips
          </Typography>
        </Box>

        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setOpenModal(true)}>
          Create Delivery Challan
        </Button>
      </Box>

      {/* Search */}
      <Card>
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by DC Number (e.g. DC-2026-000001), Vehicle Number, Driver Name, Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Challans Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>DC Number</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date & Dispatch Time</TableCell>
                <TableCell>Vehicle & Driver</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Google Drive Sync</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {challans.map((dc) => (
                <TableRow key={dc.id} hover>
                  <TableCell sx={{ fontWeight: 800, color: "primary.main" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocalShipping fontSize="small" />
                      {dc.challanNo}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {dc.customer.companyName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dc.customer.phone}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{dayjs(dc.date).format("DD/MM/YYYY")}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Time: {dc.dispatchTime || "-"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {dc.vehicleNumber || "No Vehicle Number"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Driver: {dc.driverName || "-"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip label={dc.status} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </TableCell>

                  <TableCell>
                    <DriveStatusBadge status="SUCCESS" driveUrl={null} onRetry={() => {}} />
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="Preview A4 Delivery Challan PDF">
                      <IconButton color="primary" onClick={() => setPdfModal({ open: true, challan: dc })}>
                        <Visibility />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Delivery Challan">
                      <IconButton color="error" onClick={() => handleDelete(dc.id, dc.challanNo)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {challans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No delivery challans found. Click 'Create Delivery Challan' to issue a dispatch slip.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Delivery Challan Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Issue New Delivery Challan (DC Slip)</DialogTitle>
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
                    {c.companyName} ({c.phone})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Vehicle Number"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="TN 18 A V 1040"
              />

              <TextField
                fullWidth
                label="Driver Name"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
              />
            </Box>

            {/* Material Items List */}
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Material Particulars to Dispatch
                </Typography>
                <Button size="small" variant="outlined" startIcon={<Add />} onClick={handleAddItemRow}>
                  Add Material Row
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
                        <MenuItem value="">Custom Particulars Entry</MenuItem>
                        {products.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        fullWidth
                        size="small"
                        label="Particulars / Description *"
                        value={item.particulars}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].particulars = e.target.value;
                          setItems(newItems);
                        }}
                        required
                      />
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 2fr auto" }, gap: 1.5, alignItems: "center" }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="HSN Code"
                        value={item.hsnCode}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].hsnCode = e.target.value;
                          setItems(newItems);
                        }}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label="Quantity"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].quantity = parseFloat(e.target.value) || 1;
                          setItems(newItems);
                        }}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label="Remarks / Serial Nos"
                        value={item.remarks}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx].remarks = e.target.value;
                          setItems(newItems);
                        }}
                      />

                      <IconButton color="error" onClick={() => handleRemoveItemRow(idx)}>
                        <RemoveCircle />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateChallan}>
            Issue Delivery Challan & Upload Drive
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF Modal */}
      {pdfModal.open && pdfModal.challan && (
        <PDFViewerModal
          open={pdfModal.open}
          onClose={() => setPdfModal({ open: false, challan: null })}
          documentNo={pdfModal.challan.challanNo}
          pdfUrl={`/api/v1/challans/${pdfModal.challan.id}/pdf`}
          entityType="DELIVERY_CHALLAN"
          entityId={pdfModal.challan.id}
          customerName={pdfModal.challan.customer.companyName}
          customerPhone={pdfModal.challan.customer.phone}
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
