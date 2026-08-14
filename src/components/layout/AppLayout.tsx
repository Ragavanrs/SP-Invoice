"use client";

import React from "react";
import { Box, CircularProgress } from "@mui/material";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading, user } = useAuth();
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress size={48} thickness={4} />
      </Box>
    );
  }

  if (isLoginPage || !user) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header />
        <Box component="main" sx={{ p: 3, flexGrow: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
