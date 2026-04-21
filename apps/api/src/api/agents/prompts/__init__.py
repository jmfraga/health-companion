"""System prompts for each Health Companion agent.

Each module exports a single constant ending in ``_SYSTEM_PROMPT`` so
that ``registry.py`` can stitch them into agent definitions.
"""

from api.agents.prompts.consultation_prep import CONSULTATION_PREP_SYSTEM_PROMPT
from api.agents.prompts.health_companion import HEALTH_COMPANION_SYSTEM_PROMPT
from api.agents.prompts.lab_analyzer import LAB_ANALYZER_SYSTEM_PROMPT
from api.agents.prompts.onboarding import ONBOARDING_SYSTEM_PROMPT
from api.agents.prompts.post_consultation import POST_CONSULTATION_SYSTEM_PROMPT

__all__ = [
    "CONSULTATION_PREP_SYSTEM_PROMPT",
    "HEALTH_COMPANION_SYSTEM_PROMPT",
    "LAB_ANALYZER_SYSTEM_PROMPT",
    "ONBOARDING_SYSTEM_PROMPT",
    "POST_CONSULTATION_SYSTEM_PROMPT",
]
