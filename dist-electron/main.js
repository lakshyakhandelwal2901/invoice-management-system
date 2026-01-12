import { app, BrowserWindow } from "electron";
import require$$0 from ".prisma/client/default";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
var _default = {
  ...require$$0
};
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let prisma = null;
function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const dbFile = app.isPackaged ? path.join(app.getPath("userData"), "invoice.sqlite") : path.join(process.env.APP_ROOT, "prisma", "dev.db");
  const dir = path.dirname(dbFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const url = `file:${dbFile}`;
  process.env.DATABASE_URL = url;
  return url;
}
async function initPrisma() {
  resolveDatabaseUrl();
  if (app.isPackaged) {
    const prismaPath = path.join(process.resourcesPath, "app.asar.unpacked", "node_modules", ".prisma", "client");
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = path.join(
      prismaPath,
      process.platform === "win32" ? "query_engine-windows.dll.node" : process.platform === "darwin" ? "libquery_engine-darwin.dylib.node" : "libquery_engine-linux-gnu.so.node"
    );
  }
  prisma = new _default.PrismaClient();
  await prisma.$connect();
  globalThis.__PRISMA = prisma;
}
function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Invoice Management System",
    backgroundColor: "#0b132b",
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    prisma == null ? void 0 : prisma.$disconnect().catch(() => {
    });
    app.quit();
    win = null;
  }
});
app.on("before-quit", () => {
  prisma == null ? void 0 : prisma.$disconnect().catch(() => {
  });
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(async () => {
  await initPrisma();
  await import("./ipc-COBkbr3z.js");
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
