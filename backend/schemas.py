"""Pydantic schemas for request validation and response serialization."""

import math
import re
from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# Domain name validation
# ---------------------------------------------------------------------------

_DOMAIN_REGEX = re.compile(
    r"^(?!-)"                        # cannot start with hyphen
    r"(?:[A-Za-z0-9-]{1,63}\.)"      # at least one label + dot (required)
    r"(?:[A-Za-z0-9-]{1,63}\.)*"     # additional subdomains (optional)
    r"[A-Za-z]{2,63}$"               # TLD
)


def _validate_domain(value: str) -> str:
    """Check that a value looks like a valid domain name."""
    # Strip trailing dot (FQDN notation is fine)
    clean = value.rstrip(".")
    if not _DOMAIN_REGEX.match(clean):
        raise ValueError(
            f"'{value}' is not a valid domain name. "
            "Expected format: example.com or sub.example.com"
        )
    return value


# ---------------------------------------------------------------------------
# Hosted Zone schemas
# ---------------------------------------------------------------------------

class HostedZoneCreate(BaseModel):
    domain_name: str = Field(..., min_length=1, max_length=255)
    zone_type: str = Field(default="Public")
    comment: str | None = Field(default=None, max_length=500)

    @field_validator("domain_name")
    @classmethod
    def validate_domain_name(cls, v: str) -> str:
        return _validate_domain(v)

    @field_validator("zone_type")
    @classmethod
    def validate_zone_type(cls, v: str) -> str:
        if v not in ("Public", "Private"):
            raise ValueError("zone_type must be 'Public' or 'Private'.")
        return v


class HostedZoneUpdate(BaseModel):
    domain_name: str | None = Field(default=None, min_length=1, max_length=255)
    zone_type: str | None = Field(default=None)
    comment: str | None = Field(default=None, max_length=500)

    @field_validator("domain_name")
    @classmethod
    def validate_domain_name(cls, v: str | None) -> str | None:
        if v is not None:
            return _validate_domain(v)
        return v

    @field_validator("zone_type")
    @classmethod
    def validate_zone_type(cls, v: str | None) -> str | None:
        if v is not None and v not in ("Public", "Private"):
            raise ValueError("zone_type must be 'Public' or 'Private'.")
        return v


class HostedZoneResponse(BaseModel):
    id: int
    user_id: int
    domain_name: str
    zone_type: str
    comment: str | None
    record_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Generic paginated response
# ---------------------------------------------------------------------------

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    limit: int
    pages: int

    @classmethod
    def build(cls, *, items: list, total: int, page: int, limit: int):
        """Convenience constructor that calculates page count."""
        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=max(1, math.ceil(total / limit)),
        )


# ---------------------------------------------------------------------------
# IP / value validation helpers
# ---------------------------------------------------------------------------

import ipaddress  # noqa: E402


def _validate_ipv4(value: str) -> str:
    try:
        ipaddress.IPv4Address(value)
    except ipaddress.AddressValueError:
        raise ValueError(f"'{value}' is not a valid IPv4 address.")
    return value


def _validate_ipv6(value: str) -> str:
    try:
        ipaddress.IPv6Address(value)
    except ipaddress.AddressValueError:
        raise ValueError(f"'{value}' is not a valid IPv6 address.")
    return value


_VALID_RECORD_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"}


# ---------------------------------------------------------------------------
# Record schemas
# ---------------------------------------------------------------------------

class RecordCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    record_type: str = Field(..., description="DNS record type (A, AAAA, CNAME, etc.)")
    value: str = Field(..., min_length=1, max_length=4096)
    ttl: int = Field(default=300, ge=1, le=2147483647)
    priority: int | None = Field(default=None, ge=0, le=65535)

    @field_validator("record_type")
    @classmethod
    def validate_record_type(cls, v: str) -> str:
        upper = v.upper()
        if upper not in _VALID_RECORD_TYPES:
            raise ValueError(
                f"'{v}' is not a supported record type. "
                f"Supported: {', '.join(sorted(_VALID_RECORD_TYPES))}"
            )
        return upper

    @field_validator("value")
    @classmethod
    def validate_value_format(cls, v: str, info) -> str:
        """Validate the value field based on the record type."""
        # info.data contains already-validated fields; record_type may not
        # be present if its own validation failed.
        record_type = info.data.get("record_type")
        if record_type is None:
            return v

        rt = record_type.upper()
        if rt == "A":
            _validate_ipv4(v)
        elif rt == "AAAA":
            _validate_ipv6(v)
        elif rt == "CNAME":
            _validate_domain(v)
        # TXT, NS, PTR, MX, SRV, CAA — accept any non-empty string
        return v

    @model_validator(mode="after")
    def validate_priority_required(self):
        rt = self.record_type
        if rt and rt.upper() in ("MX", "SRV") and self.priority is None:
            raise ValueError(
                f"priority is required for {rt} records."
            )
        return self


class RecordUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    record_type: str | None = Field(default=None)
    value: str | None = Field(default=None, min_length=1, max_length=4096)
    ttl: int | None = Field(default=None, ge=1, le=2147483647)
    priority: int | None = Field(default=None, ge=0, le=65535)

    @field_validator("record_type")
    @classmethod
    def validate_record_type(cls, v: str | None) -> str | None:
        if v is None:
            return v
        upper = v.upper()
        if upper not in _VALID_RECORD_TYPES:
            raise ValueError(
                f"'{v}' is not a supported record type. "
                f"Supported: {', '.join(sorted(_VALID_RECORD_TYPES))}"
            )
        return upper

    @field_validator("value")
    @classmethod
    def validate_value_format(cls, v: str | None, info) -> str | None:
        if v is None:
            return v
        record_type = info.data.get("record_type")
        if record_type is None:
            return v

        rt = record_type.upper()
        if rt == "A":
            _validate_ipv4(v)
        elif rt == "AAAA":
            _validate_ipv6(v)
        elif rt == "CNAME":
            _validate_domain(v)
        return v

    @model_validator(mode="after")
    def validate_priority_required(self):
        rt = self.record_type
        if rt and rt.upper() in ("MX", "SRV") and self.priority is None:
            raise ValueError(
                f"priority is required for {rt} records."
            )
        return self


class RecordResponse(BaseModel):
    id: int
    hosted_zone_id: int
    name: str
    record_type: str
    value: str
    ttl: int
    priority: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

