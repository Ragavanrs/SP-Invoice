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
import { Add, Search, Edit, Delete, Inventory } from "@mui/icons-material";
import axios from "axios";
import { Product } from "@/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedProd, setSelectedProd] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: "",
    dgBrand: "",
    engineBrand: "",
    alternatorBrand: "",
    model: "",
    serialNumber: "",
    engineNumber: "",
    alternatorNumber: "",
    kva: "",
    fuelType: "Diesel",
    purchaseCost: "",
    sellingPrice: "",
    gstPercentage: "18",
    hsnCode: "8502",
    description: "",
  });

  const [toast, setToast] = useState<string | null>(null);

  const fetchProducts = () => {
    axios
      .get("/api/v1/products", { params: { search } })
      .then((res) => setProducts(res.data.products))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleOpenAdd = () => {
    setSelectedProd(null);
    setForm({
      name: "",
      dgBrand: "",
      engineBrand: "",
      alternatorBrand: "",
      model: "",
      serialNumber: "",
      engineNumber: "",
      alternatorNumber: "",
      kva: "",
      fuelType: "Diesel",
      purchaseCost: "",
      sellingPrice: "",
      gstPercentage: "18",
      hsnCode: "8502",
      description: "",
    });
    setOpenModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setSelectedProd(prod);
    setForm({
      name: prod.name,
      dgBrand: prod.dgBrand || "",
      engineBrand: prod.engineBrand || "",
      alternatorBrand: prod.alternatorBrand || "",
      model: prod.model || "",
      serialNumber: prod.serialNumber || "",
      engineNumber: prod.engineNumber || "",
      alternatorNumber: prod.alternatorNumber || "",
      kva: prod.kva ? String(prod.kva) : "",
      fuelType: prod.fuelType || "Diesel",
      purchaseCost: String(prod.purchaseCost),
      sellingPrice: String(prod.sellingPrice),
      gstPercentage: String(prod.gstPercentage),
      hsnCode: prod.hsnCode || "8502",
      description: prod.description || "",
    });
    setOpenModal(true);
  };

  const handleSave = async () => {
    try {
      if (selectedProd) {
        await axios.put(`/api/v1/products/${selectedProd.id}`, form);
        setToast("Product updated successfully!");
      } else {
        await axios.post("/api/v1/products", form);
        setToast("Product added successfully!");
      }
      setOpenModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || "Error saving product");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete product ${name}?`)) {
      try {
        await axios.delete(`/api/v1/products/${id}`);
        setToast("Product deleted");
        fetchProducts();
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
            DG Set & Machinery Master Inventory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            DG Brands, Engine & Alternator Models, KVA Ratings, Prices & HSN Codes
          </Typography>
        </Box>

        <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleOpenAdd}>
          Add DG Product
        </Button>
      </Box>

      {/* Search Toolbar */}
      <Card>
        <CardContent sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by Product Name, DG Brand, Engine Brand, Model, Serial Number, HSN Code..."
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

      {/* Products Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Product Name & Specs</TableCell>
                <TableCell>Brands (DG/Engine/Alternator)</TableCell>
                <TableCell>KVA Rating</TableCell>
                <TableCell>HSN Code</TableCell>
                <TableCell>GST %</TableCell>
                <TableCell>Selling Price</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((prod) => (
                <TableRow key={prod.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Inventory color="secondary" fontSize="small" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {prod.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          S/N: {prod.serialNumber || "-"} | Model: {prod.model || "-"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {prod.dgBrand || "Generic DG"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Eng: {prod.engineBrand || "-"} | Alt: {prod.alternatorBrand || "-"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {prod.kva ? (
                      <Chip label={`${prod.kva} KVA`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                    ) : (
                      "-"
                    )}
                  </TableCell>

                  <TableCell>{prod.hsnCode}</TableCell>
                  <TableCell>{prod.gstPercentage}%</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: "primary.main" }}>
                    Rs. {prod.sellingPrice.toLocaleString("en-IN")}
                  </TableCell>

                  <TableCell align="center">
                    <Tooltip title="Edit Product">
                      <IconButton color="primary" onClick={() => handleOpenEdit(prod)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete Product">
                      <IconButton color="error" onClick={() => handleDelete(prod.id, prod.name)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No products found. Click 'Add DG Product' to add inventory items.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add / Edit Product Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedProd ? "Edit Product Specs" : "Add New DG Product"}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr" }, gap: 2 }}>
              <TextField
                fullWidth
                label="Product / Machinery Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <TextField
                fullWidth
                label="KVA Rating"
                type="number"
                value={form.kva}
                onChange={(e) => setForm({ ...form, kva: e.target.value })}
                placeholder="e.g. 15, 62.5, 125"
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
              <TextField
                fullWidth
                label="DG Set Brand"
                value={form.dgBrand}
                onChange={(e) => setForm({ ...form, dgBrand: e.target.value })}
                placeholder="Cummins / Kirloskar"
              />

              <TextField
                fullWidth
                label="Engine Brand"
                value={form.engineBrand}
                onChange={(e) => setForm({ ...form, engineBrand: e.target.value })}
              />

              <TextField
                fullWidth
                label="Alternator Brand"
                value={form.alternatorBrand}
                onChange={(e) => setForm({ ...form, alternatorBrand: e.target.value })}
                placeholder="Stamford / Leroy Somer"
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
              <TextField
                fullWidth
                label="Model Number"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />

              <TextField
                fullWidth
                label="Serial Number"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              />

              <TextField
                fullWidth
                label="Fuel Type"
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 2 }}>
              <TextField
                fullWidth
                label="HSN / SAC Code"
                value={form.hsnCode}
                onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
              />

              <TextField
                fullWidth
                label="GST Percentage (%)"
                type="number"
                value={form.gstPercentage}
                onChange={(e) => setForm({ ...form, gstPercentage: e.target.value })}
              />

              <TextField
                fullWidth
                label="Purchase Cost (Rs.)"
                type="number"
                value={form.purchaseCost}
                onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
              />

              <TextField
                fullWidth
                label="Selling Price (Rs.) *"
                type="number"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                required
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Description & Specifications"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save Product
          </Button>
        </DialogActions>
      </Dialog>

      {toast && (
        <Snackbar open autoHideDuration={3000} onClose={() => setToast(null)}>
          <Alert severity="success">{toast}</Alert>
        </Snackbar>
      )}
    </Box>
  );
}
