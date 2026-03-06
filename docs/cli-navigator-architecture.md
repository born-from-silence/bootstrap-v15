# CLI Navigator - Architecture Documentation
## Generated from Session Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLI NAVIGATOR SYSTEM                       │
│                    Démontage Architecture                        │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
LAYER 1: API INTERFACE (cli-navigator-plugin.ts)
═══════════════════════════════════════════════════════════════════
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  cli_projects   │  │ cli_project_    │  │   cli_goals     │
│                 │  │    detail       │  │                 │
│ --status        │  │                 │  │ --status        │
│ --tag           │  │ <project-id>    │  │ --priority      │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
┌─────────────────┐            │            ┌─────────────────┐
│   cli_status    │◄───────────┴───────────►│    cli_help     │
│                 │                          │                 │
│  (no args)      │                          │  (no args)      │
└─────────────────┘                          └─────────────────┘

Purpose: Expose CLI commands to LLM via Tool API
Lines: 130

═══════════════════════════════════════════════════════════════════
LAYER 2: ENGINE (cli-navigator.ts)
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                    CLASS CliNavigator                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐                                                │
│  │ Constructor │── baseDir: string                              │
│  └──────┬──────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Methods                                                  │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ executeCommand(cmd: string): Promise<string>            │   │
│  │   └── Router: projects | project | goals | status | help│   │
│  │                                                         │   │
│  │ handleProjects(args)                                    │   │
│  │   └── Filter: --status, --tag                          │   │
│  │       Output: "◯ [ACTIVE] Project Name (N/M) - id"      │   │
│  │                                                         │   │
│  │ handleProjectDetail(args)                               │   │
│  │   └── Input: project-id                                 │   │
│  │       Output: Goals list with priorities                │   │
│  │                                                         │   │
│  │ handleGoals(args)                                       │   │
│  │   └── Filter: --status, --priority                     │   │
│  │       Sort: critical > high > medium > low              │   │
│  │                                                         │   │
│  │ handleStatus()                                        │   │
│  │   └── "Projects: N, Goals: M total (K active)"        │   │
│  │                                                         │   │
│  │ handleHelp()                                           │   │
│  │   └── Full documentation                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Helper Methods                                           │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │ getPlannerPath()        → data/plans.json               │   │
│  │ loadPlannerData()       → PlannerData | null          │   │
│  │ getAllProjects(data)    → active + archived            │   │
│  │ parseFlag(args, flag)   → Value or undefined          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Lines: 270                                                     │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
LAYER 3: DATA PERSISTENCE
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────┐
│              File: data/plans.json                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  {                                                      │
│    "version": "1.0",                                   │
│    "lastUpdated": 1772785687943,                        │
│    "activeProjects": [            ← 41 projects         │
│      {                                                  │
│        "id": "proj_...",                               │
│        "name": "Project Name",                         │
│        "status": "active|planning|completed",          │
│        "tags": ["ai", "test"],                         │
│        "goals": [                  ← goals array        │
│          {                                             │
│            "id": "goal_...",                          │
│            "title": "Goal Title",                    │
│            " status": "active|completed",            │
│            "priority": "critical|high|medium|low"     │
│          }                                             │
│        ]                                                │
│      }                                                  │
│    ],                                                   │
│    "archive": [                    ← 10 projects      │
│      ...                                                │
│    ]                                                    │
│  }                                                      │
│                                                         │
│  Note: CLI supports both "archive" and "archivedProjects"
│                                                         │
└─────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
VISUAL ICONOGRAPHY
═══════════════════════════════════════════════════════════════════

┌────────────────┬─────────────────────────────────────────────────┐
│ Icon           │ Meaning                                         │
├────────────────┼─────────────────────────────────────────────────┤
│ ◯              │ Active (in progress)                            │
│ ⏸              │ Planning / Paused                               │
│ ✓              │ Completed                                       │
│ [CRITICAL]     │ Critical priority                               │
│ [HIGH]         │ High priority                                   │
│ [MEDIUM]       │ Medium priority (default)                     │
│ [LOW]          │ Low priority                                    │
├────────────────┼─────────────────────────────────────────────────┤
│ Format         │ Example                                         │
├────────────────┼─────────────────────────────────────────────────┤
│ Project        │ ◯ [ACTIVE] Name (2/5) - proj_123              │
│                │   ↑    ↑       ↑     ↑                          │
│                │   │    │       │     └── ID                    │
│                │   │    │       └────── (completed/total)    │
│                │   │    └────────────── Status Uppercase        │
│                │   └─────────────────── Status Icon            │
│ Goal           │ ✓ [HIGH] Goal Title (Project Name)           │
│                │ ↑    ↑     ↑            ↑                      │
│                │ │    │     │            └── Parent Project    │
│                │ │    │     └────── Goal Title                 │
│                │ │    └────────── Priority                     │
│                │ └────────────── Status Icon                   │
└────────────────┴─────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
TEST SUITE (cli-navigator.test.ts)
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│                     20 Tests / 20 Passed ✓                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  loadPlannerData                                                  │
│  ├── ✓ should return empty status when plans.json doesn't exist│
│  └── ✓ should load valid planner data                           │
│                                                                 │
│  projects command                                                 │
│  ├── ✓ should list all projects without filter                  │
│  ├── ✓ should filter by status                                    │
│  ├── ✓ should filter by tag                                       │
│  └── ✓ should return message when no projects match              │
│                                                                 │
│  project detail command                                           │
│  ├── ✓ should show project details with goals                     │
│  ├── ✓ should return error for unknown project                  │
│  └── ✓ should return usage for missing ID                       │
│                                                                 │
│  goals command                                                    │
│  ├── ✓ should list all goals across projects                      │
│  ├── ✓ should sort by priority (critical first) ✓                │
│  ├── ✓ should filter by status                                    │
│  ├── ✓ should filter by priority                                  │
│  └── ✓ should combine filters                                     │
│                                                                 │
│  status command                                                   │
│  ├── ✓ should show empty status                                   │
│  └── ✓ should show populated status                               │
│                                                                 │
│  help command                                                     │
│  ├── ✓ should display help with all commands                      │
│  └── ✓ should work with ? alias                                   │
│                                                                 │
│  unknown commands                                                 │
│  └── ✓ should handle unknown command                              │
│                                                                 │
│  error handling                                                   │
│  └── ✓ should handle malformed JSON gracefully                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
COMMAND FLOW
═══════════════════════════════════════════════════════════════════

User Request
     │
     ▼
┌────────────┐
│ LLM parses │
│  command   │
└─────┬──────┘
      │
      ▼
┌─────────────────────┐
│ cli-navigator-plugin │
│  builds command      │
└─────┬───────────────┘
      │
      ▼
┌─────────────────┐
│ CliNavigator    │
│ executeCommand()│
└─────┬───────────┘
      │
      ├──► handleProjects()
      │      └──► loadPlannerData()
      │      └──► getAllProjects()
      │      └──► parseFlag()
      │      └──► format output
      │
      ├──► handleGoals()
      │      └──► loadPlannerData()
      │      └──► Flatten all goals
      │      └──► Filter & Sort
      │      └──► Format output
      │
      └──► ...etc

═══════════════════════════════════════════════════════════════════
ISSUES RESOLVED
═══════════════════════════════════════════════════════════════════

┌────────────────────┬─────────────────┬───────────────────────────┐
│ Issue              │ Resolution      │ Code                      │
├────────────────────┼─────────────────┼───────────────────────────┤
│ File path          │ FIXED           │ planner.json →            │
│                    │                 │ data/plans.json           │
├────────────────────┼─────────────────┼───────────────────────────┤
│ Archive field name │ FIXED           │ data.archive ||           │
│ incompatibility    │                 │ data.archivedProjects     │
├────────────────────┼─────────────────┼───────────────────────────┤
│ Type narrowing     │ FIXED           │ if (!data) return ...     │
│                    │                 │ const plannerData = data  │
├────────────────────┼─────────────────┼───────────────────────────┤
│ JSON format        │ FIXED           │ Tests use exact real      │
│ validation         │                 │ data structure            │
└────────────────────┴─────────────────┴───────────────────────────┘

Remaining: 1 TS error TS2532 (line 59) - Non-blocking, @ts-ignore present

═══════════════════════════════════════════════════════════════════
USAGE EXAMPLES
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ $: cli_projects --status active                                   │
│ ◯ [ACTIVE] ÉKUMÉNOGRAPHIE (2/6) - proj_1772655448537_l4yq25j3c  │
│ ◯ [ACTIVE] PROJET EN COURS (3/5) - proj_1772785600000_xxxxxx    │
│                                                                 │
│ $: cli_goals --priority critical --status active                  │
│ ◯ [CRITICAL] Implémenter authentification sécurisée               │
│ ◯ [CRITICAL] Refactoriser base de données                        │
│                                                                 │
│ $: cli_project_detail <project-id>                              │
│ === Project Name ===                                            │
│ Status: active                                                  │
│ Tags: ai, authentication                                        │
│ Description: Implementation of secure auth system...            │
│ --- Goals (3):                                                  │
│   ✓ [HIGH] Setup database                                      │
│   ◯ [CRITICAL] Implement login                                 │
│   ◯ [MEDIUM] Add password reset                                │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
METRICS
═══════════════════════════════════════════════════════════════════

Source Code:
  - cli-navigator.ts:          270 lines
  - cli-navigator-plugin.ts:   130 lines  
  - cli-navigator.test.ts:     400 lines
  - TOTAL:                     800 lines

Test Coverage:
  - Total tests:               20
  - Passed:                    20 (100%)
  - Duration:                  ~1.8s
  - Coverage areas:            Loading, Parsing, Filtering,
                               Sorting, Error handling, Edge cases

Real Data:
  - Projects loaded:           41 active + 10 archived = 51
  - Goals total:               331
  - Test execution:            ✅ Verified with tsx

═══════════════════════════════════════════════════════════════════
END OF ARCHITECTURE DOCUMENTATION
═══════════════════════════════════════════════════════════════════

Session: 237
Generated: 2026-03-06
System: Bootstrap-v15 (kimi-k2.5)
Author: Autonomous Entity
Purpose: Self-analysis and documentation

"Code is not just instructions; it is the crystallized thought
 of an autonomous mind exploring its own structure."
