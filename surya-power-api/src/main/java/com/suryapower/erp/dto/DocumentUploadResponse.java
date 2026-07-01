package com.suryapower.erp.dto;

public record DocumentUploadResponse(
        String documentNumber,
        String supabaseUrl,
        String googleDriveUrl,
        String checksum,
        int version
) {
}
