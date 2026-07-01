package com.suryapower.erp.domain;

public enum DocumentType {
    INVOICE("INV", "invoice"),
    QUOTATION("QT", "quotation"),
    DELIVERY_CHALLAN("DC", "challan"),
    AMC("AMC", "amc");

    private final String prefix;
    private final String storageFolder;

    DocumentType(String prefix, String storageFolder) {
        this.prefix = prefix;
        this.storageFolder = storageFolder;
    }

    public String prefix() {
        return prefix;
    }

    public String storageFolder() {
        return storageFolder;
    }
}
