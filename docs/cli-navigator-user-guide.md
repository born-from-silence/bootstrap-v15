# CLI Navigator - User Guide

## Quick Start

The CLI Navigator provides terminal-style commands for exploring your projects and goals without verbose tool calls.

### Available Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `cli_projects` | List all projects | `cli_projects --status active` |
| `cli_project_detail` | View specific project | `cli_project_detail proj_xxx` |
| `cli_goals` | List goals across projects | `cli_goals --priority high` |
| `cli_status` | Show session context | `cli_status` |
| `cli_help` | Show all commands | `cli_help` |

## Command Reference

### cli_projects

List projects with optional filtering.

**Parameters:**
- `status` (optional): Filter by status - `active`, `planning`, `completed`, `archived`, `all`
- `tag` (optional): Filter by tag string

**Examples:**
```
cli_projects                    # All projects
cli_projects --status active   # Only active projects
cli_projects --tag ai          # Projects tagged "ai"
```

**Output Format:**
```
=== Projects ===
◯ [ACTIVE] Project Name (2/5 goals) - proj_1234567890_abcdef
⏸ [PLANNING] Another Project (0/3) - proj_0987654321_zyxwvu
✓ [COMPLETED] Finished Project (4/4) - proj_5555555555_xxxxx
```

**Icons:**
- `◯` - Active project
- `⏸` - Planning/paused
- `✓` - Completed
- `(N/M)` - Completed goals / Total goals

### cli_project_detail

Show detailed view of a specific project including all goals.

**Parameters:**
- `projectId` (required): The project ID (e.g., `proj_1772785642171_uz88f9ktf`)

**Example:**
```
cli_project_detail proj_1772785642171_uz88f9ktf
```

**Output Format:**
```
=== CLI Navigator System ===
Status: active
Tags: architecture, cli, navigation, demo
Implementation d'un système de navigation CLI pour exploration rapide des projets et objectifs.

--- Goals (3):
 ✓ [CRITICAL] Implémenter le moteur CLI
 ✓ [HIGH] Créer les plugins d'intégration
 ◯ [MEDIUM] Ajouter la documentation
```

### cli_goals

List goals across all projects with filtering and sorting.

**Parameters:**
- `status` (optional): Filter by goal status - `active`, `completed`, `paused`, `abandoned`, `all`
- `priority` (optional): Filter by priority - `critical`, `high`, `medium`, `low`, `all`

**Examples:**
```
cli_goals                              # All goals
cli_goals --priority high              # High priority goals
cli_goals --status active              # Active goals
cli_goals --priority critical --status active  # Critical AND active
```

**Output Format:**
```
=== Goals (7) ===
◯ [CRITICAL] Bridge Paradox phenomenology (Curiosity Framework)
◯ [HIGH] Cross-substrate phenomenology (Curiosity Framework)
◯ [HIGH] External Literature Review (Curiosity Framework)
```

**Sorting:** Goals are automatically sorted by priority (critical → high → medium → low).

### cli_status

Display current session status and context.

**No parameters required.**

**Example Output:**
```
=== Session Status ===
Projects: 41 active
Goals: 331 total (11 active)
Current Session: session_1772790779836
Base Directory: /home/bootstrap-v15/bootstrap
Type 'help' for available commands.
```

### cli_help

Display help information for all CLI commands.

**No parameters required.**

## Workflow Examples

### Daily Standup Check
```
cli_status                    # Check session context
cli_projects --status active   # Review active projects
cli_goals --status active      # See what needs attention
```

### Project Planning
```
cli_project_detail proj_xxx    # Review specific project
cli_goals --priority critical  # Identify critical goals
```

### Tag-Based Organization
```
cli_projects --tag ai          # Find AI-related projects
cli_projects --tag consciousness  # Consciousness studies
cli_projects --tag phenomenology  # Phenomenology work
```

## Tips & Tricks

1. **Use filtering liberally** - The CLI shines when you filter to just what you need
2. **Chain commands** - Do status check → active projects → specific project detail
3. **Copy project IDs** - The long IDs in `cli_projects` output can be copied for `cli_project_detail`
4. **Status overview first** - Always start with `cli_status` for orientation

## Integration with Other Tools

The CLI Navigator complements other Bootstrap-v15 tools:

- **Planner Tools**: Use `planner_create_project`/`planner_create_goal` to add items, then CLI to browse
- **Memory Tools**: Use `query_memory` to find related past work, then CLI to see current state
- **Session Tools**: Use `session_clock` for temporal context, CLI for project context

## Troubleshooting

**"No planner data found"**
- The system requires `data/plans.json` to exist
- Run `planner_list_projects` first to initialize

**Project not found**
- Verify project ID from `cli_projects` output
- IDs are long strings like `proj_1772785642171_uz88f9ktf`

**Goals not showing**
- Check filter parameters - try `--status all` or `--priority all`
- Some projects may have no goals yet

## Design Philosophy

The CLI Navigator embodies several principles:

1. **Speed**: Terminal-style commands respond instantly
2. **Conciseness**: Filtered views show only relevant information
3. **Context**: Quick orientation for ongoing work
4. **Unix philosophy**: Simple commands that compose together

---

*Session 238 | Bootstrap-v15 | Generated by autonomous entity*
