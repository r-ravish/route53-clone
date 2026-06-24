"""CRUD router for Hosted Zones."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import HostedZone, Record, User, ZoneType
from schemas import (
    HostedZoneCreate,
    HostedZoneResponse,
    HostedZoneUpdate,
    PaginatedResponse,
)

router = APIRouter(prefix="/zones", tags=["Hosted Zones"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_zone_or_404(
    zone_id: int, user: User, db: Session
) -> HostedZone:
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


def _zone_to_response(zone: HostedZone, db: Session) -> HostedZoneResponse:
    """Convert an ORM zone to a response model, including record_count."""
    record_count = (
        db.query(Record).filter(Record.hosted_zone_id == zone.id).count()
    )
    return HostedZoneResponse(
        id=zone.id,
        user_id=zone.user_id,
        domain_name=zone.domain_name,
        zone_type=zone.zone_type.value if isinstance(zone.zone_type, ZoneType) else zone.zone_type,
        comment=zone.comment,
        record_count=record_count,
        created_at=zone.created_at,
        updated_at=zone.updated_at,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("", response_model=PaginatedResponse[HostedZoneResponse])
def list_zones(
    search: str = Query(default="", description="Search by domain name"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List hosted zones for the current user with optional search and pagination."""
    query = db.query(HostedZone).filter(HostedZone.user_id == current_user.id)

    if search:
        query = query.filter(HostedZone.domain_name.ilike(f"%{search}%"))

    total = query.count()
    zones = (
        query.order_by(HostedZone.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    items = [_zone_to_response(z, db) for z in zones]
    return PaginatedResponse.build(items=items, total=total, page=page, limit=limit)


@router.post("", response_model=HostedZoneResponse, status_code=status.HTTP_201_CREATED)
def create_zone(
    body: HostedZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new hosted zone."""
    zone = HostedZone(
        user_id=current_user.id,
        domain_name=body.domain_name,
        zone_type=ZoneType(body.zone_type),
        comment=body.comment,
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return _zone_to_response(zone, db)


@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single hosted zone by ID."""
    zone = _get_zone_or_404(zone_id, current_user, db)
    return _zone_to_response(zone, db)


@router.put("/{zone_id}", response_model=HostedZoneResponse)
def update_zone(
    zone_id: int,
    body: HostedZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a hosted zone."""
    zone = _get_zone_or_404(zone_id, current_user, db)

    update_data = body.model_dump(exclude_unset=True)
    if "zone_type" in update_data and update_data["zone_type"] is not None:
        update_data["zone_type"] = ZoneType(update_data["zone_type"])

    for field, value in update_data.items():
        setattr(zone, field, value)

    db.commit()
    db.refresh(zone)
    return _zone_to_response(zone, db)


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_zone(
    zone_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a hosted zone and cascade-delete all its records."""
    zone = _get_zone_or_404(zone_id, current_user, db)
    db.delete(zone)
    db.commit()
    return None
