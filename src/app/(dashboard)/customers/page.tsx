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
  InputAdornment,
  Snackbar,
  Alert,
  Tooltip,
} from "@mui/material";
import { Add, Search, Edit, Delete, Receipt, Business } from "@mui/icons-material";
import axios from "axios";
import { Customer } from "@/types";
import { CustomerLedgerModal } from "@/components/common/CustomerLedgerModal";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedCust, setSelectedCust] = useState<Customer | null>(null);
  const [ledgerCust, setLedgerCust] = useState<{ id: string; name: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    companyName: "",
    gstin: "",
    pan: "",
    address: "",
    shippingAddress: "",
    contactPerson: "",
    phone: "",
    email: "",
    state: "Tamil Nadu",
    stateCode: "33",
    placeOfSupply: "Tamil Nadu (33)",
    remarks: "",
  });

  const [toast, setToast] = useState<string | null>(null);

  const fetchCustomers = () => {
    axios
      .get("/api/v1/customers", { params: { search } })
      .then((res) => setCustomers(res.data.customers))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleOpenAdd = () => {
    setSelectedCust(null);
    setForm({
      companyName: "",
      gstin: "",
      pan: "",
      address: "",
      shippingAddress: "",
      contactPerson: "",
      phone: "",
      email: "",
      state: "Tamil Nadu",
      stateCode: "33",
      placeOfSupply: "Tamil Nadu (33)",
      remarks: "",
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setSelectedCust(cust);
    setForm({
      companyName: cust.companyName,
      gstin: cust.gstin || "",
      pan: cust.pan || "",
      address: cust.address,
      shippingAddress: cust.shippingAddress || cust.address,
      contactPerson: cust.contactPerson || "",
      phone: cust.phone,
      email: cust.email || "",
      state: cust.state,
      stateCode: cust.stateCode,
      placeOfSupply: cust.placeOfSupply,
      remarks: cust.remarks || "",
    });
    setOpenModal(true);
  };

  const handleGstinChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    let derivedPan = form.pan;
    if (uppercaseVal.length >= 12) {
      derivedPan = uppercaseVal.substring(2, 12);
    }
    setForm({ ...form, gstin: uppercaseVal, pan: derivedPan });
  };

  const handleSave = async () => {
    try {
      if (selectedCust) {
        await axios.put(`/api/v1/customers/${selectedCust.id}`, form);
        setToast("Customer updated successfully!");
      } else {
        await axios.post("/api/v1/customers", form);
        setToast("Customer added successfully!");
      }
      setOpenModal(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error saving customer");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete customer ${name}?`)) {
      try {
        await axios.delete(`/api/v1/customers/${id}`);
        setToast("Customer deleted");
        fetchCustomers();
      } catch (err: any) {
        alert(err.response?.data?.error || "Delete failed");
      }
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header Bar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Customer Master Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage Party Billing Details, GSTIN, Addresses & Customer Ledgers
          </Typography>
        </Box>

        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenAdd}>
          Add New Customer
        </Button>
      </Box>

      {/* Search & Filter Toolbar */}
      <Card>
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search customer by Company Name, GSTIN, Contact Person, Phone, Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Customer Data Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company Name</TableCell>
                <TableCell>GSTIN / PAN</TableCell>
                <TableCell>Contact Person</TableCell>
                <TableCell>Phone & Email</TableCell>
                <TableCell>State & Code</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((cust) => (
                <TableRow key={cust.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Business color="primary" fontSize="small" />
                      {cust.companyName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {cust.gstin ? (
                      <Chip label={cust.gstin} size="small" color="primary" sx={{ fontWeight: 700 }} />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Unregistered / No GST
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{cust.contactPerson || "-"}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {cust.phone}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cust.email || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={`${cust.state} (${cust.stateCode})`} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Customer Ledger & Previous Transactions">
                      <IconButton
                        color="secondary"
                        onClick={() => setLedgerCust({ id: cust.id, name: cust.companyName })}
                      >
                        <Receipt />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Edit Customer">
                      <IconButton color="primary" onClick={() => handleOpenEdit(cust)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Customer">
                      <IconButton color="error" onClick={() => handleDelete(cust.id, cust.companyName)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    No customers found matching search filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Customer Dialog Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedCust ? "Edit Customer Details" : "Add New Customer"}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 2 }}>
              <TextField
                fullWidth
                label="Company Name *"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="GSTIN (15 Chars)"
                value={form.gstin}
                onChange={(e) => handleGstinChange(e.target.value)}
                placeholder="33AKNPR3914K1ZT"
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
              <TextField
                fullWidth
                label="PAN Number"
                value={form.pan}
                onChange={(e) => setForm({ ...form, pan: e.target.value.toUpperCase() })}
              />

              <TextField
                fullWidth
                label="Contact Person"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              />

              <TextField
                fullWidth
                label="Phone Number *"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                fullWidth
                label="Email Address"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <TextField
                fullWidth
                label="State & Code"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Billing Address *"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              required
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Shipping Address (If different)"
              value={form.shippingAddress}
              onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save Customer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Customer Ledger Modal */}
      {ledgerCust && (
        <CustomerLedgerModal
          open={Boolean(ledgerCust)}
          onClose={() => setLedgerCust(null)}
          customerId={ledgerCust.id}
          customerName={ledgerCust.name}
        />
      )}

      {toast && (
        <Snackbar open autoHideDuration={3000} onClose={() => setToast(null)}>
          <Alert severity="success">{toast}</Alert>
        </Snackbar>
      )}
    </Box>
  );
}
