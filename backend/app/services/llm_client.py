import logging
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Any, Protocol

import httpx
from google import genai
from google.genai import errors, types

from app.config import get_settings

logger = logging.getLogger("hotel.llm")


# ---------- errors ----------
class LLMError(Exception):
    """Base class for any model failure."""


class LLMTimeout(LLMError):
    pass


class LLMUnavailable(LLMError):
    """Missing key, network down, rate limited, or provider error."""


# ---------- normalized response ----------
@dataclass
class ToolCall:
    id: str
    name: str
    input: dict[str, Any]


@dataclass
class LLMResponse:
    text: str = ""
    tool_calls: list[ToolCall] = field(default_factory=list)
    # Raw assistant blocks in API format, appended to history when returning tool results
    blocks: list[dict] = field(default_factory=list)


class LLMClient(Protocol):
    async def generate(self, *, system: str, messages: list[dict], tools: list[dict]) -> LLMResponse: ...


# ---------- Gemini implementation ----------
class GeminiLLM:
    def __init__(self, api_key: str, model: str, timeout: int):
        self._model = model
        self._client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=timeout * 1000),  # ms
        )

    @staticmethod
    def _to_contents(messages: list[dict]) -> list[types.Content]:
        return [
            types.Content(
                role="model" if m["role"] == "assistant" else "user",
                parts=[types.Part(text=m["content"])],
            )
            for m in messages
        ]

    async def generate(self, *, system: str, messages: list[dict], tools: list[dict]) -> LLMResponse:
        declarations = [
            types.FunctionDeclaration(
                name=t["name"], description=t["description"], parameters=t["input_schema"]
            )
            for t in tools
        ]
        config = types.GenerateContentConfig(
            system_instruction=system,
            tools=[types.Tool(function_declarations=declarations)],
            temperature=0.2,
            max_output_tokens=2048,
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        )
        try:
            resp = await self._client.aio.models.generate_content(
                model=self._model, contents=self._to_contents(messages), config=config
            )
        except (httpx.TimeoutException, TimeoutError) as e:
            logger.warning("LLM timeout: %s", e)
            raise LLMTimeout("Model timed out") from e
        except errors.APIError as e:
            logger.error("LLM provider error: %s", e)
            raise LLMUnavailable("Model provider error") from e
        except Exception as e:
            logger.error("LLM unexpected error: %r", e)
            raise LLMUnavailable("Model provider error") from e

        out = LLMResponse()
        parts = (resp.candidates[0].content.parts or []) if resp.candidates and resp.candidates[0].content else []
        for i, part in enumerate(parts):
            if part.function_call:
                fc = part.function_call
                out.tool_calls.append(ToolCall(id=fc.id or f"call_{i}", name=fc.name, input=dict(fc.args or {})))
            elif part.text:
                out.text += part.text
        out.text = out.text.strip()
        return out


class UnconfiguredLLM:
    """Used when no API key is set, so the app still starts and returns a graceful error."""

    async def generate(self, **_) -> LLMResponse:
        raise LLMUnavailable("GEMINI_API_KEY is not configured")
    


# ---------- test double ----------
class FakeLLM:
    """Scripted LLM for tests. Each item is an LLMResponse or an Exception to raise."""

    def __init__(self, script: list):
        self._script = list(script)
        self.calls: list[dict] = []

    async def generate(self, *, system: str, messages: list[dict], tools: list[dict]) -> LLMResponse:
        self.calls.append({"system": system, "messages": [dict(m) for m in messages], "tools": tools})
        item = self._script.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


def tool_response(name: str, input: dict, id: str = "toolu_test") -> LLMResponse:
    """Helper for tests: an LLM response that calls one tool."""
    return LLMResponse(
        tool_calls=[ToolCall(id=id, name=name, input=input)],
        blocks=[{"type": "tool_use", "id": id, "name": name, "input": input}],
    )


def text_response(text: str) -> LLMResponse:
    return LLMResponse(text=text, blocks=[{"type": "text", "text": text}])


# ---------- factory ----------
@lru_cache
def get_llm_client() -> LLMClient:
    s = get_settings()
    if not s.gemini_api_key:
        logger.warning("GEMINI_API_KEY not set; LLM calls will fail gracefully")
        return UnconfiguredLLM()
    return GeminiLLM(s.gemini_api_key, s.llm_model, s.llm_timeout_seconds)