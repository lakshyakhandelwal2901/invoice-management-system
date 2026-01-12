/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
import type { Client, Invoice, Payment, InvoiceItem, InvoiceStatus } from '../src/types'

declare global {
  interface Window {
    ipcRenderer: import('electron').IpcRenderer
    api: {
      // Clients
      listClients: () => Promise<Client[]>
      createClient: (data: { name: string; email?: string; phone?: string; billingAddress?: string; taxId?: string }) => Promise<Client>
      updateClient: (id: number, data: Partial<{ name: string; email?: string; phone?: string; billingAddress?: string; taxId?: string }>) => Promise<Client>
      getClient: (id: number) => Promise<Client | null>

      // Invoices
      listInvoices: (args?: { status?: InvoiceStatus; q?: string }) => Promise<Array<Invoice & { client: Client }>>
      getInvoice: (id: number) => Promise<(Invoice & { client: Client; items: InvoiceItem[]; payments: Payment[] }) | null>
      createInvoice: (data: {
        clientId: number
        issueDate: string
        dueDate: string
        currency?: string
        notes?: string
        terms?: string
        items: Array<{ description: string; quantity: number; rate: number; taxRate?: number | null; discount?: number | null }>
      }) => Promise<Invoice>
      updateInvoice: (id: number, data: Partial<{ issueDate: string; dueDate: string; currency: string; notes: string; terms: string }>) => Promise<Invoice>
      duplicateInvoice: (id: number) => Promise<Invoice>
      sendInvoice: (id: number) => Promise<Invoice>

      // Payments
      addPayment: (data: { invoiceId: number; amount: number; date: string; mode?: string; reference?: string; note?: string }) => Promise<Payment>

      // Dashboard
      dashboardSnapshot: () => Promise<{ totalInvoices: number; totalInvoiced: number; paidAmount: number; unpaidAmount: number; overdueCount: number }>
    }
  }
}

export {}
