"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Close,
  Download,
  Print,
  CloudUpload,
  WhatsApp,
  Email,
  Transform,
} from "@mui/icons-material";
import axios from "axios";

interface PDFViewerModalProps {
  open: boolean;
  onClose: () => void;
  documentNo: string;
  pdfUrl: string;
  entityType: "QUOTATION" | "TAX_INVOICE" | "DELIVERY_CHALLAN";
  entityId: string;
  driveUrl?: string | null;
  customerPhone?: string;
  customerName?: string;
  grandTotal?: number;
  onConverted?: () => void;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  open,
  onClose,
  documentNo,
  pdfUrl,
  entityType,
  entityId,
  driveUrl,
  customerPhone,
  customerName,
  grandTotal,
  onConverted,
}) => {
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [toast, setToast] = useState<{ message: string; severity: "success" | "error" | "info" } | null>(null);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${documentNo}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, "_blank");
    if (printWindow) {
      printWindow.focus();
    }
  };

  const handleUploadDrive = async () => {
    setUploading(true);
    try {
      const res = await axios.post("/api/v1/drive", { entityType, entityId });
      if (res.data.success) {
        setToast({ message: "PDF uploaded to Google Drive successfully!", severity: "success" });
      } else {
        setToast({ message: res.data.error || "Drive upload queue updated", severity: "info" });
      }
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || "Drive upload error", severity: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleWhatsApp = () => {
    const phone = customerPhone ? customerPhone.replace(/[^0-9]/g, "") : "";
    const text = encodeURIComponent(
      `Hello ${customerName || "Customer"},\n\n` +
        `Please find attached ${entityType.replace("_", " ")} *${documentNo}* from *SURYA POWER*.\n` +
        (grandTotal ? `Amount: Rs. ${grandTotal.toLocaleString("en-IN")}\n` : "") +
        (driveUrl ? `View PDF: ${driveUrl}\n\n` : "\n") +
        `Thank you for your business!\n*SURYA POWER*\nMob: 9790987190 / 9840841887`
    );
    const waUrl = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, "_blank");
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Surya Power - ${entityType.replace("_", " ")} ${documentNo}`);
    const body = encodeURIComponent(
      `Dear ${customerName || "Customer"},\n\nPlease find the generated document ${documentNo}.\n\nThank you,\nSURYA POWER`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleConvertInvoice = async () => {
    setConverting(true);
    try {
      const res = await axios.post(`/api/v1/quotations/${entityId}/convert`);
      setToast({ message: `Converted to Tax Invoice ${res.data.taxInvoice.invoiceNo}!`, severity: "success" });
      if (onConverted) onConverted();
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setToast({ message: err.response?.data?.error || "Conversion failed", severity: "error" });
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: "90vh" } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              A4 Document Preview - {documentNo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Surya Power Official Printable Document
            </Typography>
          </Box>

          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0, bgcolor: "grey.200", display: "flex", justifyContent: "center" }}>
          <iframe
            src={`${pdfUrl}#toolbar=0`}
            width="100%"
            height="100%"
            style={{ border: "none" }}
            title={documentNo}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            {entityType === "QUOTATION" && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={converting ? <CircularProgress size={16} /> : <Transform />}
                onClick={handleConvertInvoice}
                disabled={converting}
              >
                Convert to Invoice
              </Button>
            )}

            <Button
              variant="contained"
              color="success"
              startIcon={<WhatsApp />}
              onClick={handleWhatsApp}
            >
              WhatsApp Share
            </Button>

            <Button variant="outlined" startIcon={<Email />} onClick={handleEmail}>
              Email
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Upload automatically to Surya Power Google Drive folder">
              <Button
                variant="outlined"
                color="primary"
                startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
                onClick={handleUploadDrive}
                disabled={uploading}
              >
                Upload to Drive
              </Button>
            </Tooltip>

            <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
              Print
            </Button>

            <Button variant="contained" startIcon={<Download />} onClick={handleDownload}>
              Download PDF
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {toast && (
        <Snackbar open autoHideDuration={4000} onClose={() => setToast(null)}>
          <Alert severity={toast.severity} onClose={() => setToast(null)}>
            {toast.message}
          </Alert>
        </Snackbar>
      )}
    </>
  );
};
