# Invoice Management System (Desktop)

Offline-first desktop app to create, send, and track invoices. Built with Electron, React, and SQLite (via Prisma) so everything runs locally without a server.

## Tech stack

- Electron + Vite + React + TypeScript
- Prisma + SQLite (local database stored on disk)
- Electron Builder for packaging (macOS dmg, Windows nsis, Linux AppImage)

## Features planned

- Invoice lifecycle: draft → sent → partial/paid → overdue
- Client management with linked invoices
- Payment tracking (partial payments, remaining balance)
- Share/export: email/WhatsApp/link, PDF, print
- Dashboard snapshots and filters; invoice-focused reports
- Reminders for overdue/upcoming due invoices

## Getting started

Prerequisites: Node 18+ and npm.

```bash
npm install
npm run dev
```

`npm run dev` starts Vite and launches Electron with hot reload for renderer and main processes.

### Database (Prisma + SQLite)

- Schema: prisma/schema.prisma
- Local database: prisma/dev.db (development)

Commands:

```bash
npm run prisma:migrate   # create/apply migrations
npm run prisma:generate  # regenerate Prisma Client
```

### Build desktop installers

```bash
npm run build
```

Build outputs land in release/<version> (macOS dmg, Windows nsis, Linux AppImage). Product metadata is configured in electron-builder.json5.

### Data location in production

- Development: prisma/dev.db in the repo (SQLite).
- Packaged app: stored under the OS userData path (e.g., ~/Library/Application Support/Invoice Management System or %APPDATA%/Invoice Management System). The path is set automatically at runtime.

## Project layout

- electron/main.ts – Electron main process + Prisma bootstrapping
- electron/preload.ts – IPC surface exposed to the renderer
- src/ – React renderer (UI)
- prisma/ – Prisma schema and migrations

## Next steps

- Wire IPC routes for CRUD (clients, invoices, payments)
- Add PDF invoice template and share flows
- Implement dashboard, search, filters, and reminders
