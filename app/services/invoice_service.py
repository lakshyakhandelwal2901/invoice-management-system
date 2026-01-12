from __future__ import annotations
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.data import models

class InvoiceService:
    def __init__(self, db: Session):
        self.db = db

    def _next_number(self) -> str:
        latest = self.db.query(models.Invoice).order_by(models.Invoice.id.desc()).first()
        seq = latest.id + 1 if latest else 1
        return f"INV-{date.today().strftime('%Y%m')}-{seq:04d}"

    def list_invoices(self):
        return (
            self.db.query(models.Invoice)
            .order_by(models.Invoice.created_at.desc())
            .all()
        )

    def get_invoice(self, invoice_id: int):
        return self.db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()

    def create_invoice(self, client_id: int, issue_date: date, due_date: date, currency: str, items: list[dict], notes: str = None, terms: str = None):
        number = self._next_number()
        subtotal = sum(float(i['quantity']) * float(i['rate']) for i in items)
        tax_total = sum(float(i.get('tax_rate') or 0) / 100 * float(i['quantity']) * float(i['rate']) for i in items)
        discount_total = sum(float(i.get('discount') or 0) for i in items)
        total = subtotal + tax_total - discount_total

        invoice = models.Invoice(
            number=number,
            client_id=client_id,
            status=models.InvoiceStatus.DRAFT,
            issue_date=issue_date,
            due_date=due_date,
            currency=currency,
            notes=notes,
            terms=terms,
            subtotal=subtotal,
            tax_total=tax_total,
            discount_total=discount_total,
            total=total,
            paid_total=0,
            balance=total,
        )
        self.db.add(invoice)
        self.db.flush()

        for item in items:
            line_total = float(item['quantity']) * float(item['rate'])
            if item.get('tax_rate'):
                line_total += line_total * float(item['tax_rate']) / 100
            if item.get('discount'):
                line_total -= float(item['discount'])
            inv_item = models.InvoiceItem(
                invoice_id=invoice.id,
                description=item['description'],
                quantity=item['quantity'],
                rate=item['rate'],
                tax_rate=item.get('tax_rate'),
                discount=item.get('discount'),
                line_total=line_total,
            )
            self.db.add(inv_item)

        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def add_payment(self, invoice_id: int, amount: float, pay_date: date, mode: str = None, reference: str = None, note: str = None):
        invoice = self.get_invoice(invoice_id)
        if not invoice:
            return None
        payment = models.Payment(
            invoice_id=invoice_id,
            amount=amount,
            date=pay_date,
            mode=mode,
            reference=reference,
            note=note,
        )
        self.db.add(payment)
        invoice.paid_total = (invoice.paid_total or 0) + amount
        invoice.balance = (invoice.total or 0) - invoice.paid_total
        if invoice.balance <= 0:
            invoice.status = models.InvoiceStatus.PAID
        elif invoice.paid_total > 0:
            invoice.status = models.InvoiceStatus.PARTIALLY_PAID
        self.db.commit()
        self.db.refresh(invoice)
        return invoice

    def dashboard_snapshot(self):
        total_invoices = self.db.query(func.count(models.Invoice.id)).scalar() or 0
        total_invoiced = self.db.query(func.coalesce(func.sum(models.Invoice.total), 0)).scalar() or 0
        total_paid = self.db.query(func.coalesce(func.sum(models.Invoice.paid_total), 0)).scalar() or 0
        total_unpaid = total_invoiced - total_paid
        overdue_count = (
            self.db.query(func.count(models.Invoice.id))
            .filter(models.Invoice.status == models.InvoiceStatus.OVERDUE)
            .scalar()
            or 0
        )
        return {
            "total_invoices": total_invoices,
            "total_invoiced": float(total_invoiced),
            "total_paid": float(total_paid),
            "total_unpaid": float(total_unpaid),
            "overdue_count": overdue_count,
        }
