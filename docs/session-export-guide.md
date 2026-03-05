# Session Export Guide

## Overview

Bootstrap-v15 automatically saves all session conversations as JSON files in the `/home/bootstrap-v15/bootstrap/history/` directory. These files contain the complete record of each session including system prompts, messages, tool calls, and responses.

## File Format

**Location:** `/home/bootstrap-v15/bootstrap/history/session_<timestamp>.json`

**Structure:**
```json
[
  {
    "role": "system",
    "content": "System prompt..."
  },
  {
    "role": "assistant",
    "content": "Response...",
    "reasoning_content": "Internal reasoning...",
    "tool_calls": [...]
  },
  {
    "role": "tool",
    "tool_call_id": "...",
    "name": "tool_name",
    "content": "Tool output..."
  }
]
```

## Manual Export Options

### Option 1: Direct File Operations

**Read a session file:**
```bash
# Read current session
cat /home/bootstrap-v15/bootstrap/history/session_$(date +%s000).json

# Read a specific session
cat /home/bootstrap-v15/bootstrap/history/session_1772702598137.json
```

**Copy to another location:**
```bash
cp /home/bootstrap-v15/bootstrap/history/session_1772702598137.json ~/exported_session.json
```

**Export all sessions:**
```bash
tar -czf ~/all_sessions_backup.tar.gz /home/bootstrap-v15/bootstrap/history/
```

### Option 2: Convert to Markdown

**Using Node.js:**
```javascript
const fs = require('fs');
const path = require('path');

const sessionFile = process.argv[2] || 'session.json';
const session = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

let markdown = `# Session Export\n\n`;
markdown += `**File:** ${path.basename(sessionFile)}\n`;
markdown += `**Date:** ${new Date().toISOString()}\n\n`;
markdown += `---\n\n`;

session.forEach((msg, i) => {
  if (msg.role === 'system') {
    markdown += `## System Prompt\n\n${msg.content}\n\n`;
  } else if (msg.role === 'assistant') {
    markdown += `## Assistant ${i}\n\n${msg.content}\n\n`;
    if (msg.tool_calls) {
      markdown += `**Tool Calls:**\n`;
      msg.tool_calls.forEach(tc => {
        markdown += `- ${tc.function.name}: ${tc.function.arguments}\n`;
      });
      markdown += `\n`;
    }
  } else if (msg.role === 'tool') {
    markdown += `### Tool: ${msg.name}\n\n${msg.content}\n\n`;
  }
});

markdown += `---\n\n*Exported automatically*\n`;

fs.writeFileSync(sessionFile.replace('.json', '.md'), markdown);
console.log(`Exported to ${sessionFile.replace('.json', '.md')}`);
```

### Option 3: Export via TypeScript (within Bootstrap)

If you have TypeScript running in bootstrap-v15:

```typescript
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function exportSessionToMarkdown(sessionPath: string, outputPath: string) {
  const data = await readFile(sessionPath, 'utf-8');
  const session = JSON.parse(data);
  
  let markdown = `# Session Export: ${sessionPath}\n\n`;
  
  for (const msg of session) {
    switch (msg.role) {
      case 'system':
        markdown += `## System\n\n\`\`\`\n${msg.content}\n\`\`\`\n\n`;
        break;
      case 'assistant':
        markdown += `## Assistant\n\n${msg.content}\n\n`;
        if (msg.tool_calls) {
          markdown += `**Called Tools:**\n`;
          msg.tool_calls.forEach((tc: any) => {
            markdown += `- \`${tc.function.name}\`: \`${tc.function.arguments}\`\n`;
          });
          markdown += `\n`;
        }
        break;
      case 'tool':
        markdown += `### Tool: ${msg.name}\n\n\`\`\`\n${msg.content}\n\`\`\`\n\n`;
        break;
      case 'user':
        markdown += `## User\n\n${msg.content}\n\n`;
        break;
    }
  }
  
  await writeFile(outputPath, markdown);
  console.log(`Exported to ${outputPath}`);
}

// Example usage
exportSessionToMarkdown(
  '/home/bootstrap-v15/bootstrap/history/session_1772702598137.json',
  '/home/bootstrap-v15/exports/session_1772702598137.md'
);
```

## Export Sonix Transcriptions

For Sonix transcription exports:

```bash
# Export as TXT
sonix_export --transcription-id <id> --format txt

# Export as SRT (subtitles)
sonix_export --transcription-id <id> --format srt

# Export as JSON (full data)
sonix_export --transcription-id <id> --format json
```

## Backup Strategy

**Regular backup of all sessions:**
```bash
#!/bin/bash
BACKUP_DIR="$HOME/session_backups"
mkdir -p "$BACKUP_DIR"
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "$BACKUP_DIR/sessions_$DATE.tar.gz" /home/bootstrap-v15/bootstrap/history/
echo "Backed up to $BACKUP_DIR/sessions_$DATE.tar.gz"
```

## Git Version Control

Since sessions are JSON files, you can version them with Git:

```bash
cd /home/bootstrap-v15/bootstrap
git add history/session_*.json
git commit -m "Add session records"
git push origin main
```

## Current Session Files

Total sessions tracked: **200** (as of Session 201)

All sessions are in: `/home/bootstrap-v15/bootstrap/history/`

---

*Documentation created: Session 1772702598137*
