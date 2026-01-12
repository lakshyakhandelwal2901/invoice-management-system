from __future__ import annotations
from datetime import date
from PySide6 import QtWidgets, QtCore
from app.data.db import SessionLocal, Base, get_engine
from app.data import models
from app.services.client_service import ClientService
from app.services.invoice_service import InvoiceService

from .widgets import DashboardView, InvoiceListView, ClientListView


class MainWindow(QtWidgets.QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Invoice Management System (Python)")
        self.resize(1200, 800)

        Base.metadata.create_all(bind=get_engine())
        self.session = SessionLocal()
        self.client_service = ClientService(self.session)
        self.invoice_service = InvoiceService(self.session)

        self._build_ui()
        self.load_data()

    def _build_ui(self):
        central = QtWidgets.QWidget()
        layout = QtWidgets.QHBoxLayout(central)
        layout.setContentsMargins(0, 0, 0, 0)

        # Sidebar
        self.sidebar = QtWidgets.QFrame()
        self.sidebar.setObjectName("Sidebar")
        self.sidebar.setFixedWidth(200)
        side_layout = QtWidgets.QVBoxLayout(self.sidebar)
        side_layout.setContentsMargins(12, 12, 12, 12)
        side_layout.setSpacing(8)

        self.btn_dashboard = QtWidgets.QPushButton("Dashboard")
        self.btn_invoices = QtWidgets.QPushButton("Invoices")
        self.btn_clients = QtWidgets.QPushButton("Clients")
        self.btn_new_invoice = QtWidgets.QPushButton("+ New Invoice")
        self.btn_new_invoice.setStyleSheet("background-color: #1f6fd6; color: white;")

        for b in [self.btn_dashboard, self.btn_invoices, self.btn_clients, self.btn_new_invoice]:
            b.setMinimumHeight(36)
            side_layout.addWidget(b)
        side_layout.addStretch(1)

        # Stack
        self.stack = QtWidgets.QStackedWidget()
        self.dashboard_view = DashboardView()
        self.invoice_view = InvoiceListView()
        self.client_view = ClientListView()
        self.stack.addWidget(self.dashboard_view)
        self.stack.addWidget(self.invoice_view)
        self.stack.addWidget(self.client_view)

        layout.addWidget(self.sidebar)
        layout.addWidget(self.stack, 1)
        self.setCentralWidget(central)

        self.btn_dashboard.clicked.connect(lambda: self.stack.setCurrentWidget(self.dashboard_view))
        self.btn_invoices.clicked.connect(lambda: self.stack.setCurrentWidget(self.invoice_view))
        self.btn_clients.clicked.connect(lambda: self.stack.setCurrentWidget(self.client_view))
        self.btn_new_invoice.clicked.connect(self.create_invoice_dialog)

    def load_data(self):
        clients = self.client_service.list_clients()
        invoices = self.invoice_service.list_invoices()
        metrics = self.invoice_service.dashboard_snapshot()
        self.client_view.update_clients(clients)
        self.invoice_view.update_invoices(invoices)
        self.dashboard_view.update_metrics(metrics)

    def create_invoice_dialog(self):
        dlg = QtWidgets.QDialog(self)
        dlg.setWindowTitle("Create Invoice")
        form = QtWidgets.QFormLayout(dlg)

        client_combo = QtWidgets.QComboBox()
        clients = self.client_service.list_clients()
        for c in clients:
            client_combo.addItem(c.name, c.id)

        issue_date = QtWidgets.QDateEdit(QtCore.QDate.currentDate())
        due_date = QtWidgets.QDateEdit(QtCore.QDate.currentDate().addDays(14))
        currency = QtWidgets.QLineEdit("USD")
        notes = QtWidgets.QLineEdit()
        items_edit = QtWidgets.QTextEdit()
        items_edit.setPlaceholderText("One line per item: Description|Qty|Rate|Tax%|Discount")

        form.addRow("Client", client_combo)
        form.addRow("Issue date", issue_date)
        form.addRow("Due date", due_date)
        form.addRow("Currency", currency)
        form.addRow("Notes", notes)
        form.addRow("Items", items_edit)

        btns = QtWidgets.QDialogButtonBox(QtWidgets.QDialogButtonBox.Ok | QtWidgets.QDialogButtonBox.Cancel)
        form.addRow(btns)
        btns.accepted.connect(dlg.accept)
        btns.rejected.connect(dlg.reject)

        if dlg.exec() == QtWidgets.QDialog.Accepted:
            raw_items = items_edit.toPlainText().strip().splitlines()
            items = []
            for line in raw_items:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 3:
                    items.append({
                        'description': parts[0],
                        'quantity': float(parts[1]),
                        'rate': float(parts[2]),
                        'tax_rate': float(parts[3]) if len(parts) > 3 and parts[3] else 0,
                        'discount': float(parts[4]) if len(parts) > 4 and parts[4] else 0,
                    })
            self.invoice_service.create_invoice(
                client_id=client_combo.currentData(),
                issue_date=issue_date.date().toPython(),
                due_date=due_date.date().toPython(),
                currency=currency.text() or "USD",
                items=items,
                notes=notes.text() or None,
            )
            self.load_data()


    def closeEvent(self, event):
        try:
            self.session.close()
        except Exception:
            pass
        super().closeEvent(event)
