"""
Migration script to add qr_generated_at to batches table and create scan_logs table.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text, inspect


def migrate():
    inspector = inspect(engine)

    if "batches" in inspector.get_table_names():
        existing_columns = {col["name"] for col in inspector.get_columns("batches")}
        with engine.begin() as conn:
            if "qr_generated_at" not in existing_columns:
                conn.execute(text("ALTER TABLE batches ADD COLUMN qr_generated_at TIMESTAMP WITH TIME ZONE"))
                print("✓ Added column qr_generated_at to batches table")

    if "scan_logs" not in inspector.get_table_names():
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE scan_logs (
                    id UUID PRIMARY KEY,
                    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
                    scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    ip_address VARCHAR(45),
                    user_agent VARCHAR(512)
                );
                CREATE INDEX ix_scan_logs_batch_id ON scan_logs (batch_id);
            """))
            print("✓ Created table scan_logs")
    else:
        print("✓ Table scan_logs already exists")

    print("\n✅ Migration completed successfully!")


if __name__ == "__main__":
    migrate()
