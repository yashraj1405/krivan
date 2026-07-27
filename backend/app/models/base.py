# Import Base and all models to ensure they register correctly on Base.metadata
from app.core.database import Base
from app.models.user import User
from app.models.product import Product
from app.models.batch import Batch
from app.models.qr_code import QRCode
from app.models.dealer import Dealer
from app.models.dispatch import Dispatch
from app.models.qr_scan_log import QRScanLog
from app.models.scan_log import ScanLog
