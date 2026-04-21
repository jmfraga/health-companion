# Health Companion — Agent Design

Health Companion runs its domain logic through **Claude Managed Agents**. This document describes what each agent does, why it's an agent (not a plain API call), and how they connect.

## Why Managed Agents

Managed Agents let us hand off long-running, tool-using workflows to Anthropic's managed infrastructure — sandboxed containers, tool execution, SSE streaming, server-side session history. We use them for anything that:

- Takes more than a few seconds (OCR, multi-step reasoning).
- Needs tools (code execution, file I/O, Skills like PDF handling).
- Benefits from durable, replayable session history for audit and debugging.

Things we do *not* use Managed Agents for: quick classification, formatting helpers, small prompt-based utilities — those are plain `messages.create` calls against Claude.

## The five agents

| # | Agent | Managed? | Triggered by | Opus 4.7 / Haiku |
|---|-------|----------|--------------|------------------|
| 1 | **OnboardingAgent** | No (plain chat) | First login | Haiku 4.5 |
| 2 | **LabAnalyzerAgent** | Yes | Lab upload | Opus 4.7 |
| 3 | **ConsultationPrepAgent** | Yes | User schedules / requests prep | Opus 4.7 |
| 4 | **PostConsultationAgent** | Yes | Post-visit audio or text submission | Opus 4.7 |
| 5 | **HealthCompanionAgent** | Yes (long-lived) | General chat | Opus 4.7 (Haiku fallback) |

### 1. OnboardingAgent

**Purpose.** Build the initial health profile through conversation, not a form. Extract age, sex, relevant family history, lifestyle signals, language preference.

**Why not Managed.** Stateless per-turn. Fast. No tools. Runs straight through `messages.create` with a structured-output prompt that returns a JSON profile diff each turn, so the backend can upsert the profile incrementally.

**Output.** Partial `HealthProfile` updates (JSON) on every user turn, plus a conversational reply.

**Hand-off.** When the profile reaches a minimum threshold (age, sex, primary concern), it suggests a killer action: "Want me to explain your most recent lab results?" → hands off to LabAnalyzerAgent.

### 2. LabAnalyzerAgent (Managed)

**Purpose.** Take a PDF or image of lab results, extract values, compare against references, contextualize using the patient's profile, and produce a plain-language explanation.

**Toolset.** `agent_toolset` (code execution + file I/O) for image/PDF handling. The Anthropic **PDF skill** (pre-built) handles structured lab PDFs. Code execution runs Tesseract or pdfplumber on edge cases.

**Skills.** `anthropic/pdf`. Custom skill `hc/lab-patterns` to be authored — contains reference ranges, common lab panel patterns (CBC, lipid, metabolic, HbA1c, thyroid, iron studies) and red-flag logic.

**Flow.**
1. Receive PDF/image + profile snapshot + optional prior labs.
2. Extract structured values (test name, value, unit, reference range, flag).
3. Cross-reference with prior labs if any — detect trends.
4. Contextualize against profile (age, sex, family history, active conditions).
5. Generate: structured table of values with traffic-light status, plain-language narrative, list of flags that justify talking to a doctor, suggested follow-up (never diagnostic).
6. Return structured output (`LabAnalysis` schema) — not just text.

**Guardrails.**
- Never uses the word "diagnosis" or prescribes treatment.
- Always ends with "share this with your doctor" or equivalent.
- Critical values (e.g., glucose > 300, potassium out of range) surface an urgent flag.

**Typical session runtime.** 30–90 seconds. Cost per run: ~$0.05–$0.15.

### 3. ConsultationPrepAgent (Managed)

**Purpose.** Help the user walk into a doctor's appointment prepared.

**Input.** Specialty, reason for visit, user profile, recent labs, previous consultation summaries.

**Toolset.** `agent_toolset` (search/retrieval over the user's history).

**Skills.** Custom `hc/consultation-prep` with templates per specialty (endocrinology, cardiology, GI, etc.) — question banks, things-to-bring checklists, typical tests to expect.

**Flow.**
1. Load profile + recent history.
2. Determine specialty-specific context.
3. Generate: patient-facing summary, 5–8 smart questions prioritized by relevance, comparison table of prior labs if relevant, checklist of documents and current medications.
4. Output structured `ConsultationPrep` package.

**Typical session runtime.** 20–60 seconds.

### 4. PostConsultationAgent (Managed)

**Purpose.** Turn a recording or recap of a consultation into an organized, actionable record. Directly addresses the "patients forget 40–80% of what's said" problem.

**Input modes.**
- **Audio:** uploaded recording → Whisper transcription (via code execution tool in the managed environment, or external Whisper API call) → structured extraction.
- **Text dump:** user tells the agent what the doctor said → extraction.

**Toolset.** `agent_toolset` with file I/O for audio.

**Skills.** Custom `hc/post-consultation` — medication parsing, follow-up instruction patterns, pending-study extraction.

**Flow.**
1. Transcribe audio (if audio mode).
2. Extract: diagnoses mentioned, medications with dose/frequency/duration, pending studies (with patient-facing prep instructions), follow-up dates, any red flags.
3. Flag ambiguity: "The doctor mentioned taking it 'when needed' — you may want to clarify next visit."
4. Generate reminders (medication schedule, study prep, follow-up date).
5. Update profile with new diagnoses / medications.
6. Return structured `ConsultationSummary`.

**Guardrails.** Never contradicts the doctor. If instructions seem unsafe or ambiguous, explicitly says "ask your doctor to clarify." Never adjusts dosages.

**Typical session runtime.** 1–3 minutes (audio).

### 5. HealthCompanionAgent (Managed, long-lived)

**Purpose.** The user-facing conversational layer. Answers questions, surfaces timely nudges, delegates to specialist agents, and maintains the feel of a companion that knows the user.

**Toolset.** Full `agent_toolset`. Has tools to read the user's profile, history, recent summaries.

**Skills.** `hc/wellness-pillars` — the six wellness pillars (prevention, body, mind, risk reduction, financial health, illness management) as context it can draw on.

**Behavior.**
- Warm, grounded, never moralizing.
- Proactive only at meaningful moments (trigger events: upcoming birthday chequeos, trending lab values, anniversary of a diagnosis).
- Always refers to the doctor when appropriate.
- Tone adapts to the user's preferred register (direct, motivational, neutral).

**Hand-off.** Delegates to specialist agents when the conversation naturally calls for it (user pastes labs → LabAnalyzerAgent; user says "I have a cardiology appointment Thursday" → ConsultationPrepAgent).

## Shared concerns

### Profile as shared context

All agents read from and write to a canonical `HealthProfile`. The profile is the memory that compounds. Updates from any agent are diffed and applied atomically so that two agents running on behalf of the same user don't trample each other.

### Observability

Every agent run is persisted as an `AgentRun` row in Postgres:

- `id`, `user_id`, `agent_type`, `session_id` (Managed Agents session ID)
- `status` (running / idle / completed / failed)
- `started_at`, `finished_at`, `duration_ms`
- `input_tokens`, `output_tokens`, `session_runtime_seconds`
- `cost_usd` (computed)
- `events_url` (pointer to full event history if we need to replay)

This gives us honest cost tracking and a debug trail.

### Cost model (rough)

Managed Agents pricing (as of April 2026): $0.08 per session-hour runtime + token cost. Opus 4.7 at $5/MTok input, $25/MTok output.

| Agent | Typical cost per run |
|-------|---------------------|
| Onboarding | <$0.01 (plain Haiku call) |
| LabAnalyzer | ~$0.10 |
| ConsultationPrep | ~$0.08 |
| PostConsultation | ~$0.20 (audio adds time) |
| HealthCompanion (per msg) | ~$0.02–$0.05 |

### Safety boundary

Every Managed Agent ends with a system-enforced disclaimer block if the response touches clinical territory. The disclaimer is rendered in the UI in a visible footer, not hidden in fine print.

## Open questions

- **Skills authoring pipeline:** we need to build and upload the custom Skills (`hc/lab-patterns`, `hc/consultation-prep`, `hc/post-consultation`, `hc/wellness-pillars`). How do we version them? Probably a `skills/` folder at repo root that syncs via a `make sync-skills` command.
- **STT provider:** Whisper API (simpler) vs local/self-hosted mlx-audio (we already operate this) vs Anthropic Voice if it supports audio-in on Opus 4.7. Default Whisper API for hackathon; re-evaluate post-submit.
- **Prompt caching:** LabAnalyzer and ConsultationPrep both have long system prompts + skills context that repeat across users. Turn on cache writes at 1-hour TTL for the shared portion.
