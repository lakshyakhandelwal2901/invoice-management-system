from __future__ import annotations
from PySide6 import QtWidgets, QtCore
from app.data import models

class DashboardView(QtWidgets.QWidget):
    def __init__(self):
        super().__init__()
        layout = QtWidgets.QGridLayout(self)
        layout.setSpacing(12)
        self.cards = {}
        for i, key in enumerate(["Total Invoices", "Invoiced", "Paid", "Unpaid", "Overdue"]):
            card = QtWidgets.QFrame(objectName="Card")
            v = QtWidgets.QVBoxLayout(card)
            title = QtWidgets.QLabel(key)
            title.setStyleSheet("color: #9ca3af; font-size: 12px;")
            value = QtWidgets.QLabel("0")
            value.setStyleSheet("font-size: 22px; font-weight: 600;")
            v.addWidget(title)
            v.addWidget(value)
            self.cards[key] = value
            layout.addWidget(card, i // 3, i % 3)

    def update_metrics(self, metrics: dict):
        self.cards["Total Invoices"].setText(str(metrics.get("total_invoices", 0)))
        self.cards["Invoiced"].setText(f"${metrics.get('total_invoiced', 0):,.2f}")
        self.cards["Paid"].setText(f"${metrics.get('total_paid', 0):,.2f}")
        self.cards["Unpaid"].setText(f"${metrics.get('total_unpaid', 0):,.2f}")
        self.cards["Overdue"].setText(str(metrics.get("overdue_count", 0)))

class InvoiceListView(QtWidgets.QWidget):
    def __init__(self):
        super().__init__()
        layout = QtWidgets.QVBoxLayout(self)
        self.table = QtWidgets.QTableWidget(0, 6)
        self.table.setHorizontalHeaderLabels(["Number", "Client", "Issue", "Due", "Total", "Status"])
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.setSelectionBehavior(QtWidgets.QAbstractItemView.SelectRows)
        layout.addWidget(self.table)

    def update_invoices(self, invoices: list[models.Invoice]):
        self.table.setRowCount(len(invoices))
        for row, inv in enumerate(invoices):
            self.table.setItem(row, 0, QtWidgets.QTableWidgetItem(inv.number))
            self.table.setItem(row, 1, QtWidgets.QTableWidgetItem(inv.client.name if inv.client else ""))
            self.table.setItem(row, 2, QtWidgets.QTableWidgetItem(inv.issue_date.strftime('%Y-%m-%d')))
            self.table.setItem(row, 3, QtWidgets.QTableWidgetItem(inv.due_date.strftime('%Y-%m-%d')))
            self.table.setItem(row, 4, QtWidgets.QTableWidgetItem(f"${float(inv.total):,.2f}"))
            status = QtWidgets.QLabel(inv.status.value if hasattr(inv.status, 'value') else str(inv.status))
            status.setObjectName("StatusPill")
            status.setProperty("status", inv.status.value if hasattr(inv.status, 'value') else str(inv.status))
            self.table.setCellWidget(row, 5, status)

class ClientListView(QtWidgets.QWidget):
    def __init__(self):
        super().__init__()
        layout = QtWidgets.QVBoxLayout(self)
        self.list = QtWidgets.QListWidget()
        layout.addWidget(self.list)

        # quick add form
        form = QtWidgets.QHBoxLayout()
        self.name_input = QtWidgets.QLineEdit()
        self.name_input.setPlaceholderText("Client name")
        self.email_input = QtWidgets.QLineEdit()
        self.email_input.setPlaceholderText("Email")
        add_btn = QtWidgets.QPushButton("Add")
        form.addWidget(self.name_input)
        form.addWidget(self.email_input)
        form.addWidget(add_btn)
        layout.addLayout(form)
        add_btn.clicked.connect(self._handle_add)
        self._on_add = None

    def on_add(self, callback):
        self._on_add = callback

    def _handle_add(self):
        if self._on_add:
            self._on_add(self.name_input.text(), self.email_input.text())
            self.name_input.clear()
            self.email_input.clear()

    def update_clients(self, clients: list[models.Client]):
        self.list.clear()
        for c in clients:
            self.list.addItem(f"{c.name} ({c.email or 'N/A'})")
