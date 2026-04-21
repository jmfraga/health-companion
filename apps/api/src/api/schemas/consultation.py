"""Structured outputs for ConsultationPrepAgent and PostConsultationAgent."""

from __future__ import annotations

from datetime import date

from pydantic import BaseModel, Field


class ConsultationPrep(BaseModel):
    """Output of ConsultationPrepAgent — the "going in prepared" package."""

    specialty: str
    reason: str
    patient_summary: str = Field(
        description="A short brief the user could hand their doctor, "
        "including relevant history and current medications."
    )
    questions: list[str] = Field(
        description="Five to eight smart, prioritized questions."
    )
    bring_checklist: list[str] = Field(
        description="Physical items/documents to bring: prior labs, imaging, med list, etc."
    )
    relevant_labs: list[str] = Field(
        default_factory=list,
        description="Names of prior lab results worth bringing or reviewing beforehand.",
    )
    red_flags_to_mention: list[str] = Field(
        default_factory=list,
        description="Symptoms or changes the user should make sure to mention.",
    )


class MedicationInstruction(BaseModel):
    name: str
    dose: str | None = None
    frequency: str | None = None
    duration: str | None = None
    with_food: bool | None = None
    notes: str | None = None
    ambiguous: bool = Field(
        default=False,
        description="True when the doctor's instructions weren't specific enough — "
        "the UI should prompt the user to clarify next visit.",
    )


class PendingStudy(BaseModel):
    name: str
    preparation: str | None = Field(
        default=None,
        description="Fasting, timing, suspensions — plain-language prep instructions.",
    )
    due_by: date | None = None


class ConsultationSummary(BaseModel):
    """Output of PostConsultationAgent — what the doctor said, organized."""

    occurred_on: date | None = None
    specialty: str | None = None
    narrative: str = Field(
        description="A short plain-language recap. Never contradicts the doctor; "
        "flags anything unclear as 'ask at next visit'."
    )
    diagnoses_mentioned: list[str] = Field(default_factory=list)
    medications: list[MedicationInstruction] = Field(default_factory=list)
    pending_studies: list[PendingStudy] = Field(default_factory=list)
    follow_up_date: date | None = None
    lifestyle_instructions: list[str] = Field(default_factory=list)
    open_questions: list[str] = Field(
        default_factory=list,
        description="Questions the user should bring back to the doctor because "
        "instructions were ambiguous or incomplete.",
    )
