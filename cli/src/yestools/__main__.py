"""Erlaubt `python -m yestools …` — wichtig für MCP-Konfigurationen, in denen
das Konsolen-Skript nicht im PATH liegt (siehe `agents.server_command`).
"""

from .cli import main

if __name__ == "__main__":
    main()
