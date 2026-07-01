package com.suryapower.erp.service;

import com.suryapower.erp.dto.DocumentUploadResponse;
import com.suryapower.erp.storage.GoogleDriveStorageProvider;
import com.suryapower.erp.storage.SupabaseStorageProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
@RequiredArgsConstructor
public class DocumentStorageService {

    private final SupabaseStorageProvider supabaseStorageProvider;
    private final GoogleDriveStorageProvider googleDriveStorageProvider;

    public DocumentUploadResponse uploadWithBackup(String documentNumber, String storagePath, byte[] pdfContent) {
        String supabaseUrl = supabaseStorageProvider.upload(storagePath, pdfContent);
        String driveUrl = uploadWithRetry(storagePath, pdfContent, 3);
        return new DocumentUploadResponse(documentNumber, supabaseUrl, driveUrl, checksum(pdfContent), 1);
    }

    String uploadWithRetry(String storagePath, byte[] pdfContent, int maxAttempts) {
        int attempts = 0;
        while (attempts < maxAttempts) {
            try {
                return googleDriveStorageProvider.upload(storagePath, pdfContent);
            } catch (RuntimeException exception) {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw exception;
                }
            }
        }
        throw new IllegalStateException("Google Drive upload failed");
    }

    private String checksum(byte[] pdfContent) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(pdfContent);
            StringBuilder result = new StringBuilder();
            for (byte value : hash) {
                result.append(String.format("%02x", value));
            }
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Checksum algorithm missing", exception);
        }
    }
}
