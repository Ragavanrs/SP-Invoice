"use client";

import React from "react";
import { Chip, Tooltip, Link as MuiLink } from "@mui/material";
import { CloudDone, CloudOff, CloudSync, OpenInNew } from "@mui/icons-material";

interface DriveStatusBadgeProps {
  status?: "SUCCESS" | "PENDING" | "FAILED";
  driveUrl?: string | null;
  errorMsg?: string | null;
  onRetry?: () => void;
}

export const DriveStatusBadge: React.FC<DriveStatusBadgeProps> = ({
  status = "PENDING",
  driveUrl,
  errorMsg,
  onRetry,
}) => {
  if (status === "SUCCESS" && driveUrl) {
    return (
      <Tooltip title="View in Google Drive">
        <Chip
          icon={<CloudDone fontSize="small" />}
          label="In Google Drive"
          size="small"
          color="success"
          component={MuiLink}
          href={driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          clickable
          onDelete={() => window.open(driveUrl, "_blank")}
          deleteIcon={<OpenInNew fontSize="small" />}
          sx={{ fontWeight: 600 }}
        />
      </Tooltip>
    );
  }

  if (status === "FAILED") {
    return (
      <Tooltip title={errorMsg || "Google Drive sync failed. Click to retry."}>
        <Chip
          icon={<CloudOff fontSize="small" />}
          label="Drive Failed (Retry)"
          size="small"
          color="error"
          onClick={onRetry}
          clickable
          sx={{ fontWeight: 600 }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Local copy saved. Google Drive sync in progress or awaiting credentials.">
      <Chip
        icon={<CloudSync fontSize="small" />}
        label="Saved Locally"
        size="small"
        color="warning"
        onClick={onRetry}
        clickable
        sx={{ fontWeight: 600 }}
      />
    </Tooltip>
  );
};
