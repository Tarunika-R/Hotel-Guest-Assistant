import asyncio
from datetime import date

import pytest

from app.prompts import TOOLS, build_system_prompt
from app.services.llm_client import (
    FakeLLM, LLMTimeout, UnconfiguredLLM, LLMUnavailable, text_response, tool_response,
)


def test_system_prompt_has_date_rules_and_data():
    p = build_system_prompt(date(2026, 10, 2))
    assert "2026-10-02" in p and "Friday" in p
    assert "cannot_answer" in p and "3:00 PM" in p


def test_tools_are_defined():
    assert {t["name"] for t in TOOLS} == {"check_availability", "ask_for_availability_details", "cannot_answer"}


def test_fake_llm_returns_script_and_records_calls():
    llm = FakeLLM([text_response("Check-in is 3 PM."), tool_response("cannot_answer", {"reason": "x"})])
    r1 = asyncio.run(llm.generate(system="s", messages=[{"role": "user", "content": "hi"}], tools=TOOLS))
    r2 = asyncio.run(llm.generate(system="s", messages=[], tools=TOOLS))
    assert r1.text == "Check-in is 3 PM."
    assert r2.tool_calls[0].name == "cannot_answer"
    assert len(llm.calls) == 2


def test_fake_llm_can_raise():
    llm = FakeLLM([LLMTimeout("slow")])
    with pytest.raises(LLMTimeout):
        asyncio.run(llm.generate(system="s", messages=[], tools=TOOLS))


def test_unconfigured_llm_raises_unavailable():
    with pytest.raises(LLMUnavailable):
        asyncio.run(UnconfiguredLLM().generate(system="s", messages=[], tools=TOOLS))