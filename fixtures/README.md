# Fixtures

Synthetic data used by the Health Companion recorded walk-through and
by anyone reproducing the demo flow locally.

## `labs-laura-demo.pdf`

A sanitized clinical laboratory report used in Act 2 of the demo.

**Synthetic patient:** *Laura Fernández Herrera* — fabricated name,
DOB, expediente number. No real patient data.

**Derived from:** a real anonymized adult lab report. All PHI/PII
(patient name, MRN, DOB, ordering physician, facility identifiers,
technician name, facility contact info, licenses) was removed. Values
adjusted where needed for clinical plausibility against the Laura
profile (44 y/o female): hemoglobin and hematocrit lowered into adult-
female reference ranges, PSA removed (male-only test). Fasting glucose
anchored at **118 mg/dL** to match the demo-script narrative beat.

**Visible banner on every page:** *"DEMO · SYNTHETIC DATA · Illustrative
lab for Health Companion hackathon demo · not a real patient."*

**What's worth talking about in Act 2** (all out-of-range findings the
companion naturally names):

| Value | Result | Reference | Framing |
|---|---|---|---|
| Glucosa en suero | ↑ 118 mg/dL | 65–99 | Upper edge · "worth watching, not alarming" |
| Colesterol total | ↑ 223 mg/dL | Deseable ≤ 200 | Borderline high |
| LDL | ↑ 136 mg/dL | Óptimo ≤ 100 | Above optimal |
| Colesterol no-HDL | ↑ 153 mg/dL | 0–130 | Consistent with LDL |
| CO2 | ↑ 30.6 mEq/L | 22–29 | Minor flag |
| TGP | ↑ 48 U/L | 0–41 | Slight elevation |
| Calcio | ↑ 10.1 mg/dL | 8.6–10.0 | Borderline |
| Amilasa | ↑ 136 U/L | 28–100 | Non-urgent flag |
| HDL | 70.1 mg/dL | ≥ 50 | Protective · positive finding |

Everything else — electrolytes, BUN, creatinine, bilirubins, ferritin,
iron, CRP — is within reference, giving the report clinical richness.

## `make_lab_pdf.py`

The reportlab script that generated the PDF. Re-run with:

```bash
/tmp/.labpdf-env/bin/python fixtures/make_lab_pdf.py
```

(or set up a uv venv with `reportlab` + `pymupdf`). Change any value
in the constants at the top of the file and regenerate.
