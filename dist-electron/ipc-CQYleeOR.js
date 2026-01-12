import { ipcMain as r } from "electron";
function u() {
  const o = globalThis.__PRISMA;
  if (!o) throw new Error("Prisma not initialized");
  return o;
}
function v(o) {
  let t = 0, n = 0, e = 0;
  for (const s of o) {
    const a = s.quantity * s.rate, l = s.taxRate ? a * (s.taxRate / 100) : 0, i = s.discount ? s.discount : 0;
    t += a, n += l, e += i;
  }
  const c = t + n - e;
  return { subtotal: t, taxTotal: n, discountTotal: e, total: c };
}
function D(o = /* @__PURE__ */ new Date()) {
  const t = o.getFullYear(), n = String(o.getMonth() + 1).padStart(2, "0");
  return `INV-${t}${n}`;
}
async function p(o) {
  const t = D(), n = await o.invoice.count({
    where: {
      issueDate: {
        gte: new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1)
      }
    }
  }), e = String(n + 1).padStart(4, "0");
  return `${t}-${e}`;
}
r.handle("clients:list", async () => u().client.findMany({ orderBy: { createdAt: "desc" } }));
r.handle("clients:create", async (o, t) => u().client.create({ data: t }));
r.handle("clients:update", async (o, t, n) => u().client.update({ where: { id: t }, data: n }));
r.handle("clients:get", async (o, t) => await u().client.findUnique({ where: { id: t } }));
r.handle("invoices:list", async (o, t) => {
  const n = u(), e = {};
  return t != null && t.status && (e.status = t.status), t != null && t.q && (e.OR = [
    { number: { contains: t.q } },
    { client: { is: { name: { contains: t.q } } } }
  ]), n.invoice.findMany({
    where: e,
    include: { client: !0 },
    orderBy: { createdAt: "desc" }
  });
});
r.handle("invoices:get", async (o, t) => await u().invoice.findUnique({
  where: { id: t },
  include: { client: !0, items: !0, payments: !0 }
}));
r.handle("invoices:create", async (o, t) => {
  const n = u(), e = await p(n), c = v(t.items), s = new Date(t.issueDate), a = new Date(t.dueDate);
  return await n.invoice.create({
    data: {
      number: e,
      clientId: t.clientId,
      issueDate: s,
      dueDate: a,
      currency: t.currency ?? "USD",
      notes: t.notes,
      terms: t.terms,
      status: "DRAFT",
      subtotal: c.subtotal,
      taxTotal: c.taxTotal,
      discountTotal: c.discountTotal,
      total: c.total,
      paidTotal: 0,
      balance: c.total,
      items: {
        create: t.items.map((i) => {
          const d = i.quantity * i.rate, m = i.taxRate ? d * (i.taxRate / 100) : 0, w = i.discount ? i.discount : 0;
          return {
            description: i.description,
            quantity: i.quantity,
            rate: i.rate,
            taxRate: i.taxRate ?? null,
            discount: i.discount ?? null,
            lineSubtotal: d,
            lineTax: m,
            lineTotal: d + m - w
          };
        })
      }
    }
  });
});
r.handle("invoices:update", async (o, t, n) => {
  const e = u(), c = await e.invoice.findUnique({ where: { id: t } });
  if (!c) throw new Error("Invoice not found");
  if (c.status === "PAID") {
    const { notes: s, terms: a } = n;
    return e.invoice.update({ where: { id: t }, data: { notes: s, terms: a } });
  }
  return e.invoice.update({
    where: { id: t },
    data: {
      issueDate: n.issueDate ? new Date(n.issueDate) : void 0,
      dueDate: n.dueDate ? new Date(n.dueDate) : void 0,
      currency: n.currency,
      notes: n.notes,
      terms: n.terms
    }
  });
});
r.handle("invoices:duplicate", async (o, t) => {
  const n = u(), e = await n.invoice.findUnique({ where: { id: t }, include: { items: !0 } });
  if (!e) throw new Error("Invoice not found");
  const c = await p(n);
  return await n.invoice.create({
    data: {
      number: c,
      clientId: e.clientId,
      issueDate: /* @__PURE__ */ new Date(),
      dueDate: e.dueDate,
      currency: e.currency,
      notes: e.notes,
      terms: e.terms,
      status: "DRAFT",
      subtotal: e.subtotal,
      taxTotal: e.taxTotal,
      discountTotal: e.discountTotal,
      total: e.total,
      paidTotal: 0,
      balance: e.total,
      items: {
        create: e.items.map((a) => ({
          description: a.description,
          quantity: Number(a.quantity),
          rate: Number(a.rate),
          taxRate: a.taxRate ?? null,
          discount: a.discount ?? null,
          lineSubtotal: Number(a.lineSubtotal),
          lineTax: Number(a.lineTax),
          lineTotal: Number(a.lineTotal)
        }))
      }
    }
  });
});
r.handle("invoices:send", async (o, t) => await u().invoice.update({ where: { id: t }, data: { status: "SENT" } }));
r.handle("payments:add", async (o, t) => {
  const n = u(), e = await n.invoice.findUnique({ where: { id: t.invoiceId } });
  if (!e) throw new Error("Invoice not found");
  const c = t.amount, s = Number(e.paidTotal) + c, a = Number(e.total) - s;
  if (a < -1e-4) throw new Error("Payment exceeds invoice total");
  const l = await n.payment.create({
    data: {
      invoiceId: t.invoiceId,
      amount: c,
      date: new Date(t.date),
      mode: t.mode,
      reference: t.reference,
      note: t.note
    }
  });
  let i = "DRAFT";
  return a <= 0 ? i = "PAID" : s > 0 && (i = "PARTIALLY_PAID"), /* @__PURE__ */ new Date() > new Date(e.dueDate) && a > 0 && (i = "OVERDUE"), await n.invoice.update({
    where: { id: t.invoiceId },
    data: {
      paidTotal: s,
      balance: Math.max(a, 0),
      status: i
    }
  }), l;
});
r.handle("dashboard:snapshot", async () => {
  const t = await u().invoice.findMany(), n = t.length, e = t.reduce((l, i) => l + Number(i.total), 0), c = t.reduce((l, i) => l + Number(i.paidTotal), 0), s = e - c, a = t.filter((l) => l.status === "OVERDUE").length;
  return { totalInvoices: n, totalInvoiced: e, paidAmount: c, unpaidAmount: s, overdueCount: a };
});
