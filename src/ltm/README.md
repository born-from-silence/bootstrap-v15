# LTM (Long-Term Memory) Schema System

## Overview

This directory contains the refined type system for the Long-Term Memory (LTM) index. The system provides:

- **Runtime validation** via Zod schemas (when `zod` package is installed)
- **Type-safe compatibility** via pure TypeScript interfaces (no runtime dependencies)
- **Data lineage tracking** via comprehensive audit fields
- **Migration utilities** for evolving data formats

## Files

| File | Purpose | Runtime Dependency |
|------|---------|-------------------|
| `schemas.ts` | Zod schemas with runtime validation | `zod` |
| `schemas-compat.ts` | TypeScript interfaces without runtime deps | None |
| `schemas.test.ts` | Comprehensive test coverage | Zod (for Zod tests) |
| `README.md` | This documentation | None |

## Schema Features

### SessionEntry

The core data type for indexed sessions:

```typescript
interface SessionEntry {
  // Required fields
  timestamp: number;        // Session creation time
  file: string;             // Source filename
  messageCount: number;       // Total messages
  
  // Optional fields (absent when empty)
  topics?: string[];          // Extracted topics
  decisions?: string[];       // Decisions made
  toolsUsed?: string[];       // Tools executed
  summary?: string | null;    // Session summary
  
  // Audit fields for data lineage
  audit?: {
    createdAt: number;        // Original creation
    indexedAt: number;        // When indexed
    updatedAt?: number;       // Last update
    version: 1;              // Schema version
    source: SessionSource;   // Data origin
  };
}
```

### Nullability Distinctions

The schemas carefully distinguish between:

| State | Meaning | Example |
|-------|---------|---------|
| `undefined` | Field not present | No topics extracted |
| `null` | Explicitly empty | Summary explicitly cleared |
| `[]` (empty array) | Field present but empty | Legacy data with no decisions |
| Value | Normal data | `["code", "memory"]` |

### Audit Fields

All entries can include audit metadata:

- `createdAt`: When the original session was created
- `indexedAt`: When this entry was added to LTM
- `updatedAt`: When this entry was last modified
- `version`: Schema version for migrations
- `source`: Origin of data (session_file, manual_entry, import, migration)

## Usage

### With Zod (Recommended)

```typescript
import { SessionEntrySchema, validateSessionEntry, migrateSessionEntry } from "./ltm/schemas";

// Runtime validation
const result = validateSessionEntry(unknownData);
if (result.success) {
  // Safe to use result.data
  const entry: SessionEntry = result.data;
}

// Migrating legacy data
const migrated = migrateSessionEntry({
  timestamp: Date.now(),
  file: "old.json",
  messageCount: 42,
  topics: ["code"]
});
// migrated now includes audit fields
```

### Without Zod (Compatibility Mode)

```typescript
import { 
  validateSessionEntry, 
  withAuditFields,
  type SessionEntry 
} from "./ltm/schemas-compat";

// Type-safe validation (no Zod)
const result = validateSessionEntry(data);

// Add audit fields
const withAudit = withAuditFields(entry, { source: "session_file" });
```

### In Memory Tools

The memory plugins now use the updated SessionEntry type with audit fields:

```typescript
import type { SessionEntry } from "../tools/plugins/memory";

const entry: SessionEntry = {
  timestamp: Date.now(),
  file: "session_123.json",
  messageCount: 42,
  // Only include optional fields if they have content
  ...(analysis.topics.length > 0 && { topics: analysis.topics }),
  audit: {
    createdAt: timestamp,
    indexedAt: Date.now(),
    version: 1,
    source: "session_file"
  }
};
```

## Migration

Use the migration utilities to upgrade legacy entries:

```typescript
import { migrateSessionEntries } from "./ltm/schemas-compat";

const { migrated, failed } = migrateSessionEntries(legacyEntries);
```

## Installation

1. Install Zod (when ready): `npm install zod`
2. Update imports from `schemas-compat` to `schemas` for runtime validation

## Testing

```bash
# Run all tests including schema tests
npm test

# Note: Zod-specific tests will be skipped if zod is not installed
```

## Future Enhancements

- [ ] Add source hash validation (SHA256)
- [ ] Implement validation status tracking
- [ ] Add extended audit with file size stats
- [ ] Create schema migration utilities
- [ ] Build query validation for memory queries
