# Invoice Management System (Python + PySide6)

A lightweight desktop invoice manager with PySide6 UI, SQLite (SQLAlchemy), and PyInstaller packaging.

## Features
- Dark themed UI with sidebar nav (Dashboard, Invoices, Clients)
- Create invoices with line items (quick text entry)
- Track totals and payment status
- Add clients quickly
- SQLite local storage

## Quick Start
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```

## Build Windows exe (from Windows)
```bash
pip install pyinstaller
pyinstaller --name "Invoice Management System" --noconfirm --clean \
  --add-data "app/theme/style.qss;app/theme" \
  --add-data "app/assets;app/assets" \
  --hidden-import "babel.numbers" \
  app.py
# executable will be in dist/Invoice Management System/
```

## Data location
- Windows: `%APPDATA%/InvoiceManagementPy/invoice.sqlite`
- Other: `~/.invoice_management_py/invoice.sqlite`

## Notes
- Fonts: Uses system fonts; drop a TTF into `app/assets` and load via QFontDatabase if desired.
- Styling: Edit `app/theme/style.qss` and `app/theme/palette.py`.
- Migrations: For now uses auto-create tables; add Alembic if you need migrations.
