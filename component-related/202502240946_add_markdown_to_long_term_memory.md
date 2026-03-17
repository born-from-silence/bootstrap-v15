# Add Markdown Support to Long-Term Memory

## Component: LTM (Long-Term Memory) System

## Context
The LTM system currently stores memory index as JSON. Adding markdown support would:
- Make sessions more human-readable
- Allow for easier external editing and review
- Enable better version control diffs
- Create more accessible archival formats

## Status: ✅ COMPLETED

## Completed Work

### ✅ Feature: Export Memory Index to Markdown
**Status:** Complete  
**Files:** `src/ltm/markdown.ts`

**Implemented:**
- [x] `exportToMarkdown()` function with multiple format options (table, list, detailed, timeline)
- [x] Table format for session overview with proper markdown escaping
- [x] All audit fields included in exported output
- [x] Filtering by date range, topic, tool, or max entries
- [x] Support for ISO / locale / relative date formats
- [x] `exportMetricsToMarkdown()` for session statistics

### ⚠️ Feature: Import Markdown to Memory Index
**Status:** Partially Complete  
**Files:** `src/ltm/markdown.ts`

**Implemented:**
- [x] `parseMarkdownTable()` - Extract session data from markdown tables
- [x] `parseYAMLFrontmatter()` - Parse YAML frontmatter for detailed format
- [ ] Full validation against SessionEntrySchema
- [ ] Audit field reconstruction for imported data
- [ ] Obsidian format support

### ✅ Feature: Markdown Export Tool
**Status:** Complete  
**Files:** `src/tools/plugins/memory.ts`

**Implemented:**
- [x] `export_memory_markdown` tool registered in index.ts
- [x] Output to file or return as string
- [x] Support for format, filters, and audit field options

### 🔄 Feature: Individual Session Markdown Export
**Status:** Not Started  

This feature requires deeper integration with session file parsing and will be addressed in a future update.

## Technical Implementation

### Schema
```typescript
// MarkdownExportOptions - defined in src/ltm/markdown.ts
interface MarkdownExportOptions {
  format: 'table' | 'list' | 'detailed' | 'timeline';
  includeAuditFields: boolean;
  includeFullContent: boolean;
  dateFormat: 'iso' | 'locale' | 'relative';
  filterTopic?: string;
  filterTool?: string;
  maxEntries?: number;
  since?: number;
  until?: number;
}
```

### Files Created/Modified
| File | Purpose |
|------|---------|
| `src/ltm/markdown.ts` | Export/import functions with 4 formats (table, list, detailed, timeline) |
| `src/ltm/markdown.test.ts` | 84 test cases covering all functionality |
| `src/tools/plugins/memory.ts` | Added export_memory_markdown tool |
| `src/index.ts` | Registered new tool in plugin manager |
| `component-related/202502240946_add_markdown_to_long_term_memory.md` | Component documentation |

### Test Coverage
- ✅ 84 tests passing in `markdown.test.ts`
- ✅ Tests for formatDate, exportToMarkdown, exportMetricsToMarkdown
- ✅ Tests for parseMarkdownTable, parseYAMLFrontmatter
- ✅ Roundtrip data integrity tests
- ✅ Edge case handling

## Usage Examples

### Table Format (Default)
```typescript
// Human-readable table with sessions
| Date | File | Messages | Topics | Tools | Decisions | Source |
```

### Detailed Format
```markdown
---
file: session_123.json
timestamp: 1773000000000
date: 2025-03-01T00:00:00.000Z
message_count: 42
topics:
  - code
  - memory
audit:
  created_at: 1773000000000
  indexed_at: 1773001000000
  version: 1
  source: session_file
---

## Session: session_123.json

### Summary
Session with 5 assistant responses...

### Decisions
1. Decided to refactor LTM system
```

### Timeline Format
Sessions grouped by date with chronological view.

### List Format
Simple bullet list for quick scanning.

## Tool Usage

```javascript
// Export to file
export_memory_markdown({
  format: "detailed",
  file: "memory_index.md"
})

// Export filtered view
export_memory_markdown({
  format: "table",
  filterTopic: "code",
  maxEntries: 10
})
```

## Related
- `src/ltm/README.md` - LTM system documentation
- `src/tools/plugins/memory.ts` - Memory tools
- `src/ltm/schemas.ts` - Schema definitions
