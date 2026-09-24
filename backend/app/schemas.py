from datetime import date
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class AvailabilityQuery(BaseModel):
    check_in: date
    check_out: date
    adults: int = Field(ge=1, le=10)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.check_in < date.today():
            raise ValueError("check_in cannot be in the past")
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        if (self.check_out - self.check_in).days > 30:
            raise ValueError("stays longer than 30 nights are not supported")
        return self


class ChatRequest(BaseModel):
    session_id: Optional[str] = Field(default=None, max_length=64)
    message: str = Field(min_length=1, max_length=1000)
    availability: Optional[AvailabilityQuery] = None  # sent by the frontend form

    @field_validator("message")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("message cannot be blank")
        return v


class RoomOption(BaseModel):
    room_id: str
    name: str
    capacity: int
    rooms_left: int
    price_per_night: float
    total_price: float
    nights: int
    features: list[str]


class AvailabilityResult(BaseModel):
    check_in: date
    check_out: date
    adults: int
    nights: int
    options: list[RoomOption]


class ChatResponse(BaseModel):
    request_id: str
    session_id: str
    type: Literal["answer", "availability", "needs_input", "fallback", "error"]
    message: str
    availability: Optional[AvailabilityResult] = None
    missing_fields: list[str] = []  # e.g. ["check_in", "check_out", "adults"]


class ErrorResponse(BaseModel):
    request_id: str
    error: str
    detail: Optional[str] = None