# SURYA POWER - Fullstack ERP & Document Management System

A production-ready Enterprise Document Management System for **SURYA POWER** (DG Set Hiring, Buying, Selling & Servicing) built for **100% Vercel Deployment**.

---

## ⚡ Business Overview

- **Company Name**: SURYA POWER
- **Line of Business**: DG Set Hiring, Old DG Set Buying, Selling & Servicing
- **Address**: No. 1/11, G.N.T Road, Padiyanallur Redhills, Chennai, Thiruvallur, Tamil Nadu - 600 052
- **Mobiles**: 9790987190, 9840841887
- **GSTIN**: 33AKNPR3914K1ZT
- **Bank Details**:
  - Bank Name: **TAMILNAD MERCANTILE BANK**
  - Account Name: **SURYA POWER**
  - Account No: **228150050800163**
  - Branch: **NARAVARIKUPPAM BRANCH**
  - IFSC Code: **TMBL0000228**

---

## 🚀 Tech Stack

- **Frontend**: Next.js 15 App Router, React 19, TypeScript, Material UI v6, Emotion, TanStack React Query v5, React Hook Form, Zod, DayJS, Axios.
- **Backend & Database**: Next.js Serverless API Route Handlers (`src/app/api/v1/*`), Prisma ORM, PostgreSQL (Neon / Supabase / Render / Vercel Postgres), `jose` JWT authentication, `bcryptjs` password hashing.
- **PDF Engine**: `pdf-lib` + `qrcode` generating pixel-perfect A4 printable documents matching Surya Power paper billing & delivery challan templates.
- **Google Drive Storage**: `googleapis` (Drive API v3) with automatic folder creation (`Surya Power/{Quotations, Tax Invoices, Delivery Challans}`), upload, drive file ID/URL tracking, and fallback cache.

---

## 📁 Automatic Document Series

- **Quotation**: `QT-2026-000001`, `QT-2026-000002`, ...
- **Tax Invoice**: `INV-2026-000001`, `INV-2026-000002`, ...
- **Delivery Challan**: `DC-2026-000001`, `DC-2026-000002`, ...

---

## 🛠️ Modules Included

1. **Executive Dashboard**:
   - Today's Sales, Monthly Sales, Pending Quotations, Pending Deliveries, Pending Payments Amount & Count.
   - Recent Documents Table, Top Customers, Audit Log Activity timeline.
2. **Customer Master Management**:
   - Company Name, GSTIN (with auto PAN extraction & 15-char regex validation), PAN, Address, Shipping Address, Contact Person, Phone, Email, State, State Code, Place of Supply, Status, Remarks.
   - **Customer Ledger Modal**: Full transaction history (Total Billed, Total Paid, Total Pending Due).
3. **Product Master (DG Set Inventory)**:
   - Product Name, DG Brand, Engine Brand & S/N, Alternator Brand & S/N, Model, Serial Number, KVA rating, Fuel Type, Purchase Cost, Selling Price, GST %, HSN Code.
4. **Quotations (`QT-2026-XXXXXX`)**:
   - Multi-item line builder, real-time GST calculation (CGST, SGST, IGST, Round Off, Grand Total), A4 PDF preview/download, WhatsApp share link, Email, **Convert to Invoice** button.
5. **Tax Invoices (`INV-2026-XXXXXX`)**:
   - GST tax invoice generator, payment status toggle (PAID/PENDING/OVERDUE), Tamilnad Mercantile Bank details, embedded UPI QR Code, digital signature/seal placeholder, PDF, Print, Email, WhatsApp, Google Drive sync.
6. **Delivery Challans (`DC-2026-XXXXXX`)**:
   - Material dispatch slip, vehicle number, driver name, dispatch time, material details, customer & company signature blocks, PDF & Drive sync.
7. **Google Drive Document Manager**:
   - View all synced files under `Surya Power/{Quotations, Tax Invoices, Delivery Challans}`. Preview, open in Drive, retry fallback queue, regenerate.
8. **Audit Trail Logs**:
   - Activity log tracking user actions, timestamps, and details.

---

## 🔑 Demo Login Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@suryapower.com` | `admin123` |
| **Sales Staff** | `staff@suryapower.com` | `staff123` |
| **Accountant** | `accountant@suryapower.com` | `accountant123` |

---

## ⚙️ Local Setup & Seed Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Database Migration & Seed**:
   Set `DATABASE_URL` in `.env.local` (e.g. Neon, Supabase, or PostgreSQL), then run:
   ```bash
   npx prisma db push
   npx prisma db seed
   ```
   *Or click the **"Initialize / Seed Database"** button directly on the Login page.*

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## ☁️ Vercel Deployment Instructions

1. Push code to GitHub repository.
2. Import project into Vercel Dashboard.
3. Configure Environment Variables in Vercel settings:
   - `DATABASE_URL`: Your PostgreSQL connection string (Neon / Supabase / Railway).
   - `JWT_SECRET`: Random secret string.
   - `GOOGLE_DRIVE_CLIENT_ID`: (Optional) Google Drive OAuth Client ID.
   - `GOOGLE_DRIVE_CLIENT_SECRET`: (Optional) Google Drive OAuth Client Secret.
   - `GOOGLE_DRIVE_REFRESH_TOKEN`: (Optional) Google Drive OAuth Refresh Token.
4. Deploy! Vercel will automatically run `prisma generate && next build`.
