"""CRUD router for DNS Records nested under Hosted Zones."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import HostedZone, Record, RecordType, User
from schemas import (
    PaginatedResponse,
    RecordCreate,
    RecordResponse,
    RecordUpdate,
)

router = APIRouter(prefix="/zones/{zone_id}/records", tags=["DNS Records"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_zone_or_404(zone_id: int, user: User, db: Session) -> HostedZone:
    """Fetch a zone by ID, ensuring it belongs to the current user."""
    zone = (
        db.query(HostedZone)
        .filter(HostedZone.id == zone_id, HostedZone.user_id == user.id)
        .first()
    )
    if zone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone {zone_id} not found.",
        )
    return zone


def _get_record_or_404(
    record_id: int, zone_id: int, db: Session
) -> Record:
    """Fetch a record by ID within the given zone."""
    record = (
        db.query(Record)
        .filter(Record.id == record_id, Record.hosted_zone_id == zone_id)
        .first()
    )
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Record {record_id} not found in zone {zone_id}.",
        )
    return record


def _record_to_response(record: Record) -> RecordResponse:
    """Convert an ORM record to a response model."""
    return RecordResponse(
        id=record.id,
        hosted_zone_id=record.hosted_zone_id,
        name=record.name,
        record_type=record.record_type.value if isinstance(record.record_type, RecordType) else record.record_type,
        value=record.value,
        ttl=record.ttl,
        priority=record.priority,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=PaginatedResponse[RecordResponse])
def list_records(
    zone_id: int,
    search: str = Query(default="", description="Search by record name"),
    type: str | None = Query(default=None, alias="type", description="Filter by record type"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List records for a hosted zone with optional search, type filter, and pagination."""
    # Verify zone ownership
    _get_zone_or_404(zone_id, current_user, db)

    query = db.query(Record).filter(Record.hosted_zone_id == zone_id)

    if search:
        query = query.filter(Record.name.ilike(f"%{search}%"))

    if type:
        # Validate the filter value
        type_upper = type.upper()
        try:
            record_type_enum = RecordType(type_upper)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"'{type}' is not a valid record type.",
            )
        query = query.filter(Record.record_type == record_type_enum)

    total = query.count()
    records = (
        query.order_by(Record.name.asc(), Record.record_type.asc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = [_record_to_response(r) for r in records]
    return PaginatedResponse.build(items=items, total=total, page=page, limit=limit)


@router.post("", response_model=RecordResponse, status_code=status.HTTP_201_CREATED)
def create_record(
    zone_id: int,
    body: RecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new DNS record in a hosted zone."""
    _get_zone_or_404(zone_id, current_user, db)

    record = Record(
        hosted_zone_id=zone_id,
        name=body.name,
        record_type=RecordType(body.record_type),
        value=body.value,
        ttl=body.ttl,
        priority=body.priority,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return _record_to_response(record)


@router.put("/{record_id}", response_model=RecordResponse)
def update_record(
    zone_id: int,
    record_id: int,
    body: RecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a DNS record."""
    _get_zone_or_404(zone_id, current_user, db)
    record = _get_record_or_404(record_id, zone_id, db)

    update_data = body.model_dump(exclude_unset=True)
    if "record_type" in update_data and update_data["record_type"] is not None:
        update_data["record_type"] = RecordType(update_data["record_type"])

    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return _record_to_response(record)


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_record(
    zone_id: int,
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a DNS record."""
    _get_zone_or_404(zone_id, current_user, db)
    record = _get_record_or_404(record_id, zone_id, db)
    db.delete(record)
    db.commit()
    return None
