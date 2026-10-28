import { createTheme } from "@mui/material";

export type AppMode = "dark" | "light";

const SYSTEM_FONT = [
  "-apple-system",
  "BlinkMacSystemFont",
  '"SF Pro Text"',
  '"SF Pro Display"',
  '"Helvetica Neue"',
  '"Segoe UI"',
  "Roboto",
  "Arial",
  "sans-serif",
].join(",");

/**
 * Type scale leans on the system face (SF Pro on iOS) so the app reads as a
 * platform-native surface; hierarchy is carried by weight and size, not by a
 * second typeface. Sizes stay at or above the platform minimums.
 */
export function buildTheme(mode: AppMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: "#0a84ff", contrastText: "#ffffff" },
      success: { main: mode === "dark" ? "#30d158" : "#12a150" },
      warning: { main: mode === "dark" ? "#ff9f0a" : "#c96a00" },
      error: { main: mode === "dark" ? "#ff453a" : "#d92b21" },
      info: { main: "#0a84ff" },
      background: { default: "transparent", paper: "transparent" },
      text: {
        primary: mode === "dark" ? "#f4f7f8" : "#08222e",
        secondary: mode === "dark" ? "rgba(244,247,248,0.66)" : "rgba(8,34,46,0.62)",
      },
      divider: mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(20,58,80,0.1)",
    },
    shape: { borderRadius: 18 },
    typography: {
      fontFamily: SYSTEM_FONT,
      h1: { fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em" },
      h2: { fontSize: "1.05rem", fontWeight: 500, letterSpacing: "0" },
      h5: { fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.01em" },
      subtitle1: { fontWeight: 600 },
      body1: { fontSize: "1rem" },
      body2: { fontSize: "0.95rem" },
      button: { textTransform: "none", fontWeight: 600 },
    },
  });
}
