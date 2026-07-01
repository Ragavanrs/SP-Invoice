package com.suryapower.erp.service;

import com.suryapower.erp.storage.GoogleDriveStorageProvider;
import com.suryapower.erp.storage.SupabaseStorageProvider;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DocumentStorageServiceTest {

    @Test
    void shouldRetryGoogleDriveUploadAndSucceedOnThirdAttempt() {
        SupabaseStorageProvider supabase = new SupabaseStorageProvider();
        GoogleDriveStorageProvider drive = new GoogleDriveStorageProvider() {
            private int attempts;

            @Override
            public String upload(String path, byte[] content) {
                attempts++;
                if (attempts < 3) {
                    throw new IllegalStateException("Temporary error");
                }
                return super.upload(path, content);
            }
        };

        DocumentStorageService service = new DocumentStorageService(supabase, drive);
        String driveUrl = service.uploadWithRetry("2026/JULY/invoice", "pdf".getBytes(), 3);
        assertEquals("https://drive.google.com/surya-power/2026/JULY/invoice", driveUrl);
    }
}
