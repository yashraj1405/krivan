"""
Migration script to update `dealers` and `dispatches` tables with required fields.
"""
from sqlalchemy import text
from app.core.database import engine

def migrate():
    print("Starting Dealer & Dispatch database migration...")
    with engine.begin() as conn:
        # 1. Update dealers table
        conn.execute(text("""
            ALTER TABLE dealers
            ADD COLUMN IF NOT EXISTS dealer_code VARCHAR(50),
            ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';
        """))

        # Make email and pincode nullable
        conn.execute(text("""
            ALTER TABLE dealers ALTER COLUMN email DROP NOT NULL;
            ALTER TABLE dealers ALTER COLUMN pincode DROP NOT NULL;
        """))

        # Populate dealer_code for existing dealers if any
        conn.execute(text("""
            UPDATE dealers
            SET dealer_code = 'DLR-' || SUBSTRING(id::text, 1, 6)
            WHERE dealer_code IS NULL;
        """))

        # Make dealer_code NOT NULL and UNIQUE
        conn.execute(text("""
            ALTER TABLE dealers
            ALTER COLUMN dealer_code SET NOT NULL;
        """))

        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS ix_dealers_dealer_code ON dealers(dealer_code);
        """))

        # 2. Update dispatches table
        conn.execute(text("""
            ALTER TABLE dispatches
            ADD COLUMN IF NOT EXISTS dispatch_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS transport_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS lr_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS remarks VARCHAR(500);
        """))

        # Populate dispatch_number for existing dispatches if any
        conn.execute(text("""
            UPDATE dispatches
            SET dispatch_number = 'DSP-' || SUBSTRING(id::text, 1, 8),
                invoice_number = COALESCE(invoice_number, 'INV-LEGACY'),
                transport_name = COALESCE(transport_name, 'Standard Logistics'),
                vehicle_number = COALESCE(vehicle_number, 'MH-12-XX-0000')
            WHERE dispatch_number IS NULL;
        """))

        conn.execute(text("""
            ALTER TABLE dispatches
            ALTER COLUMN dispatch_number SET NOT NULL,
            ALTER COLUMN invoice_number SET NOT NULL,
            ALTER COLUMN transport_name SET NOT NULL,
            ALTER COLUMN vehicle_number SET NOT NULL;
        """))

        conn.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS ix_dispatches_dispatch_number ON dispatches(dispatch_number);
        """))

        print("Dealer & Dispatch migration executed successfully!")

if __name__ == "__main__":
    migrate()
