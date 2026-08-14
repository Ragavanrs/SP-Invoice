"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Button,
} from "@mui/material";
import { Refresh, History } from "@mui/icons-material";
import axios from "axios";
import { AuditLog } from "@/types";
import dayjs from "dayjs";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const fetchAuditLogs = () => {
    axios
      .get("/api/v1/audit-logs")
      .then((res) => setLogs(res.data.auditLogs))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Audit Trail & Security Logs
          </Typography>
          <Typography variant="body2" color="text.secondary">
            System Operations, Document Generations, Conversions & User Activity Log
          </Typography>
        </Box>

        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchAuditLogs}>
          Refresh Audit Trail
        </Button>
      </Box>

      {/* Audit Trail Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity Module</TableCell>
                <TableCell>Performed By</TableCell>
                <TableCell>Log Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>
                    {dayjs(log.createdAt).format("DD/MM/YYYY hh:mm:ss A")}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={log.action}
                      size="small"
                      color={
                        log.action === "CREATE"
                          ? "success"
                          : log.action === "DELETE"
                          ? "error"
                          : log.action === "CONVERT"
                          ? "secondary"
                          : "primary"
                      }
                      sx={{ fontWeight: 700, fontSize: 10 }}
                    />
                  </TableCell>

                  <TableCell sx={{ fontWeight: 700 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <History fontSize="small" color="action" />
                      {log.entityName}
                    </Box>
                  </TableCell>

                  <TableCell sx={{ fontWeight: 600 }}>{log.performedBy}</TableCell>

                  <TableCell sx={{ fontSize: 13, color: "text.secondary" }}>{log.details || "-"}</TableCell>
                </TableRow>
              ))}

              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    No audit logs recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}
