import { Check, MicOutlined, NetworkPing } from "@mui/icons-material";
import { Chip, CircularProgress } from "@mui/material";

import { useConfigProvider } from "../../Config/useConfig";
import { useShazarrProvider } from "../useShazarr";

export default function StatusChip() {
  const { shazarrLoading, showInlineResult, recordingStatus } = useShazarrProvider();
  const { isNetworkConnected } = useConfigProvider();

  const isBusy = recordingStatus !== "inactive" || shazarrLoading;
  const signal = showInlineResult
    ? "var(--sz-ok)"
    : isBusy
      ? "var(--sz-content)"
      : !isNetworkConnected
        ? "var(--sz-err)"
        : "var(--sz-content-secondary)";

  return (
    <Chip
      aria-live="polite"
      sx={{ color: signal, "& .MuiChip-icon": { color: signal } }}
      icon={
        recordingStatus && recordingStatus !== "inactive" ? (
          <CircularProgress size={16} style={{ margin: "0 5px 0 12px" }} />
        ) : showInlineResult ? (
          <Check fontSize="small" />
        ) : !isNetworkConnected ? (
          <NetworkPing fontSize="small" />
        ) : (
          <MicOutlined fontSize="small" />
        )
      }
      label={
        recordingStatus && recordingStatus !== "inactive"
          ? recordingStatus === "recording"
            ? "Listening…"
            : "Recognizing…"
          : showInlineResult
            ? "Found!"
            : !isNetworkConnected
              ? "Offline mode"
              : "Ready"
      }
      variant="outlined"
    />
  );
}
