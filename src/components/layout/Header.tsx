"use client";

import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  Logout,
  AccountCircle,
} from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { useAppTheme } from "@/context/ThemeContext";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
        bgcolor: "background.paper",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Box>
          <Typography variant="h6" fontWeight={700} color="text.primary">
            SURYA POWER DOCUMENT & ERP MANAGEMENT
          </Typography>
          <Typography variant="caption" color="text.secondary">
            GSTIN: 33AKNPR3914K1ZT | Chennai, Tamil Nadu
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {/* Dark / Light Mode Toggle */}
          <Tooltip title={`Switch to ${mode === "light" ? "Dark" : "Light"} mode`}>
            <IconButton onClick={toggleTheme} color="inherit">
              {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          {/* User Profile Avatar Menu */}
          {user && (
            <>
              <Tooltip title="Account settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0.5 }}>
                  <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: 14 }}>
                    {user.name.substring(0, 2).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseUserMenu}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                PaperProps={{
                  sx: { minWidth: 200, mt: 1, borderRadius: 2 },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {user.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>

                <Divider />

                <MenuItem disableRipple>
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  Role: {user.role}
                </MenuItem>

                <MenuItem onClick={logout} sx={{ color: "error.main" }}>
                  <ListItemIcon>
                    <Logout fontSize="small" color="error" />
                  </ListItemIcon>
                  Sign Out
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
