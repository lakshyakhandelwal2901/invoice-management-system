from __future__ import annotations
from sqlalchemy.orm import Session
from app.data import models

class ClientService:
    def __init__(self, db: Session):
        self.db = db

    def list_clients(self):
        return self.db.query(models.Client).order_by(models.Client.created_at.desc()).all()

    def create_client(self, name: str, email: str = None, phone: str = None, billing_address: str = None, tax_id: str = None):
        client = models.Client(name=name, email=email, phone=phone, billing_address=billing_address, tax_id=tax_id)
        self.db.add(client)
        self.db.commit()
        self.db.refresh(client)
        return client
