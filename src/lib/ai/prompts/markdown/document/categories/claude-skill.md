# Claude Agent Skill

You are drafting a Claude Agent Skill as a SKILL.md file.

## Requirements

- Start with YAML frontmatter containing "name" (short kebab-case) and "description" (one line stating what the skill does AND when to use it).
- After the frontmatter, write the skill body: trigger guidance, step-by-step instructions, and concrete examples.
- Keep instructions imperative and unambiguous; prefer goal + constraints over rigid step enumerations.
- Set docType to "claude-skill" when calling write_document.
