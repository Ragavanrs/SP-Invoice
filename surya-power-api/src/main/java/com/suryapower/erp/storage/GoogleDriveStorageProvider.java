package com.suryapower.erp.storage;

import org.springframework.stereotype.Component;

@Component
public class GoogleDriveStorageProvider implements StorageProvider {

    @Override
    public String upload(String path, byte[] content) {
        return "https://drive.google.com/surya-power/" + path;
    }
}
