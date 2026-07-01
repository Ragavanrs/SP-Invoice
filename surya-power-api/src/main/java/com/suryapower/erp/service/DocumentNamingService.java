package com.suryapower.erp.service;

import com.suryapower.erp.domain.DocumentType;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class DocumentNamingService {

    public String generateDocumentNumber(DocumentType type, LocalDate date, long sequence) {
        return "%s-%d-%06d".formatted(type.prefix(), date.getYear(), sequence);
    }

    public String generateSupabasePath(DocumentType type, LocalDate date, String fileName) {
        return "%s/%d/%02d/%s".formatted(type.storageFolder(), date.getYear(), date.getMonthValue(), fileName);
    }

    public String generateDrivePath(DocumentType type, LocalDate date) {
        return "%d/%s/%s".formatted(date.getYear(), date.getMonth(), type.storageFolder());
    }
}
