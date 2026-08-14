"use client";

import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Chip,
} from "@mui/material";
import {
  Dashboard,
  People,
  Inventory,
  Description,
  Receipt,
  LocalShipping,
  CloudQueue,
  History,
  ElectricBolt,
} from "@mui/icons-material";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const drawerWidth = 260;

const menuItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/", roles: ["ADMIN", "STAFF", "ACCOUNTANT"] },
  { text: "Customers", icon: <People />, path: "/customers", roles: ["ADMIN", "STAFF", "ACCOUNTANT"] },
  { text: "Product Master", icon: <Inventory />, path: "/products", roles: ["ADMIN", "STAFF"] },
  { text: "Quotations", icon: <Description />, path: "/quotations", roles: ["ADMIN", "STAFF"] },
  { text: "Tax Invoices", icon: <Receipt />, path: "/invoices", roles: ["ADMIN", "STAFF", "ACCOUNTANT"] },
  { text: "Delivery Challans", icon: <LocalShipping />, path: "/delivery-challans", roles: ["ADMIN", "STAFF"] },
  { text: "Google Drive Storage", icon: <CloudQueue />, path: "/drive-documents", roles: ["ADMIN", "ACCOUNTANT"] },
  { text: "Audit Trail", icon: <History />, path: "/audit-logs", roles: ["ADMIN"] },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const userRole = user?.role || "STAFF";

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          borderRight: "1px solid rgba(0, 0, 0, 0.08)",
        },
      }}
    >
      {/* Company Branding */}
      <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "common.white",
            boxShadow: "0 4px 10px rgba(10, 37, 64, 0.3)",
          }}
        >
          <ElectricBolt />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} color="primary" lineHeight={1.1}>
            SURYA POWER
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            DG Set ERP System
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* User Role Chip */}
      {user && (
        <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            ROLE:
          </Typography>
          <Chip
            label={user.role}
            size="small"
            color={user.role === "ADMIN" ? "primary" : user.role === "ACCOUNTANT" ? "secondary" : "info"}
            sx={{ fontWeight: 700, fontSize: 10 }}
          />
        </Box>
      )}

      <Divider sx={{ mb: 1 }} />

      {/* Navigation List */}
      <List sx={{ px: 1.5 }}>
        {menuItems
          .filter((item) => item.roles.includes(userRole))
          .map((item) => {
            const isActive = pathname === item.path;

            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => router.push(item.path)}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    px: 1.5,
                    bgcolor: isActive ? "primary.main" : "transparent",
                    color: isActive ? "primary.contrastText" : "text.primary",
                    "&:hover": {
                      bgcolor: isActive ? "primary.main" : "action.hover",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive ? "primary.contrastText" : "text.secondary",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>
    </Drawer>
  );
};
