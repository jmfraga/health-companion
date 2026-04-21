"""Structured output for LabAnalyzerAgent."""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


Status = Literal["ok", "borderline", "out_of_range", "critical"]


class LabValue(BaseModel):
    test: str = Field(description="Canonical test name, e.g. 'Fasting glucose'.")
    value: float | None = None
    value_text: str | None = Field(
        default=None,
        description="Raw text when value isn't numeric (e.g. 'negative').",
    )
    unit: str | None = None
    reference_range: str | None = Field(
        default=None, description="As printed on the report, if available."
    )
    status: Status = "ok"
    interpretation: str = Field(
        description="One-sentence plain-language interpretation for this specific value.",
    )


class LabFlag(BaseModel):
    value_refs: list[str] = Field(
        description="Which tests (by name) this flag pertains to."
    )
    severity: Literal["info", "watch", "talk_to_doctor", "urgent"]
    message: str = Field(description="What the user should know or do.")


class LabTrend(BaseModel):
    test: str
    prior_value: float | None
    prior_date: date | None
    current_value: float | None
    current_date: date | None
    direction: Literal["improved", "stable", "worsened", "unclear"]
    summary: str


class LabAnalysis(BaseModel):
    """The structured output returned by LabAnalyzerAgent."""

    drawn_on: date | None = Field(
        default=None, description="Date the sample was drawn, if printed on the report."
    )
    laboratory: str | None = None
    panel_summary: str = Field(
        description="Two or three paragraphs in plain Spanish/English, tuned to the "
        "user's profile. Never uses the word 'diagnosis'. Always ends with a call to "
        "discuss with their doctor."
    )
    values: list[LabValue]
    trends: list[LabTrend] = Field(default_factory=list)
    flags: list[LabFlag] = Field(default_factory=list)
    doctor_questions: list[str] = Field(
        default_factory=list,
        description="Questions the user may want to ask their doctor about these results.",
    )
