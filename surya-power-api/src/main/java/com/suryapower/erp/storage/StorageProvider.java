package com.suryapower.erp.storage;

public interface StorageProvider {
    String upload(String path, byte[] content);
}
