"""Managed Agents integration layer.

Each agent is defined in a prompts/ module with its system prompt,
toolset, and optional Skills. The registry creates/fetches agent and
environment IDs so sessions can be spawned on demand from routers.
"""
