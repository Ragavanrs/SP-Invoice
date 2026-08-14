"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Container,
} from "@mui/material";
import { ElectricBolt, Lock, Person, Storage } from "@mui/icons-material";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@suryapower.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [seedMsg, setSeedMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("/api/v1/auth/login", { email, password });
      login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDB = async () => {
    setSeeding(true);
    setSeedMsg("");
    try {
      const res = await axios.post("/api/v1/auth/seed");
      setSeedMsg("Database seeded successfully! You can now log in.");
    } catch (err: any) {
      setError(err.response?.data?.error || "Seeding failed");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0A2540 0%, #06182E 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Card sx={{ borderRadius: 3, p: 1, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
          <CardContent>
            {/* Header Logo */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  bgcolor: "primary.main",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "common.white",
                  mb: 1.5,
                  boxShadow: "0 6px 20px rgba(79, 70, 229, 0.4)",
                }}
              >
                <ElectricBolt fontSize="large" />
              </Box>
              <Typography variant="h5" fontWeight={800} color="primary">
                SURYA POWER
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                DOCUMENT MANAGEMENT & ERP SYSTEM
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {seedMsg && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {seedMsg}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                InputProps={{ startAdornment: <Person sx={{ color: "action.active", mr: 1 }} /> }}
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                InputProps={{ startAdornment: <Lock sx={{ color: "action.active", mr: 1 }} /> }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2, py: 1.2, fontWeight: 700, fontSize: 15 }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In to ERP"}
              </Button>
            </Box>

            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                QUICK DEMO ACCOUNTS
              </Typography>
            </Divider>

            {/* Role Quick Selector */}
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mb: 2 }}>
              <Chip
                label="Admin"
                size="small"
                clickable
                color="primary"
                onClick={() => {
                  setEmail("admin@suryapower.com");
                  setPassword("admin123");
                }}
              />
              <Chip
                label="Staff"
                size="small"
                clickable
                color="info"
                onClick={() => {
                  setEmail("staff@suryapower.com");
                  setPassword("staff123");
                }}
              />
              <Chip
                label="Accountant"
                size="small"
                clickable
                color="secondary"
                onClick={() => {
                  setEmail("accountant@suryapower.com");
                  setPassword("accountant123");
                }}
              />
            </Box>

            <Button
              fullWidth
              variant="outlined"
              size="small"
              color="inherit"
              startIcon={<Storage />}
              onClick={handleSeedDB}
              disabled={seeding}
              sx={{ fontSize: 11 }}
            >
              {seeding ? <CircularProgress size={14} /> : "Initialize / Seed Database"}
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
