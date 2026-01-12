import { ipcMain } from "electron";
function getPrisma() {
  const prisma = globalThis.__PRISMA;
  if (!prisma) throw new Error("Prisma not initialized");
  return prisma;
}
function computeTotals(items) {
  let subtotal = 0;
  let taxTotal = 0;
  let discountTotal = 0;
  for (const item of items) {
    const lineSubtotal = item.quantity * item.rate;
    const lineTax = item.taxRate ? lineSubtotal * (item.taxRate / 100) : 0;
    const lineDiscount = item.discount ? item.discount : 0;
    subtotal += lineSubtotal;
    taxTotal += lineTax;
    discountTotal += lineDiscount;
  }
  const total = subtotal + taxTotal - discountTotal;
  return { subtotal, taxTotal, discountTotal, total };
}
function nextInvoiceNumberPrefix(date = /* @__PURE__ */ new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `INV-${y}${m}`;
}
async function generateInvoiceNumber(prisma) {
  const prefix = nextInvoiceNumberPrefix();
  const count = await prisma.invoice.count({
    where: {
      issueDate: {
        gte: new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1)
      }
    }
  });
  const seq = String(count + 1).padStart(4, "0");
  return `${prefix}-${seq}`;
}
ipcMain.handle("clients:list", async () => {
  const prisma = getPrisma();
  return prisma.client.findMany({ orderBy: { createdAt: "desc" } });
});
ipcMain.handle("clients:create", async (_e, data) => {
  const prisma = getPrisma();
  return prisma.client.create({ data });
});
ipcMain.handle("clients:update", async (_e, id, data) => {
  const prisma = getPrisma();
  return prisma.client.update({ where: { id }, data });
});
ipcMain.handle("clients:get", async (_e, id) => {
  const prisma = getPrisma();
  const client = await prisma.client.findUnique({ where: { id } });
  return client;
});
ipcMain.handle("invoices:list", async (_e, args) => {
  const prisma = getPrisma();
  const where = {};
  if (args == null ? void 0 : args.status) where.status = args.status;
  if (args == null ? void 0 : args.q) {
    where.OR = [
      { number: { contains: args.q, mode: "insensitive" } },
      { client: { name: { contains: args.q, mode: "insensitive" } } }
    ];
  }
  return prisma.invoice.findMany({
    where,
    include: { client: true },
    orderBy: { createdAt: "desc" }
  });
});
ipcMain.handle("invoices:get", async (_e, id) => {
  const prisma = getPrisma();
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, items: true, payments: true }
  });
  return inv;
});
ipcMain.handle("invoices:create", async (_e, data) => {
  const prisma = getPrisma();
  const number = await generateInvoiceNumber(prisma);
  const totals = computeTotals(data.items);
  const issueDate = new Date(data.issueDate);
  const dueDate = new Date(data.dueDate);
  const created = await prisma.invoice.create({
    data: {
      number,
      clientId: data.clientId,
      issueDate,
      dueDate,
      currency: data.currency ?? "USD",
      notes: data.notes,
      terms: data.terms,
      status: "DRAFT",
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      paidTotal: 0,
      balance: totals.total,
      items: {
        create: data.items.map((i) => {
          const lineSubtotal = i.quantity * i.rate;
          const lineTax = i.taxRate ? lineSubtotal * (i.taxRate / 100) : 0;
          const lineDiscount = i.discount ? i.discount : 0;
          return {
            description: i.description,
            quantity: i.quantity,
            rate: i.rate,
            taxRate: i.taxRate ?? null,
            discount: i.discount ?? null,
            lineSubtotal,
            lineTax,
            lineTotal: lineSubtotal + lineTax - lineDiscount
          };
        })
      }
    }
  });
  return created;
});
ipcMain.handle("invoices:update", async (_e, id, data) => {
  const prisma = getPrisma();
  const current = await prisma.invoice.findUnique({ where: { id } });
  if (!current) throw new Error("Invoice not found");
  if (current.status === "PAID") {
    const { notes, terms } = data;
    return prisma.invoice.update({ where: { id }, data: { notes, terms } });
  }
  return prisma.invoice.update({
    where: { id },
    data: {
      issueDate: data.issueDate ? new Date(data.issueDate) : void 0,
      dueDate: data.dueDate ? new Date(data.dueDate) : void 0,
      currency: data.currency,
      notes: data.notes,
      terms: data.terms
    }
  });
});
ipcMain.handle("invoices:duplicate", async (_e, id) => {
  const prisma = getPrisma();
  const original = await prisma.invoice.findUnique({ where: { id }, include: { items: true } });
  if (!original) throw new Error("Invoice not found");
  const number = await generateInvoiceNumber(prisma);
  const created = await prisma.invoice.create({
    data: {
      number,
      clientId: original.clientId,
      issueDate: /* @__PURE__ */ new Date(),
      dueDate: original.dueDate,
      currency: original.currency,
      notes: original.notes,
      terms: original.terms,
      status: "DRAFT",
      subtotal: original.subtotal,
      taxTotal: original.taxTotal,
      discountTotal: original.discountTotal,
      total: original.total,
      paidTotal: 0,
      balance: original.total,
      items: {
        create: original.items.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity),
          rate: Number(i.rate),
          taxRate: i.taxRate ?? null,
          discount: i.discount ?? null,
          lineSubtotal: Number(i.lineSubtotal),
          lineTax: Number(i.lineTax),
          lineTotal: Number(i.lineTotal)
        }))
      }
    }
  });
  return created;
});
ipcMain.handle("invoices:send", async (_e, id) => {
  const prisma = getPrisma();
  const updated = await prisma.invoice.update({ where: { id }, data: { status: "SENT" } });
  return updated;
});
ipcMain.handle("payments:add", async (_e, data) => {
  const prisma = getPrisma();
  const invoice = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
  if (!invoice) throw new Error("Invoice not found");
  const amount = data.amount;
  const newPaidTotal = Number(invoice.paidTotal) + amount;
  const newBalance = Number(invoice.total) - newPaidTotal;
  if (newBalance < -1e-4) throw new Error("Payment exceeds invoice total");
  const payment = await prisma.payment.create({
    data: {
      invoiceId: data.invoiceId,
      amount,
      date: new Date(data.date),
      mode: data.mode,
      reference: data.reference,
      note: data.note
    }
  });
  let status = "DRAFT";
  if (newBalance <= 0) status = "PAID";
  else if (newPaidTotal > 0) status = "PARTIALLY_PAID";
  const now = /* @__PURE__ */ new Date();
  if (now > new Date(invoice.dueDate) && newBalance > 0) status = "OVERDUE";
  await prisma.invoice.update({
    where: { id: data.invoiceId },
    data: {
      paidTotal: newPaidTotal,
      balance: Math.max(newBalance, 0),
      status
    }
  });
  return payment;
});
ipcMain.handle("dashboard:snapshot", async () => {
  const prisma = getPrisma();
  const invoices = await prisma.invoice.findMany();
  const totalInvoices = invoices.length;
  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total), 0);
  const paidAmount = invoices.reduce((sum, i) => sum + Number(i.paidTotal), 0);
  const unpaidAmount = totalInvoiced - paidAmount;
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;
  return { totalInvoices, totalInvoiced, paidAmount, unpaidAmount, overdueCount };
});
