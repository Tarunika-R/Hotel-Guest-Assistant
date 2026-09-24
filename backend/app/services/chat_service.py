import logging
import uuid

from app.prompts import TOOLS, build_system_prompt
from app.schemas import AvailabilityResult, ChatRequest, ChatResponse
from app.services.availability import check_availability
from app.services.knowledge import get_hotel
from app.services.llm_client import LLMClient, LLMError, LLMTimeout, ToolCall
from app.services.session_store import SessionStore

logger = logging.getLogger("hotel.chat")

FIELD_ORDER = ("check_in", "check_out", "adults")


def _contact() -> str:
    h = get_hotel()["hotel"]
    return f"{h['phone']} or {h['email']}"


def _fallback_message() -> str:
    return ("I'm sorry, I don't have reliable information on that. "
            f"Our team will be happy to help at {_contact()}.")


def _plural(n: int, word: str) -> str:
    return f"{n} {word}" + ("" if n == 1 else "s")


def _availability_message(res: AvailabilityResult) -> str:
    dates = f"{res.check_in:%d %b} to {res.check_out:%d %b %Y}"
    guests = _plural(res.adults, "guest")
    if not res.options:
        return (f"Sorry, we have no rooms available for {guests} from {dates}. "
                f"Try different dates or fewer guests, or contact us at {_contact()} for group options.")
    cheapest = res.options[0]
    return (f"Good news! We have {_plural(len(res.options), 'room type')} available for {guests}, "
            f"{dates} ({_plural(res.nights, 'night')}). Prices start at ${cheapest.price_per_night:g}/night.")


def _history_text(resp: ChatResponse) -> str:
    """What we remember about this turn (includes ISO dates so follow-ups can reuse them)."""
    a = resp.availability
    if not a:
        return resp.message
    rooms = ", ".join(o.name for o in a.options) or "none"
    return (f"{resp.message} [Availability searched: {a.check_in.isoformat()} to "
            f"{a.check_out.isoformat()}, {a.adults} guests. Room types: {rooms}]")


def _run_tool(call: ToolCall, build) -> ChatResponse:
    args = call.input or {}

    if call.name == "check_availability":
        try:
            result = check_availability(args.get("check_in"), args.get("check_out"), args.get("adults"))
        except ValueError as e:  # pydantic ValidationError is a ValueError
            logger.warning("Model produced invalid availability args %s: %s", args, e)
            return build(
                "needs_input",
                "Those dates don't look valid. Check-in must be today or later, check-out must be "
                "after check-in, and stays are limited to 30 nights. Could you pick your dates again?",
                missing_fields=["check_in", "check_out"],
            )
        return build("availability", _availability_message(result), availability=result)

    if call.name == "ask_for_availability_details":
        raw = args.get("missing_fields")
        raw = raw if isinstance(raw, list) else []
        missing = [f for f in FIELD_ORDER if f in raw] or list(FIELD_ORDER)
        message = args.get("message") or "Could you share your check-in date, check-out date and number of guests?"
        return build("needs_input", message, missing_fields=missing)

    if call.name == "cannot_answer":
        logger.info("Model declined to answer: %s", args.get("reason"))
        return build("fallback", _fallback_message())

    logger.warning("Unknown tool requested by model: %s", call.name)
    return build("fallback", _fallback_message())


async def handle_chat(req: ChatRequest, *, llm: LLMClient, sessions: SessionStore, request_id: str) -> ChatResponse:
    session_id = req.session_id or uuid.uuid4().hex

    def build(type_, message, availability=None, missing_fields=None) -> ChatResponse:
        return ChatResponse(
            request_id=request_id, session_id=session_id, type=type_, message=message,
            availability=availability, missing_fields=missing_fields or [],
        )

    # 1. Structured form submission: fully deterministic, no LLM needed.
    if req.availability:
        a = req.availability
        result = check_availability(a.check_in, a.check_out, a.adults)
        response = build("availability", _availability_message(result), availability=result)
        sessions.append(session_id, req.message, _history_text(response))
        logger.info("rid=%s session=%s form availability options=%d", request_id, session_id, len(result.options))
        return response

    # 2. Free-text question: LLM with grounding + tools.
    messages = sessions.get_history(session_id) + [{"role": "user", "content": req.message}]
    try:
        llm_resp = await llm.generate(system=build_system_prompt(), messages=messages, tools=TOOLS)
    except LLMTimeout:
        logger.warning("rid=%s LLM timeout", request_id)
        return build("error", "The assistant is taking longer than usual. Please try again in a moment.")
    except LLMError:
        logger.error("rid=%s LLM unavailable", request_id)
        return build("error", "The assistant is temporarily unavailable. Please try again shortly, "
                              f"or contact the front desk at {_contact()}.")

    if llm_resp.tool_calls:
        call = llm_resp.tool_calls[0]
        logger.info("rid=%s session=%s tool=%s", request_id, session_id, call.name)
        response = _run_tool(call, build)
    elif llm_resp.text:
        logger.info("rid=%s session=%s grounded answer", request_id, session_id)
        response = build("answer", llm_resp.text)
    else:
        logger.warning("rid=%s empty model output", request_id)
        response = build("fallback", _fallback_message())

    sessions.append(session_id, req.message, _history_text(response))
    return response