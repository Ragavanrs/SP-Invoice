export type Role = "ADMIN" | "STAFF" | "ACCOUNTANT";
export type PaymentStatus = "PENDING" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED";
export type QuotationStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "CONVERTED";
export type DeliveryStatus = "PENDING" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
export type EntityType = "QUOTATION" | "TAX_INVOICE" | "DELIVERY_CHALLAN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  companyName: string;
  gstin?: string;
  pan?: string;
  address: string;
  shippingAddress?: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  state: string;
  stateCode: string;
  placeOfSupply: string;
  status: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  dgBrand?: string;
  engineBrand?: string;
  alternatorBrand?: string;
  model?: string;
  serialNumber?: string;
  engineNumber?: string;
  alternatorNumber?: string;
  kva?: number;
  fuelType?: string;
  purchaseCost: number;
  sellingPrice: number;
  gstPercentage: number;
  hsnCode: string;
  description?: string;
  createdAt: string;
}

export interface QuotationItem {
  id?: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  gstPercentage: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quotationNo: string;
  customerId: string;
  customer: Customer;
  date: string;
  validUntil: string;
  subTotal: number;
  discount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  grandTotal: number;
  status: QuotationStatus;
  terms?: string;
  notes?: string;
  preparedBy?: string;
  approvedBy?: string;
  convertedToInvoiceNo?: string;
  items: QuotationItem[];
  createdAt: string;
}

export interface InvoiceItem {
  id?: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  gstPercentage: number;
  amount: number;
}

export interface TaxInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  customerId: string;
  customer: Customer;
  gstin?: string;
  billingAddress: string;
  shippingAddress?: string;
  poNumber?: string;
  deliveryChallanNo?: string;
  vehicleNumber?: string;
  subTotal: number;
  discount: number;
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  roundOff: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paymentMode?: string;
  bankDetails?: string;
  terms?: string;
  notes?: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface DeliveryItem {
  id?: string;
  particulars: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  remarks?: string;
}

export interface DeliveryChallan {
  id: string;
  challanNo: string;
  date: string;
  customerId: string;
  customer: Customer;
  vehicleNumber?: string;
  driverName?: string;
  dispatchTime?: string;
  status: DeliveryStatus;
  remarks?: string;
  items: DeliveryItem[];
  createdAt: string;
}

export interface DriveDocument {
  id: string;
  entityType: EntityType;
  entityId: string;
  documentNo: string;
  driveFileId?: string;
  driveUrl?: string;
  folderName: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  uploadStatus: "SUCCESS" | "PENDING" | "FAILED";
  errorMsg?: string;
  createdAt: string;
}

export interface DashboardStats {
  todaysSales: number;
  monthlySales: number;
  pendingQuotations: number;
  pendingDeliveries: number;
  pendingPaymentsAmount: number;
  pendingPaymentsCount: number;
  recentDocuments: Array<{
    id: string;
    type: string;
    number: string;
    customer: string;
    amount: number;
    date: string;
    status: string;
  }>;
  monthlyRevenueChart: Array<{
    month: string;
    sales: number;
    quotations: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    totalAmount: number;
    invoiceCount: number;
  }>;
  latestActivities: Array<{
    id: string;
    action: string;
    entityName: string;
    details?: string;
    performedBy: string;
    createdAt: string;
  }>;
}

export interface AuditLog {
  id: string;
  entityName: string;
  entityId?: string;
  action: string;
  performedBy: string;
  details?: string;
  createdAt: string;
}
