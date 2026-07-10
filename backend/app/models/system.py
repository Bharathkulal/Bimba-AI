from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from app.database.session import Base

class Backup(Base):
    __tablename__ = "backups"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    backup_type = Column(String, default="Manual")  # "Manual" | "Daily" | "Weekly"
    size_bytes = Column(Integer, default=0)
    status = Column(String, default="Success")  # "Success" | "Failed"
    created_at = Column(DateTime(timezone=True), default=func.now())

class DatasetImport(Base):
    __tablename__ = "dataset_imports"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    import_type = Column(String, default="merge")  # "merge" | "replace"
    total_records = Column(Integer, default=0)
    imported_count = Column(Integer, default=0)
    updated_count = Column(Integer, default=0)
    skipped_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    rollback_status = Column(String, default="Active")  # "Active" | "Rolled Back"
    imported_rolls = Column(Text, nullable=True)  # JSON or comma-separated list of roll numbers
    created_at = Column(DateTime(timezone=True), default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_username = Column(String, nullable=False)
    operation = Column(String, nullable=False)  # "Student Added", etc.
    ip_address = Column(String, nullable=True)
    browser = Column(String, nullable=True)
    device = Column(String, nullable=True)
    status = Column(String, default="Success")  # "Success" | "Failed"
    affected_record = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=func.now())

class SystemHealth(Base):
    __tablename__ = "system_health"

    id = Column(Integer, primary_key=True, index=True)
    cpu_usage = Column(Float, default=0.0)
    ram_usage = Column(Float, default=0.0)
    disk_usage = Column(Float, default=0.0)
    db_health = Column(String, default="Healthy")
    api_health = Column(String, default="Healthy")
    latency_ms = Column(Integer, default=0)
    db_queries_count = Column(Integer, default=0)
    request_rate = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=func.now())
