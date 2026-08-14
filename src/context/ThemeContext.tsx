"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeProvider as MuiThemeProvider, CssBaseline } from "@mui/material";
import { getSuryaTheme } from "@/theme/theme";

interface ThemeContextType {
  mode: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedMode = localStorage.getItem("theme_mode") as "light" | "dark";
    if (savedMode) setMode(savedMode);
  }, []);

  const toggleTheme = () => {
    const nextMode = mode === "light" ? "dark" : "light";
    setMode(nextMode);
    localStorage.setItem("theme_mode", nextMode);
  };

  const theme = getSuryaTheme(mode);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
