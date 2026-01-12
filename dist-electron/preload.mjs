"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("api", {
  // Clients
  listClients: () => electron.ipcRenderer.invoke("clients:list"),
  createClient: (data) => electron.ipcRenderer.invoke("clients:create", data),
  updateClient: (id, data) => electron.ipcRenderer.invoke("clients:update", id, data),
  getClient: (id) => electron.ipcRenderer.invoke("clients:get", id),
  // Invoices
  listInvoices: (args) => electron.ipcRenderer.invoke("invoices:list", args),
  getInvoice: (id) => electron.ipcRenderer.invoke("invoices:get", id),
  createInvoice: (data) => electron.ipcRenderer.invoke("invoices:create", data),
  updateInvoice: (id, data) => electron.ipcRenderer.invoke("invoices:update", id, data),
  duplicateInvoice: (id) => electron.ipcRenderer.invoke("invoices:duplicate", id),
  sendInvoice: (id) => electron.ipcRenderer.invoke("invoices:send", id),
  // Payments
  addPayment: (data) => electron.ipcRenderer.invoke("payments:add", data),
  // Dashboard
  dashboardSnapshot: () => electron.ipcRenderer.invoke("dashboard:snapshot")
});
