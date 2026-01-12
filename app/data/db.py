from __future__ import annotations
import os
import pathlib
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()

def get_db_path() -> str:
    # On Windows, store in AppData; otherwise use local file
    if os.name == "nt":
        base_dir = os.path.join(os.environ.get("APPDATA", pathlib.Path.home()), "InvoiceManagementPy")
    else:
        base_dir = os.path.join(pathlib.Path.home(), ".invoice_management_py")
    os.makedirs(base_dir, exist_ok=True)
    return os.path.join(base_dir, "invoice.sqlite")

def get_engine():
    db_url = f"sqlite:///{get_db_path()}"
    return create_engine(db_url, future=True)

SessionLocal = sessionmaker(bind=get_engine(), autoflush=False, autocommit=False, future=True)
