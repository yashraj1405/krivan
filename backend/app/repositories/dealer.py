from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.models.dealer import Dealer
from app.repositories.base import BaseRepository


class DealerRepository(BaseRepository[Dealer]):
    def __init__(self, db: Session) -> None:
        super().__init__(Dealer, db)

    def get_by_gst(self, gst_number: str) -> Optional[Dealer]:
        return self.db.query(Dealer).filter(Dealer.gst_number == gst_number).first()

    def get_by_dealer_code(self, dealer_code: str) -> Optional[Dealer]:
        return self.db.query(Dealer).filter(Dealer.dealer_code == dealer_code).first()

    def get_filtered(
        self,
        *,
        search: Optional[str] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        status: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Dealer], int]:
        query = self.db.query(Dealer)

        # Searching
        if search:
            search_filter = or_(
                Dealer.dealer_name.ilike(f"%{search}%"),
                Dealer.dealer_code.ilike(f"%{search}%"),
                Dealer.owner_name.ilike(f"%{search}%"),
                Dealer.contact_person.ilike(f"%{search}%"),
                Dealer.email.ilike(f"%{search}%"),
                Dealer.phone.ilike(f"%{search}%"),
                Dealer.gst_number.ilike(f"%{search}%"),
            )
            query = query.filter(search_filter)

        # Filtering
        if city:
            query = query.filter(Dealer.city.ilike(f"%{city}%"))
        if state:
            query = query.filter(Dealer.state.ilike(f"%{state}%"))
        if status:
            query = query.filter(Dealer.status == status)

        # Sorting
        sort_col = getattr(Dealer, sort_by, Dealer.created_at)
        if sort_order == "desc":
            query = query.order_by(desc(sort_col))
        else:
            query = query.order_by(asc(sort_col))

        # Total Count
        total_count = query.count()

        # Pagination
        items = query.offset(skip).limit(limit).all()
        return items, total_count
