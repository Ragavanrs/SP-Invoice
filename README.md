# Surya Power ERP (SP-Invoice)

This repository now contains the initial split-architecture foundation:

- `/surya-power-ui` — Next.js + TypeScript + Tailwind dashboard shell
- `/surya-power-api` — Spring Boot 3.5 + Java 17 API foundation (Java 21-ready code style)

## Implemented baseline

### API
- Clean package split (`config`, `controller`, `domain`, `service`, `storage`, `dto`)
- JWT resource-server security baseline
- Health endpoint: `GET /api/v1/health`
- Document numbering format (e.g. `INV-2026-000021`)
- Supabase path convention (e.g. `invoice/2026/07/INV-2026-000021.pdf`)
- Google Drive path convention by year/month/type
- Dual upload orchestration (Supabase + Google Drive) with 3-attempt retry for backup uploads
- SHA-256 checksum generation for uploaded documents

### UI
- Responsive ERP dashboard shell
- KPI cards and quick actions
- Core module list for invoices, challans, quotations, AMC, customers, products, reports, audit logs
- Light/dark mode compatible layout

## Run locally

### UI
```bash
cd surya-power-ui
npm install
npm run dev
```

### API
```bash
cd surya-power-api
mvn spring-boot:run
```

## Tests

```bash
cd surya-power-api
mvn test
```
