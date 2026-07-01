package com.suryapower.erp.service;

import com.suryapower.erp.domain.DocumentType;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DocumentNamingServiceTest {

    private final DocumentNamingService service = new DocumentNamingService();

    @Test
    void shouldGenerateInvoiceNumberWithExpectedFormat() {
        String value = service.generateDocumentNumber(DocumentType.INVOICE, LocalDate.of(2026, 7, 1), 21);
        assertEquals("INV-2026-000021", value);
    }

    @Test
    void shouldGenerateSupabasePathWithYearAndMonthFolder() {
        String path = service.generateSupabasePath(DocumentType.QUOTATION, LocalDate.of(2026, 7, 1), "QT-2026-000018.pdf");
        assertEquals("quotation/2026/07/QT-2026-000018.pdf", path);
    }
}
