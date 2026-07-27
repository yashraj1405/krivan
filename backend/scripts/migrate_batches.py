"""
Migration script to update the batches table with new columns.
Run this once to add the new fields to the existing table.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text, inspect


def migrate():
    inspector = inspect(engine)

    if "batches" not in inspector.get_table_names():
        print("Table 'batches' does not exist. It will be auto-created on app startup.")
        return

    existing_columns = {col["name"] for col in inspector.get_columns("batches")}
    print(f"Existing columns: {existing_columns}")

    with engine.begin() as conn:
        # Create the enum type if it doesn't exist
        conn.execute(text("""
            DO $$ BEGIN
                CREATE TYPE batchstatus AS ENUM ('Draft', 'Production', 'QR Generated', 'Printed', 'Packed', 'Dispatched', 'Completed');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        """))
        print("✓ BatchStatus enum type ensured")

        # Add new columns if they don't exist
        new_columns = {
            "net_content": "VARCHAR(100)",
            "mrp": "NUMERIC(10, 2)",
            "status": "batchstatus DEFAULT 'Draft' NOT NULL",
            "qr_token": "VARCHAR(255) UNIQUE",
            "qr_image_path": "VARCHAR(1024)",
            "remarks": "TEXT",
            "updated_at": "TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL",
        }

        for col_name, col_type in new_columns.items():
            if col_name not in existing_columns:
                conn.execute(text(f"ALTER TABLE batches ADD COLUMN {col_name} {col_type}"))
                print(f"✓ Added column: {col_name}")
            else:
                print(f"  Column already exists: {col_name}")

        # Add index on qr_token if not exists
        existing_indexes = {idx["name"] for idx in inspector.get_indexes("batches")}
        if "ix_batches_qr_token" not in existing_indexes:
            conn.execute(text("CREATE INDEX ix_batches_qr_token ON batches (qr_token)"))
            print("✓ Added index: ix_batches_qr_token")

        # Drop the qr_codes foreign key constraint on batch_id if the qr_codes table exists
        # (We're not removing the qr_codes table — just noting the batch model no longer references it)

    print("\n✅ Migration completed successfully!")


if __name__ == "__main__":
    migrate()
