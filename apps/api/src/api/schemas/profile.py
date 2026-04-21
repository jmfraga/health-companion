"""Canonical health profile schemas.

The profile is the shared memory every agent reads from and writes to.
OnboardingAgent builds it up over the first conversation; all other
agents can issue partial updates via ``HealthProfileUpdate`` so that
state stays consistent regardless of which agent is running.
"""

from __future__ import annotations

from datetime import date
from typing import Literal

from pydantic import BaseModel, Field


Sex = Literal["female", "male", "intersex", "prefer_not_to_say"]
Tone = Literal["direct", "motivational", "warm", "neutral"]


class FamilyHistoryEntry(BaseModel):
    condition: str = Field(description="Plain-language name, e.g. 'type 2 diabetes'.")
    relatives: list[str] = Field(
        default_factory=list,
        description="Relatives affected, e.g. ['father', 'paternal_grandfather'].",
    )
    notes: str | None = None


class ActiveCondition(BaseModel):
    name: str
    diagnosed_on: date | None = None
    notes: str | None = None


class Medication(BaseModel):
    name: str
    dose: str | None = None
    frequency: str | None = None
    started_on: date | None = None
    prescribed_by: str | None = None
    reason: str | None = None


class Habits(BaseModel):
    sleep_hours: float | None = None
    activity_minutes_per_week: int | None = None
    tobacco: Literal["never", "former", "current"] | None = None
    alcohol_units_per_week: float | None = None
    notes: str | None = None


class Preferences(BaseModel):
    tone: Tone = "warm"
    language: str = "es"  # BCP-47
    notification_frequency: Literal["daily", "weekly", "event_based"] = "event_based"


class HealthProfile(BaseModel):
    user_id: str
    age: int | None = None
    sex: Sex | None = None
    country: str | None = None
    family_history: list[FamilyHistoryEntry] = Field(default_factory=list)
    active_conditions: list[ActiveCondition] = Field(default_factory=list)
    medications: list[Medication] = Field(default_factory=list)
    habits: Habits = Field(default_factory=Habits)
    preferences: Preferences = Field(default_factory=Preferences)


class HealthProfileUpdate(BaseModel):
    """Partial update — only fields that changed. All others left untouched."""

    age: int | None = None
    sex: Sex | None = None
    country: str | None = None
    add_family_history: list[FamilyHistoryEntry] = Field(default_factory=list)
    add_active_conditions: list[ActiveCondition] = Field(default_factory=list)
    add_medications: list[Medication] = Field(default_factory=list)
    habits: Habits | None = None
    preferences: Preferences | None = None
