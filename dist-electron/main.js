import { app as i, BrowserWindow as l } from "electron";
import _ from ".prisma/client/default";
import { fileURLToPath as f } from "node:url";
import a from "node:fs";
import e from "node:path";
var R = {
  ..._
};
const d = e.dirname(f(import.meta.url));
process.env.APP_ROOT = e.join(d, "..");
const t = process.env.VITE_DEV_SERVER_URL, h = e.join(process.env.APP_ROOT, "dist-electron"), p = e.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = t ? e.join(process.env.APP_ROOT, "public") : p;
let o, n = null;
function v() {
  if (process.env.DATABASE_URL)
    return process.env.DATABASE_URL;
  const s = i.isPackaged ? e.join(i.getPath("userData"), "invoice.sqlite") : e.join(process.env.APP_ROOT, "prisma", "dev.db"), r = e.dirname(s);
  a.existsSync(r) || a.mkdirSync(r, { recursive: !0 });
  const c = `file:${s}`;
  return process.env.DATABASE_URL = c, c;
}
async function P() {
  v(), n = new R.PrismaClient(), await n.$connect(), globalThis.__PRISMA = n;
}
function m() {
  o = new l({
    width: 1280,
    height: 800,
    title: "Invoice Management System",
    backgroundColor: "#0b132b",
    icon: e.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: e.join(d, "preload.mjs")
    }
  }), o.webContents.on("did-finish-load", () => {
    o == null || o.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), t ? o.loadURL(t) : o.loadFile(e.join(p, "index.html"));
}
i.on("window-all-closed", () => {
  process.platform !== "darwin" && (n == null || n.$disconnect().catch(() => {
  }), i.quit(), o = null);
});
i.on("before-quit", () => {
  n == null || n.$disconnect().catch(() => {
  });
});
i.on("activate", () => {
  l.getAllWindows().length === 0 && m();
});
i.whenReady().then(async () => {
  await P(), await import("./ipc-CQYleeOR.js"), m();
});
export {
  h as MAIN_DIST,
  p as RENDERER_DIST,
  t as VITE_DEV_SERVER_URL
};
