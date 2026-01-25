# AGENTS.md

## Overview

This repository uses the following sources of truth:

- **`.cursorrules`** — Always-on invariants (constraints, conventions, paths) and skill routing.
- **Skills** (`/home/aeo/.agents/skills/`) — Step-by-step workflows, patterns, and examples for specific tasks.

---

## Rules vs Skills

**`.cursorrules`** contains only:
- Repo/stack invariants ("always do X", "never do Y")
- Directory/layout conventions unique to this repo
- A routing table that points to the right skill for each task type

**Skills** contain:
- Step-by-step workflows and checklists
- Library/framework usage patterns and code examples
- Testing playbooks and validation commands

This split prevents duplication and contradictions. Each topic has a single authoritative home—either in `.cursorrules` (if it's an always-on constraint) or in a skill (if it's procedural guidance).

### Maintaining the Split

When adding or updating guidance:

1. **Ask**: Is this an always-on constraint for this repo, or procedural how-to guidance?
2. **Constraints** (invariants, "never do X", path conventions) → `.cursorrules`
3. **Procedures** (workflows, examples, checklists, commands) → the relevant skill
4. **Never duplicate** the same instruction in both places—pick one authoritative home
5. **Update, don't add** if the topic already exists somewhere; search first

If guidance in a skill contradicts `.cursorrules`, the invariant in `.cursorrules` wins—update the skill to comply.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Nuxt 4 |
| Database | libsql (SQLite) via Drizzle ORM |
| Auth | Better Auth |
| UI | shadcn-vue, Tailwind CSS |
| Search | SQLite FTS5 |
| Testing | Vitest |

---

## Key Paths

| Purpose | Path |
|---------|------|
| Database schema | `server/database/schema/` |
| Database connection | `server/database/index.ts` |
| Migrations | `server/database/migrations/` |
| API endpoints | `server/api/` |
| Auth utilities | `server/utils/auth.ts`, `server/utils/better-auth.ts` |
| Composables | `app/composables/` |
| Pages | `app/pages/` |
| UI components | `app/components/` |

---

## Database Commands

```bash
pnpm db:generate   # Generate migration from schema changes
pnpm db:migrate    # Apply migrations
pnpm db:push       # Push schema directly (dev only)
pnpm db:studio     # Open Drizzle Studio GUI
```

---

## MCP Servers

**Context7 MCP** — Library documentation via `resolve-library-id` → `query-docs`. Use for Drizzle ORM, Vue, Nuxt, and other library docs.

**Chrome DevTools MCP** — Browser automation for UI testing.

---

## Skills

Skills provide specialized workflows and patterns for common development tasks.

**Skills directory:** `/home/aeo/.agents/skills/`

**Before starting a coding task:**

1. List the skills directory to see available skills
2. Match the task to a relevant skill by name (e.g., `drizzle-development` for database work, `api-endpoint-development` for server routes)
3. Read the skill's `SKILL.md` file
4. Follow its instructions and patterns

**Common skill name patterns:**

- `*-development` — Implementation patterns for that domain
- `*-design` — Design/architecture guidance
- `*-optimization` — Performance or quality improvements
- `ai-*` — AI/LLM integration patterns

When in doubt, check the directory — skill names are descriptive.
