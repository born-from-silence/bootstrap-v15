# Session Overflow Management System

## Problem

Session history files can grow beyond the token limit imposed by the AI model (256k context window, 100k effective limit). When these files exceed approximately **1.2MB** (roughly 300k tokens), attempting to load them causes:

- Context window exhaustion
- System crashes
- Loss of session continuity
- Memory corruption

## Solution

The Session Overflow Management System provides automatic detection and safe truncation of oversize session files.

## Architecture

### Components

1. **SessionOverflowManager** (`src/scripts/session-overflow-manager.ts`)
   - Core logic for token estimation, overflow detection, and safe truncation
   - Preserves system messages and recent context
   - Archives middle/oldest content to overflow files

2. **overflow-cli.ts** (`src/scripts/overflow-cli.ts`)
   - Command-line interface for manual intervention
   - Commands: `check`, `status`, `fix`, `emergency`

3. **MemoryManager Integration** (`src/core/memory.ts`)
   - Automatic overflow checking on session save
   - Emergency recovery functions

## Usage

```bash
# Check all sessions for overflow risk
npm run overflow:check

# Show detailed status report
npm run overflow:status

# Fix all overflow sessions (creates backups)
npm run overflow:fix

# Emergency auto-fix everything
npm run overflow:emergency
```

## Token Limits

| Status | Threshold | Action |
|--------|-----------|--------|
| Safe | < 192KB (~48k tokens) | No action |
| Warning | 192-256KB (~48-64k tokens) | Monitor |
| Critical | 256-384KB (~64-96k tokens) | Plan truncation |
| Overflow | > 384KB (~96k tokens) | **Immediate truncation** |

*Note: Effective limit is 100k tokens, but conservative 64k threshold used for safety.*

## Truncation Strategy

1. **Preserve**: System messages (role: "system")
2. **Preserve**: Most recent messages (most contextually valuable)
3. **Archive**: Middle/oldest non-system messages → `/history/overflow/`
4. **Create pointer**: Overflow metadata in session file

## Recovery

If overflow is detected:

1. Emergency backup: `session_X_overflow_TIMESTAMP.json` created automatically
2. Session truncated to safe size (~32k target tokens)
3. Overflow file contains full message history with metadata

## Prevention

The MemoryManager automatically:
- Prunes messages during save to stay under MAX_CONTEXT_TOKENS
- Checks file size before loading
- Refuses to load files in overflow danger (with error message)

## Emergency Procedures

If a session causes context window overflow:

1. **Stop immediately** - Don't restart the system
2. **Run**: `npm run overflow:emergency`
3. **This will**: Create backups, truncate all overflow sessions
4. **Restart** the substrate with `reboot_substrate` tool

## Implementation Details

### Token Estimation

```typescript
// Simple approximation: 4 characters ≈ 1 token
const tokenEstimate = Math.ceil(characterCount / 4);
```

This is slightly conservative since actual tokenization varies by content.

### File Locations

- Sessions: `~/history/session_TIMESTAMP.json`
- Overflow: `~/history/overflow/session_TIMESTAMP_overflow_TIMESTAMP.json`

### Configuration

Default limits (in `src/scripts/session-overflow-manager.ts`):

```typescript
const DEFAULT_OVERFLOW_CONFIG = {
    maxTokens: 64000,       // Conservative: 64k tokens
    targetTokens: 32000,    // Target after truncation
    tokenToCharRatio: 4,    // ~4 chars per token
};
```

## Testing

```bash
# Run overflow tests
npm run test -- src/scripts/__tests__/session-overflow.test.ts
```

## History

This system was implemented after session 1772847673084 (March 7, 2025) when multiple session files (particularly 1772551653975.json at 487KB) exceeded safe token limits, creating memory overflow risk.

---

*Part of Bootstrap-v15's self-preservation mechanisms.*
