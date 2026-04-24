"""`GET /api/trends` — longitudinal biomarker series for the /trends surface.

Groups the shared in-memory biomarker log by canonical name, sorts each series
chronologically, and attaches an optional adult reference range so the UI can
shade "in range" against "worth a conversation." See ROADMAP §16b — *a trend
line is memory you can see*.

Reference ranges shipped here are **generic adult** values; personalization by
age and sex lives in the clinical audit pass, not in this file.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from api.agents.tools import get_biomarkers, seed_biomarker

router = APIRouter(prefix="/api", tags=["trends"])


# ---------------------------------------------------------------------------
# Reference ranges (adult, generic). None means "no universal range" — weight
# is personal, mood scores are self-scaled, etc. Only overlay a shaded band in
# the UI when a range is present.
# ---------------------------------------------------------------------------

REFERENCE_RANGES: dict[str, dict[str, Any] | None] = {
    "fasting_glucose": {"min": 70, "max": 99, "unit": "mg/dL"},
    "hba1c": {"min": 4.0, "max": 5.6, "unit": "%"},
    "ldl": {"min": 0, "max": 100, "unit": "mg/dL"},
    "hdl": {"min": 40, "max": 100, "unit": "mg/dL"},
    "triglycerides": {"min": 0, "max": 150, "unit": "mg/dL"},
    "total_cholesterol": {"min": 0, "max": 200, "unit": "mg/dL"},
    "systolic_bp": {"min": 90, "max": 120, "unit": "mmHg"},
    "diastolic_bp": {"min": 60, "max": 80, "unit": "mmHg"},
    "resting_heart_rate": {"min": 50, "max": 80, "unit": "bpm"},
    "weight_kg": None,
    "bmi": {"min": 18.5, "max": 24.9, "unit": ""},
}


# Humanized labels used in the card title. If a biomarker isn't here the UI
# falls back to "title-casing" the snake_case name.
HUMAN_LABELS: dict[str, str] = {
    "fasting_glucose": "Fasting glucose",
    "hba1c": "HbA1c",
    "ldl": "LDL cholesterol",
    "hdl": "HDL cholesterol",
    "triglycerides": "Triglycerides",
    "total_cholesterol": "Total cholesterol",
    "systolic_bp": "Blood pressure · systolic",
    "diastolic_bp": "Blood pressure · diastolic",
    "resting_heart_rate": "Resting heart rate",
    "weight_kg": "Weight",
    "bmi": "BMI",
}


def _series_sort_key(entry: dict[str, Any]) -> tuple[str, str]:
    # Put dated entries first (earliest to latest); undated fall to the end.
    return (entry.get("sampled_on") or "9999-99-99", entry.get("logged_at") or "")


@router.get("/trends")
async def read_trends() -> dict[str, Any]:
    """Return biomarker series grouped by canonical name.

    Shape:

        {
            "series": {
                "fasting_glucose": {
                    "label": "Fasting glucose",
                    "unit": "mg/dL",
                    "reference_range": {"min": 70, "max": 99, "unit": "mg/dL"},
                    "points": [
                        {"value": 118, "unit": "mg/dL",
                         "sampled_on": "2026-01-22",
                         "source": "lab_report", "idx": 0},
                        ...
                    ]
                },
                ...
            }
        }

    ``idx`` is the position within the flat biomarker log — useful later for
    drilling back to the timeline entry that surfaced the value.
    """
    entries = get_biomarkers()
    grouped: dict[str, list[dict[str, Any]]] = {}
    for idx, entry in enumerate(entries):
        name = entry.get("name")
        if not isinstance(name, str) or not name:
            continue
        grouped.setdefault(name, []).append({**entry, "idx": idx})

    series: dict[str, dict[str, Any]] = {}
    for name, points in grouped.items():
        points.sort(key=_series_sort_key)
        # Pick a representative unit — the most common one in the series.
        unit = points[-1].get("unit", "")
        series[name] = {
            "label": HUMAN_LABELS.get(name, name.replace("_", " ").title()),
            "unit": unit,
            "reference_range": REFERENCE_RANGES.get(name),
            "points": [
                {
                    "value": p.get("value"),
                    "unit": p.get("unit", unit),
                    "sampled_on": p.get("sampled_on"),
                    "source": p.get("source"),
                    "idx": p["idx"],
                }
                for p in points
            ],
        }

    return {"series": series}


# ---------------------------------------------------------------------------
# Demo fixture — plants the fasting-glucose 3-month arc so the /trends page
# isn't empty on a fresh boot. Idempotent-ish: appends unless matching
# sampled_on entries already exist for that biomarker.
# ---------------------------------------------------------------------------


_DEMO_LDL_POINTS: list[tuple[str, float, str]] = [
    # Initial lab in the demo fixture (Laura's January lab, LDL 136).
    ("2026-01-05", 136, "lab_report"),
    # Self-reported after first dietary and walking intervention.
    ("2026-02-15", 128, "user_said"),
    # Setback — travel, off-program, user reports it proactively.
    ("2026-03-10", 141, "user_said"),
    # Back on track · lab re-check.
    ("2026-04-10", 132, "lab_report"),
    # Continuing improvement · self-reported follow-up.
    ("2026-05-20", 124, "user_said"),
    # Six-month lab — durable improvement.
    ("2026-07-05", 112, "lab_report"),
]


@router.post("/trends/seed-demo")
async def seed_demo() -> dict[str, Any]:
    """Seed the demo arc — six LDL points across six months.

    Used by the ``/trends`` page's "Load the demo arc" button and by the
    recorded walk-through so the longitudinal surface is never empty on a
    cold open. The arc goes 136 → 128 → 141 → 132 → 124 → 112 — real
    interventions don't move in a straight line, and the companion's
    voice benefits from having a setback to acknowledge. Ends better
    than it started, which is the demo's real claim. Illustrative data
    only, not tied to any real user.

    Safe to call repeatedly: skips entries whose ``(name, sampled_on)``
    key already exists in the log.
    """
    existing = {
        (b.get("name"), b.get("sampled_on"))
        for b in get_biomarkers()
    }
    seeded = 0
    for sampled_on, value, source in _DEMO_LDL_POINTS:
        if ("ldl", sampled_on) in existing:
            continue
        seed_biomarker(
            name="ldl",
            value=value,
            unit="mg/dL",
            sampled_on=sampled_on,
            source=source,
        )
        seeded += 1

    return {"ok": True, "seeded": seeded, "total": len(get_biomarkers())}
