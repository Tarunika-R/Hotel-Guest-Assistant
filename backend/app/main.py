import logging
import time
import uuid

from fastapi import Depends, FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.logging_conf import setup_logging
from app.schemas import AvailabilityQuery, AvailabilityResult, ChatRequest, ChatResponse, ErrorResponse
from app.services import chat_service
from app.services.availability import check_availability
from app.services.knowledge import get_hotel, max_capacity
from app.services.llm_client import LLMClient, get_llm_client
from app.services.session_store import SessionStore, get_session_store

from collections import defaultdict, deque

settings = get_settings()
setup_logging(settings.log_level)
logger = logging.getLogger("hotel.api")

app = FastAPI(title="Hotel Guest Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    expose_headers=["X-Request-ID"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = uuid.uuid4().hex[:12]
    request.state.request_id = request_id
    start = time.perf_counter()
    response = await call_next(request)
    ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = request_id
    logger.info("rid=%s %s %s -> %s %.0fms", request_id, request.method, request.url.path,
                response.status_code, ms)
    return response

_hits: dict[str, deque] = defaultdict(deque)

@app.middleware("http")
async def rate_limit(request: Request, call_next):
    limit = settings.rate_limit_per_minute
    if limit and request.method == "POST" and request.url.path == "/api/chat":
        fallback_ip = request.client.host if request.client else "unknown"
        ip = request.headers.get("x-forwarded-for", fallback_ip).split(",")[0].strip()
        now = time.time()
        q = _hits[ip]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= limit:
            return JSONResponse(
                status_code=429,
                content={"request_id": "rate-limited", "error": "rate_limited",
                         "detail": "Too many requests. Please wait a minute and try again."},
            )
        q.append(now)
    return await call_next(request)


def _rid(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    parts = []
    for err in exc.errors():
        field = ".".join(str(p) for p in err["loc"] if p != "body")
        msg = err["msg"].removeprefix("Value error, ")
        parts.append(f"{field}: {msg}" if field else msg)
    detail = "; ".join(parts)
    logger.warning("rid=%s validation error: %s", _rid(request), detail)
    body = ErrorResponse(request_id=_rid(request), error="validation_error", detail=detail)
    return JSONResponse(status_code=422, content=body.model_dump())


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    logger.exception("rid=%s unhandled error", _rid(request))
    body = ErrorResponse(request_id=_rid(request), error="internal_error",
                         detail="Something went wrong on our side. Please try again.")
    return JSONResponse(status_code=500, content=body.model_dump())


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/hotel")
async def hotel_info():
    h = get_hotel()["hotel"]
    return {"name": h["name"], "location": h["location"], "phone": h["phone"],
            "max_guests_per_room": max_capacity()}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    request: Request,
    llm: LLMClient = Depends(get_llm_client),
    sessions: SessionStore = Depends(get_session_store),
):
    return await chat_service.handle_chat(req, llm=llm, sessions=sessions, request_id=request.state.request_id)


@app.post("/api/availability", response_model=AvailabilityResult)
async def availability(query: AvailabilityQuery):
    return check_availability(query.check_in, query.check_out, query.adults)