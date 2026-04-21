"""Tools exposed to the Opus 4.7 orchestrator.

Sprint 1 scaffolding: a single ``save_profile_field`` tool backed by an
in-memory store. SQLite persistence and the full tool set (log_biomarker,
schedule_screening, fetch_guidelines_for_age_sex, remember) land in the
next iteration.
"""

from __future__ import annotations

from typing import Any


TOOLS: list[dict[str, Any]] = [
    {
        "name": "save_profile_field",
        "description": (
            "Save a single field to the user's health profile. Call this naturally "
            "during conversation as you learn things about the user — never make it "
            "feel like a form. Example fields: 'age', 'sex', 'country', "
            "'family_history.breast_cancer_mother', 'habits.tobacco'. Values can be "
            "strings, numbers, or booleans."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "field": {
                    "type": "string",
                    "description": "Dotted path to the profile field being set.",
                },
                "value": {
                    "description": "The value to store (string / number / boolean).",
                },
                "source": {
                    "type": "string",
                    "enum": ["user_said", "lab", "consultation", "inferred"],
                    "description": "Where the information came from.",
                },
            },
            "required": ["field", "value", "source"],
        },
    },
]


_profile: dict[str, Any] = {}


def reset_profile() -> None:
    """Clear the in-memory profile (useful between test runs)."""
    _profile.clear()


def get_profile() -> dict[str, Any]:
    return dict(_profile)


def execute_tool(name: str, inputs: dict[str, Any]) -> dict[str, Any]:
    """Dispatch a tool call. Returns a JSON-serializable dict."""
    if name == "save_profile_field":
        field = inputs["field"]
        value = inputs["value"]
        _profile[field] = value
        return {"ok": True, "field": field, "value": value}
    raise ValueError(f"Unknown tool: {name}")
