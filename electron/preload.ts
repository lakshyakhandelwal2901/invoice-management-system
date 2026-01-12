import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// High-level API, safer to use in renderer
contextBridge.exposeInMainWorld('api', {
  // Clients
  listClients: () => ipcRenderer.invoke('clients:list'),
  createClient: (data: { name: string; email?: string; phone?: string; billingAddress?: string; taxId?: string }) => ipcRenderer.invoke('clients:create', data),
  updateClient: (id: number, data: Partial<{ name: string; email?: string; phone?: string; billingAddress?: string; taxId?: string }>) => ipcRenderer.invoke('clients:update', id, data),
  getClient: (id: number) => ipcRenderer.invoke('clients:get', id),

  // Invoices
  listInvoices: (args?: { status?: string; q?: string }) => ipcRenderer.invoke('invoices:list', args),
  getInvoice: (id: number) => ipcRenderer.invoke('invoices:get', id),
  createInvoice: (data: {
    clientId: number
    issueDate: string
    dueDate: string
    currency?: string
    notes?: string
    terms?: string
    items: Array<{ description: string; quantity: number; rate: number; taxRate?: number | null; discount?: number | null }>
  }) => ipcRenderer.invoke('invoices:create', data),
  updateInvoice: (id: number, data: Partial<{ issueDate: string; dueDate: string; currency: string; notes: string; terms: string }>) => ipcRenderer.invoke('invoices:update', id, data),
  duplicateInvoice: (id: number) => ipcRenderer.invoke('invoices:duplicate', id),
  sendInvoice: (id: number) => ipcRenderer.invoke('invoices:send', id),

  // Payments
  addPayment: (data: { invoiceId: number; amount: number; date: string; mode?: string; reference?: string; note?: string }) => ipcRenderer.invoke('payments:add', data),

  // Dashboard
  dashboardSnapshot: () => ipcRenderer.invoke('dashboard:snapshot'),
})
