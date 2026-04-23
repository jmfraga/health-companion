"""Tools exposed to the Opus 4.7 orchestrator.

Sprint 2 scaffolding: four tools backed by in-memory state so the Act 1
and Act 2 demos can render a live profile, a screening calendar, and
retrieve preventive-care guidelines. SQLite persistence lands in the
next iteration; for the hackathon MVP these accessors hydrate the UI
directly.
"""

from __future__ import annotations

from datetime import UTC, datetime
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
    {
        "name": "schedule_screening",
        "description": (
            "Queue a recommended preventive screening onto the user's timeline. "
            "Use this when the conversation identifies a screening the user should "
            "book — e.g. mammography, colonoscopy, fasting glucose, Pap smear. "
            "Cite the guideline source (USPSTF, ACS, ACOG, Secretaría de Salud) in "
            "recommended_by. Set due_by to an ISO 8601 date when the timing is "
            "specific; leave it null when the guideline applies generally (e.g. "
            "'every 2 years starting at 40') and a concrete date has not yet been "
            "agreed with the user."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "kind": {
                    "type": "string",
                    "description": (
                        "Screening identifier, e.g. 'mammography', 'colonoscopy', "
                        "'fasting_glucose', 'pap_smear', 'lipid_panel'."
                    ),
                },
                "recommended_by": {
                    "type": "string",
                    "description": (
                        "Guideline source, e.g. 'USPSTF 2021', 'ACS 2023', "
                        "'Secretaría de Salud México'."
                    ),
                },
                "due_by": {
                    "type": ["string", "null"],
                    "description": (
                        "ISO 8601 date (YYYY-MM-DD) when the screening should be "
                        "completed. Null when no specific date applies."
                    ),
                },
            },
            "required": ["kind", "recommended_by", "due_by"],
        },
    },
    {
        "name": "fetch_guidelines_for_age_sex",
        "description": (
            "Read-only lookup of relevant preventive-care guidelines for a given "
            "age, sex, and concern. Call this before recommending a screening or "
            "discussing risk so your answer cites the specific guideline. The "
            "model should still reason about which recommendations apply — the "
            "tool only surfaces the menu."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "age": {
                    "type": "integer",
                    "description": "User's age in years.",
                },
                "sex": {
                    "type": "string",
                    "enum": ["female", "male", "intersex", "prefer_not_to_say"],
                    "description": "User's sex assigned for clinical-guideline purposes.",
                },
                "concern": {
                    "type": "string",
                    "description": (
                        "Focus area, e.g. 'cardiovascular', 'breast_cancer', "
                        "'diabetes', 'mental_health', 'colon_cancer'."
                    ),
                },
            },
            "required": ["age", "sex", "concern"],
        },
    },
    {
        "name": "log_biomarker",
        "description": (
            "Log a single biomarker measurement — a lab value the user shares "
            "in conversation, or one extracted from a parsed lab report. Store "
            "the canonical name (e.g. 'fasting_glucose', 'hba1c', "
            "'total_cholesterol', 'ldl', 'hdl', 'triglycerides'), the numeric "
            "value, the unit as printed, the sample date when you know it, and "
            "where the value came from. One call per distinct value. Values "
            "logged here are retrievable later for trend analysis."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": (
                        "Canonical biomarker name in snake_case, e.g. "
                        "'fasting_glucose', 'hba1c', 'total_cholesterol', "
                        "'ldl', 'hdl', 'triglycerides'."
                    ),
                },
                "value": {
                    "type": "number",
                    "description": "Numeric measurement.",
                },
                "unit": {
                    "type": "string",
                    "description": "Unit as printed, e.g. 'mg/dL', '%', 'mmol/L'.",
                },
                "sampled_on": {
                    "type": ["string", "null"],
                    "description": (
                        "ISO 8601 date (YYYY-MM-DD) when the sample was drawn. "
                        "Null when unknown."
                    ),
                },
                "source": {
                    "type": "string",
                    "enum": ["user_said", "lab_report", "wearable", "photo"],
                    "description": "Where the value came from.",
                },
            },
            "required": ["name", "value", "unit", "sampled_on", "source"],
        },
    },
    {
        "name": "remember",
        "description": (
            "Curate memory. Call this sparingly — only when something is worth "
            "keeping across sessions. Use 'episodic' for timestamped user "
            "utterances ('Laura told me on April 21 that her mom died of breast "
            "cancer at 52') and 'semantic' for durable, distilled facts about "
            "the user ('Laura has a first-degree family history of breast "
            "cancer')."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "memory_type": {
                    "type": "string",
                    "enum": ["episodic", "semantic"],
                    "description": "Which memory store to write to.",
                },
                "content": {
                    "type": "string",
                    "description": "The memory text to store.",
                },
                "tags": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": (
                        "Optional tags to make the memory retrievable, e.g. "
                        "['family_history', 'breast_cancer']."
                    ),
                },
            },
            "required": ["memory_type", "content"],
        },
    },
]


# ---------------------------------------------------------------------------
# In-memory state (module-scope; SQLite persistence comes later).
# ---------------------------------------------------------------------------

_profile: dict[str, Any] = {}
_scheduled_screenings: list[dict[str, Any]] = []
_episodic_memory: list[dict[str, Any]] = []
_semantic_memory: list[dict[str, Any]] = []
_biomarkers: list[dict[str, Any]] = []
_timeline: list[dict[str, Any]] = []


def reset_profile() -> None:
    """Clear the in-memory profile (useful between test runs)."""
    _profile.clear()


def reset_screenings() -> None:
    """Clear the in-memory screening queue."""
    _scheduled_screenings.clear()


def reset_memory() -> None:
    """Clear both episodic and semantic memory stores."""
    _episodic_memory.clear()
    _semantic_memory.clear()


def reset_biomarkers() -> None:
    """Clear the in-memory biomarker log."""
    _biomarkers.clear()


def reset_timeline() -> None:
    """Clear the in-memory timeline."""
    _timeline.clear()


def get_biomarkers() -> list[dict[str, Any]]:
    """Return a shallow copy of the biomarker log."""
    return list(_biomarkers)


def seed_biomarker(
    *,
    name: str,
    value: float,
    unit: str,
    sampled_on: str | None,
    source: str,
) -> None:
    """Append a biomarker entry directly, bypassing the tool loop.

    Used by demo fixture seeders (``POST /api/trends/seed-demo``) to plant
    historical values without going through Opus. Shape matches what
    ``log_biomarker`` produces so consumers can treat both identically.
    """
    _biomarkers.append(
        {
            "name": name,
            "value": value,
            "unit": unit,
            "sampled_on": sampled_on,
            "source": source,
            "logged_at": datetime.now(UTC).isoformat(),
        }
    )


def get_profile() -> dict[str, Any]:
    """Return a shallow copy of the profile dict."""
    return dict(_profile)


def get_scheduled_screenings() -> list[dict[str, Any]]:
    """Return a shallow copy of the screening queue."""
    return list(_scheduled_screenings)


def get_memory() -> dict[str, list[dict[str, Any]]]:
    """Return both memory stores as plain lists."""
    return {
        "episodic": list(_episodic_memory),
        "semantic": list(_semantic_memory),
    }


def get_timeline() -> list[dict[str, Any]]:
    """Return a shallow copy of the timeline, sorted by ``occurred_on``.

    The frontend's ``HealthTimeline`` widget renders this list chronologically.
    Events without a valid ``occurred_on`` sink to the bottom.
    """
    return sorted(
        _timeline,
        key=lambda e: (e.get("occurred_on") or "", e.get("created_at") or ""),
    )


def append_timeline_event(
    event_type: str,
    payload: dict[str, Any],
    occurred_on: str,
) -> dict[str, Any]:
    """Append a timeline event and return the stored entry.

    Parameters
    ----------
    event_type:
        Semantic tag for the entry — e.g. ``"onboarding"``, ``"lab_report"``,
        ``"screening_scheduled"``, ``"proactive_message"``.
    payload:
        Arbitrary structured data the UI renders inside the timeline card.
    occurred_on:
        ISO 8601 date (``YYYY-MM-DD``) the event represents in the user's
        health narrative. May be in the past or the simulated future.
    """
    entry = {
        "event_type": event_type,
        "payload": payload,
        "occurred_on": occurred_on,
        "created_at": datetime.now(UTC).isoformat(),
    }
    _timeline.append(entry)
    return entry


# ---------------------------------------------------------------------------
# Guideline table — compact, read-only reference the orchestrator can cite.
# One line per guideline; the model still reasons about applicability.
# ---------------------------------------------------------------------------

_GUIDELINES: list[dict[str, Any]] = [
    # Breast cancer — baseline and earlier-start with first-degree family history.
    {
        "kind": "mammography",
        "guideline": (
            "Biennial screening mammography for women age 40-74 "
            "(updated recommendation, age lowered from 50)."
        ),
        "source": "USPSTF 2024",
        "applicable_when": "sex=female AND age>=40 AND age<=74",
    },
    {
        "kind": "mammography_early_start",
        "guideline": (
            "Begin annual mammography 10 years before the youngest "
            "first-degree relative's breast-cancer diagnosis, and no later than "
            "age 40. Consider adjunct breast MRI when lifetime risk ≥20%."
        ),
        "source": "ACS 2023 / NCCN",
        "applicable_when": ("sex=female AND family_history.breast_cancer_first_degree=true"),
    },
    # Cervical cancer.
    {
        "kind": "pap_smear",
        "guideline": (
            "Cervical cancer screening with cytology every 3 years age 21-29; "
            "age 30-65 prefer HPV primary testing every 5 years or co-test every 5y."
        ),
        "source": "USPSTF 2018 / ACOG",
        "applicable_when": "sex=female AND age>=21 AND age<=65",
    },
    # Colon cancer.
    {
        "kind": "colonoscopy",
        "guideline": (
            "Colorectal cancer screening for all adults age 45-75 "
            "(colonoscopy every 10y, or FIT annually, or stool DNA every 3y)."
        ),
        "source": "USPSTF 2021 / ACS 2018",
        "applicable_when": "age>=45 AND age<=75",
    },
    # Prostate cancer.
    {
        "kind": "prostate_psa",
        "guideline": (
            "Individual shared-decision PSA screening age 55-69; "
            "start earlier (40-45) with first-degree family history or African ancestry."
        ),
        "source": "USPSTF 2018 / AUA",
        "applicable_when": "sex=male AND age>=55 AND age<=69",
    },
    # Diabetes.
    {
        "kind": "fasting_glucose",
        "guideline": (
            "Screen for prediabetes and type 2 diabetes in adults 35-70 "
            "with overweight or obesity (HbA1c, FPG, or 2h OGTT); sooner with "
            "family history of diabetes."
        ),
        "source": "USPSTF 2021 / ADA 2024",
        "applicable_when": "age>=35 AND age<=70",
    },
    # Lipids.
    {
        "kind": "lipid_panel",
        "guideline": (
            "Assess ASCVD risk with a lipid panel every 4-6 years from age 20; "
            "more frequently when risk factors are present."
        ),
        "source": "ACC/AHA 2019",
        "applicable_when": "age>=20",
    },
    # Blood pressure.
    {
        "kind": "blood_pressure",
        "guideline": (
            "Screen for hypertension in adults 18+ annually if ≥40 or at "
            "increased risk; every 3-5 years when 18-39 and low risk."
        ),
        "source": "USPSTF 2021",
        "applicable_when": "age>=18",
    },
    # Lung cancer.
    {
        "kind": "lung_cancer_ldct",
        "guideline": (
            "Annual low-dose CT for adults 50-80 with ≥20 pack-year "
            "smoking history who currently smoke or quit within 15 years."
        ),
        "source": "USPSTF 2021",
        "applicable_when": ("age>=50 AND age<=80 AND habits.tobacco_pack_years>=20"),
    },
    # Cardiovascular deeper workup.
    {
        "kind": "coronary_artery_calcium",
        "guideline": (
            "Consider CAC scoring in adults 40-75 with borderline or "
            "intermediate 10-year ASCVD risk to refine statin decision."
        ),
        "source": "ACC/AHA 2019",
        "applicable_when": "age>=40 AND age<=75",
    },
    {
        "kind": "lipoprotein_a",
        "guideline": (
            "Measure Lp(a) once in adult life, particularly with premature "
            "ASCVD family history or borderline risk."
        ),
        "source": "NLA 2019 / ESC 2019",
        "applicable_when": "age>=18",
    },
    # Mental health screening.
    {
        "kind": "depression_phq9",
        "guideline": (
            "Screen all adults for depression with PHQ-9 when systems are in "
            "place to ensure accurate diagnosis, treatment, and follow-up."
        ),
        "source": "USPSTF 2023",
        "applicable_when": "age>=18",
    },
    {
        "kind": "anxiety_gad7",
        "guideline": (
            "Screen adults <65 for anxiety disorders with GAD-7 when follow-up is available."
        ),
        "source": "USPSTF 2023",
        "applicable_when": "age>=18 AND age<65",
    },
    # México primary-care adjunct.
    {
        "kind": "cardiometabolic_checkup_mx",
        "guideline": (
            "Chequeo PrevenIMSS / ENMSSA: tamizaje anual de presión "
            "arterial, glucosa capilar, perfil de lípidos y perímetro "
            "abdominal a partir de los 20 años."
        ),
        "source": "Secretaría de Salud México — NOM-030/NOM-015",
        "applicable_when": "age>=20",
    },
]


def _recommendations_for(age: int, sex: str, concern: str) -> list[dict[str, Any]]:
    """Filter the guideline table by a rough concern-based bucketing.

    The model handles the fine-grained applicability reasoning; this just
    narrows the menu so the context window stays tight.
    """
    concern_lc = concern.lower()
    buckets: dict[str, set[str]] = {
        "breast_cancer": {"mammography", "mammography_early_start"},
        "cervical_cancer": {"pap_smear"},
        "colon_cancer": {"colonoscopy"},
        "colorectal_cancer": {"colonoscopy"},
        "prostate": {"prostate_psa"},
        "prostate_cancer": {"prostate_psa"},
        "diabetes": {"fasting_glucose", "cardiometabolic_checkup_mx"},
        "lipids": {"lipid_panel", "lipoprotein_a"},
        "hypertension": {"blood_pressure"},
        "blood_pressure": {"blood_pressure"},
        "lung_cancer": {"lung_cancer_ldct"},
        "cardiovascular": {
            "lipid_panel",
            "blood_pressure",
            "coronary_artery_calcium",
            "lipoprotein_a",
            "fasting_glucose",
            "cardiometabolic_checkup_mx",
        },
        "mental_health": {"depression_phq9", "anxiety_gad7"},
        "depression": {"depression_phq9"},
        "anxiety": {"anxiety_gad7"},
    }

    wanted = buckets.get(concern_lc)
    if wanted is None:
        # Unknown concern: return everything and let the model pick.
        return list(_GUIDELINES)
    return [g for g in _GUIDELINES if g["kind"] in wanted]


def execute_tool(name: str, inputs: dict[str, Any]) -> dict[str, Any]:
    """Dispatch a tool call. Returns a JSON-serializable dict."""
    if name == "save_profile_field":
        field = inputs["field"]
        value = inputs["value"]
        _profile[field] = value
        return {"ok": True, "field": field, "value": value}

    if name == "schedule_screening":
        kind = inputs["kind"]
        recommended_by = inputs["recommended_by"]
        due_by = inputs.get("due_by")
        entry = {
            "kind": kind,
            "recommended_by": recommended_by,
            "due_by": due_by,
            "queued_at": datetime.now(UTC).isoformat(),
        }
        _scheduled_screenings.append(entry)
        return {
            "ok": True,
            "kind": kind,
            "recommended_by": recommended_by,
            "due_by": due_by,
        }

    if name == "fetch_guidelines_for_age_sex":
        age = int(inputs["age"])
        sex = inputs["sex"]
        concern = inputs["concern"]
        return {
            "age": age,
            "sex": sex,
            "concern": concern,
            "recommendations": _recommendations_for(age, sex, concern),
        }

    if name == "log_biomarker":
        bm_name = inputs["name"]
        value = inputs["value"]
        unit = inputs["unit"]
        sampled_on = inputs.get("sampled_on")
        source = inputs["source"]
        entry = {
            "name": bm_name,
            "value": value,
            "unit": unit,
            "sampled_on": sampled_on,
            "source": source,
            "logged_at": datetime.now(UTC).isoformat(),
        }
        _biomarkers.append(entry)
        return {"ok": True, "name": bm_name, "value": value, "unit": unit}

    if name == "remember":
        memory_type = inputs["memory_type"]
        content = inputs["content"]
        tags = inputs.get("tags") or []
        entry = {
            "content": content,
            "tags": list(tags),
            "created_at": datetime.now(UTC).isoformat(),
        }
        if memory_type == "episodic":
            _episodic_memory.append(entry)
        elif memory_type == "semantic":
            _semantic_memory.append(entry)
        else:
            raise ValueError(
                f"Unknown memory_type: {memory_type!r} (expected 'episodic' or 'semantic')"
            )
        return {"ok": True, "memory_type": memory_type}

    raise ValueError(f"Unknown tool: {name}")
