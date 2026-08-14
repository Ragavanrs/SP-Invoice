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
  Chip,
  MenuItem,
  Snackbar,
  Alert,
  Tooltip,
  Link as MuiLink,
} from "@mui/material";
import {
  CloudQueue,
  OpenInNew,
  Refresh,
  FolderZip,
  CloudDone,
  CloudSync,
} from "@mui/icons-material";
import axios from "axios";
import { DriveDocument } from "@/types";
import dayjs from "dayjs";

export default function DriveDocumentsPage() {
  const [docs, setDocs] = useState<DriveDocument[]>([]);
  const [search, setSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchDriveDocs = () => {
    axios
      .get("/api/v1/drive", { params: { search, folder: folderFilter } })
      .then((res) => setDocs(res.data.driveDocs))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchDriveDocs();
  }, [search, folderFilter]);

  const handleSyncRetry = async (doc: DriveDocument) => {
    setSyncingId(doc.id);
    try {
      const res = await axios.post("/api/v1/drive", {
        entityType: doc.entityType,
        entityId: doc.entityId,
      });

      if (res.data.success) {
        setToast(`Synced ${doc.documentNo} to Google Drive!`);
      } else {
        setToast("Sync processed. Saved in local queue.");
      }
      fetchDriveDocs();
    } catch (err: any) {
      alert("Sync failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Google Drive Storage Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Automatic PDF Cloud Archival under <strong style={{ color: "#0A2540" }}>My Drive / Surya Power</strong> Folders
          </Typography>
        </Box>

        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchDriveDocs}>
          Refresh Drive Sync Status
        </Button>
      </Box>

      {/* Folder Structure Explanation Banner */}
      <Card variant="outlined" sx={{ bgcolor: "primary.50", borderColor: "primary.200" }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <FolderZip color="primary" />
            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
              SURYA POWER AUTOMATIC GOOGLE DRIVE FOLDER LAYOUT:
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" display="block">
            📁 <strong>Surya Power</strong> (Root Folder)
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;├── 📁 <strong>Quotations</strong> (QT-2026-XXXXXX Series PDFs)
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;├── 📁 <strong>Tax Invoices</strong> (INV-2026-XXXXXX Series PDFs)
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;└── 📁 <strong>Delivery Challans</strong> (DC-2026-XXXXXX Series PDFs)
          </Typography>
        </CardContent>
      </Card>

      {/* Search & Folder Filters */}
      <Card>
        <CardContent sx={{ p: 2, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            sx={{ flex: 1, minWidth: 250 }}
            placeholder="Search Drive files by Document No, File Name, Drive File ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <TextField
            select
            label="Sub-Folder"
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            sx={{ width: 220 }}
          >
            <MenuItem value="">All Sub-Folders</MenuItem>
            <MenuItem value="Quotations">Quotations Folder</MenuItem>
            <MenuItem value="Tax Invoices">Tax Invoices Folder</MenuItem>
            <MenuItem value="Delivery Challans">Delivery Challans Folder</MenuItem>
          </TextField>
        </CardContent>
      </Card>

      {/* Drive Documents Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Document No</TableCell>
                <TableCell>Folder Path</TableCell>
                <TableCell>File Name</TableCell>
                <TableCell>Drive File ID & URL</TableCell>
                <TableCell>Sync Status</TableCell>
                <TableCell>Created Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell sx={{ fontWeight: 800, color: "primary.main" }}>{doc.documentNo}</TableCell>

                  <TableCell>
                    <Chip
                      icon={<CloudQueue fontSize="small" />}
                      label={`Surya Power / ${doc.folderName}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>

                  <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{doc.fileName}</TableCell>

                  <TableCell>
                    {doc.driveUrl ? (
                      <MuiLink
                        href={doc.driveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontWeight: 700, fontSize: 12 }}
                      >
                        Open in Drive <OpenInNew fontSize="inherit" />
                      </MuiLink>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No Remote ID (Stored in DB Queue)
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    {doc.uploadStatus === "SUCCESS" ? (
                      <Chip
                        icon={<CloudDone fontSize="small" />}
                        label="Synced to Drive"
                        size="small"
                        color="success"
                        sx={{ fontWeight: 700 }}
                      />
                    ) : (
                      <Chip
                        icon={<CloudSync fontSize="small" />}
                        label="Saved Locally"
                        size="small"
                        color="warning"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                  </TableCell>

                  <TableCell>{dayjs(doc.createdAt).format("DD/MM/YYYY hh:mm A")}</TableCell>

                  <TableCell align="center">
                    <Tooltip title="Regenerate & Re-upload to Google Drive">
                      <IconButton
                        color="primary"
                        onClick={() => handleSyncRetry(doc)}
                        disabled={syncingId === doc.id}
                      >
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {docs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No Google Drive documents synced yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {toast && (
        <Snackbar open autoHideDuration={4000} onClose={() => setToast(null)}>
          <Alert severity="success">{toast}</Alert>
        </Snackbar>
      )}
    </Box>
  );
}
