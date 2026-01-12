/**
 * Type definitions for renderer process
 * These are decoupled from @prisma/client to prevent bundling Prisma in renderer
 */

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export interface Client {
  id: number
  name: string
  email: string | null
  phone: string | null
  billingAddress: string | null
  taxId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceItem {
  id: number
  invoiceId: number
  description: string
  quantity: string | number // Decimal type
  rate: string | number // Decimal type
  taxRate: string | number | null // Decimal type
  discount: string | number | null // Decimal type
  lineSubtotal: string | number // Decimal type
  lineTax: string | number // Decimal type
  lineTotal: string | number // Decimal type
}

export interface Payment {
  id: number
  invoiceId: number
  amount: string | number // Decimal type
  date: Date
  mode: string | null
  reference: string | null
  note: string | null
  createdAt: Date
}

export interface Invoice {
  id: number
  uuid: string
  number: string
  clientId: number
  status: InvoiceStatus
  issueDate: Date
  dueDate: Date
  currency: string
  subtotal: string | number // Decimal type
  taxTotal: string | number // Decimal type
  discountTotal: string | number // Decimal type
  total: string | number // Decimal type
  paidTotal: string | number // Decimal type
  balance: string | number // Decimal type
  notes: string | null
  terms: string | null
  createdAt: Date
  updatedAt: Date
}

export interface InvoiceWithRelations extends Invoice {
  client: Client
  items: InvoiceItem[]
  payments: Payment[]
}

export interface DashboardMetrics {
  totalInvoices: number
  totalInvoiced: number
  totalPaid: number
  totalUnpaid: number
  overdueCount: number
  invoicesByStatus: Record<string, number>
}
