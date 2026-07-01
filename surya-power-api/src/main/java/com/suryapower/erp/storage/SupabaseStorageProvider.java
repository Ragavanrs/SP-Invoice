package com.suryapower.erp.storage;

import org.springframework.stereotype.Component;

@Component
public class SupabaseStorageProvider implements StorageProvider {

    @Override
    public String upload(String path, byte[] content) {
        return "https://supabase.local/storage/" + path;
    }
}
