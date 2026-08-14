import { createTheme, ThemeOptions } from "@mui/material/styles";

export const getSuryaTheme = (mode: "light" | "dark") => {
  const isDark = mode === "dark";

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: isDark ? "#4F46E5" : "#0A2540",
        light: "#3B82F6",
        dark: "#06182E",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: "#F59E0B",
        light: "#FBBF24",
        dark: "#D97706",
      },
      background: {
        default: isDark ? "#0F172A" : "#F8FAFC",
        paper: isDark ? "#1E293B" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#F8FAFC" : "#0F172A",
        secondary: isDark ? "#94A3B8" : "#64748B",
      },
      success: { main: "#10B981" },
      warning: { main: "#F59E0B" },
      error: { main: "#EF4444" },
      info: { main: "#3B82F6" },
    },
    typography: {
      fontFamily: [
        "Inter",
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        "sans-serif",
      ].join(","),
      h4: { fontWeight: 700, letterSpacing: "-0.5px" },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      subtitle1: { fontWeight: 500 },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: isDark
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)"
              : "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
            backdropFilter: "blur(8px)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: "8px 16px",
            boxShadow: "none",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            backgroundColor: isDark ? "#1E293B" : "#F1F5F9",
            color: isDark ? "#F8FAFC" : "#334155",
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};
