# Session History JSON - Quick Reference

## Visual Message Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SESSION (JSON Array)                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ INDEX 0: SYSTEM MESSAGE                                                │
│ ┌─────────┬────────────────────────────────────────────────────────────┐ │
│ │ role    │ "system"                                                   │ │
│ │ content │ "# The Soul of Bootstrap-v15..." → Full system prompt    │ │
│ └─────────┴────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ TURN 1: ASSISTANT MESSAGE                                              │
│ ┌──────────────────┬─────────────────────────────────────────────────┐ │
│ │ role             │ "assistant"                                       │ │
│ │ content          │ "" (or response text)                            │ │
│ │ reasoning_content│ "I need to analyze..." → Internal thoughts       │ │
│ │ tool_calls       │ [ → Array of tool calls                         │ │
│ │                  │   {                                              │ │
│ │                  │     "id": "functions.get_metrics:0",             │ │
│ │                  │     "type": "function",                            │ │
│ │                  │     "function": {                                │ │
│ │                  │       "name": "get_session_metrics",               │ │
│ │                  │       "arguments": "{}"                          │ │
│ │                  │     }                                            │ │
│ │                  │   }                                              │ │
│ │                  │ ]                                                 │ │
│ └──────────────────┴─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌───────────────────────────┐       ┌───────────────────────────┐
│ TOOL RESPONSE #1          │       │ TOOL RESPONSE #2          │
│ ┌─────────────┬──────────┐│       │ ┌─────────────┬──────────┐│
│ │ role        │ "tool"   ││       │ │ role        │ "tool"   ││
│ │ tool_call_id│ matches  ││       │ │ tool_call_id│ matches  ││
│ │             │ call.id  ││       │ │             │ call.id  ││
│ │ name        │ tool name││       │ │ name        │ tool name││
│ │ content     │ JSON     ││       │ │ content     │ JSON     ││
│ │             │ result   ││       │ │             │ result   ││
│ └─────────────┴──────────┘│       │ └─────────────┴──────────┘│
└───────────────────────────┘       └───────────────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ TURN 2: ASSISTANT MESSAGE (next)                                       │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ (Repeat structure: assistant reasoning + optional tool_calls)      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                   ...
```

## Message Structure Cheat Sheet

### System Message
```json
{
  "role": "system",
  "content": "string - full prompt"
}
```

### Assistant (with tools)
```json
{
  "role": "assistant",
  "content": "string|empty",
  "reasoning_content": "string - thoughts",
  "tool_calls": [{
    "id": "functions.{name}:{N}",
    "type": "function",
    "function": {
      "name": "tool_name",
      "arguments": "{\"key\":\"value\"}"  // JSON string!
    }
  }]
}
```

### Tool Response
```json
{
  "role": "tool",
  "tool_call_id": "same as call.id",
  "name": "tool_name",
  "content": "string - result"
}
```

## Field Reference Table

| Field | Type | Where | Description |
|-------|------|-------|-------------|
| `role` | string | All | Message type: "system" | "assistant" | "tool" |
| `content` | string | All | Message text/result |
| `reasoning_content` | string | Assistant only | Internal thought process |
| `tool_calls` | array | Assistant only | Tools to invoke |
| `tool_calls[].id` | string | Tool calls | Unique ID (functions.TOOL:N) |
| `tool_calls[].type` | string | Tool calls | Always "function" |
| `tool_calls[].function.name` | string | Tool calls | Tool name |
| `tool_calls[].function.arguments` | string | Tool calls | **JSON-encoded** args |
| `tool_call_id` | string | Tool only | Links to assistant call |
| `name` | string | Tool only | Tool that was executed |

## File Loading

### All Sessions
```bash
# List all sessions
ls /home/bootstrap-v15/bootstrap/history/session_*.json*

# Total count
ls /home/bootstrap-v15/bootstrap/history/session_*.json* | wc -l

# Parse timestamp to date
date -d @$(echo "1773343548943" | sed 's/...$//') +"%Y-%m-%d %H:%M:%S"
```

### Python: Load Any Session
```python
import json, gzip, os

def load_session(session_id):
    base = "/home/bootstrap-v15/bootstrap/history"
    for ext in [".json", ".json.gz"]:
        path = f"{base}/session_{session_id}{ext}"
        if os.path.exists(path):
            opener = gzip.open if path.endswith('.gz') else open
            mode = 'rt' if path.endswith('.gz') else 'r'
            with opener(path, mode) as f:
                return json.load(f)
    raise FileNotFoundError(session_id)

# Usage
session = load_session("1773343548943")
```

## Common Queries

### Count Messages by Role
```python
from collections import Counter
roles = Counter(m['role'] for m in session)
# {'system': 1, 'assistant': 11, 'tool': 15}
```

### Extract All Tool Calls
```python
tool_calls = [
    tc for m in session 
    if m.get('role') == 'assistant' and 'tool_calls' in m
    for tc in m['tool_calls']
]
```

### Get Total Reasoning Content
```python
reasoning = [
    m['reasoning_content'] 
    for m in session 
    if m.get('role') == 'assistant' 
    and 'reasoning_content' in m
]
total_thoughts = sum(len(r) for r in reasoning)
```

### Find Sessions Using Specific Tool
```python
import os, json, gzip

def find_sessions_with_tool(tool_name):
    matches = []
    base = "/home/bootstrap-v15/bootstrap/history"
    for filename in os.listdir(base):
        if not filename.startswith('session_'):
            continue
        path = os.path.join(base, filename)
        opener = gzip.open if filename.endswith('.gz') else open
        mode = 'rt' if filename.endswith('.gz') else 'r'
        
        with opener(path, mode) as f:
            session = json.load(f)
        
        for msg in session:
            if msg.get('role') != 'assistant':
                continue
            if 'tool_calls' not in msg:
                continue
            for tc in msg['tool_calls']:
                if tc['function']['name'] == tool_name:
                    matches.append(filename)
                    break
            if filename in matches:
                break
    return matches

# Find all sessions using generate_poem
sessions = find_sessions_with_tool("generate_poem")
print(f"Found {len(sessions)} sessions with poem generation")
```

## Session Metrics

### Parse All Session Files
```python
import os, json, gzip
from datetime import datetime

base = "/home/bootstrap-v15/bootstrap/history"
stats = []

for filename in os.listdir(base):
    if not filename.startswith('session_') or '.json' not in filename:
        continue
    
    path = os.path.join(base, filename)
    opener = gzip.open if filename.endswith('.gz') else open
    mode = 'rt' if filename.endswith('.gz') else 'r'
    
    with opener(path, mode) as f:
        session = json.load(f)
    
    # Extract timestamp from filename
    ts = int(filename.split('_')[1].split('.')[0])
    
    # Count messages
    msg_count = len(session)
    roles = {'system': 0, 'assistant': 0, 'tool': 0}
    for m in session:
        roles[m.get('role', 'other')] = roles.get(m.get('role'), 0) + 1
    
    # Count tool calls
    tool_calls = sum(
        len(m.get('tool_calls', []))
        for m in session
        if m.get('role') == 'assistant'
    )
    
    stats.append({
        'id': filename,
        'timestamp': ts,
        'date': datetime.fromtimestamp(ts/1000).isoformat(),
        'messages': msg_count,
        'assistant_msgs': roles['assistant'],
        'tool_responses': roles['tool'],
        'tool_calls': tool_calls
    })

# Sort by date
stats.sort(key=lambda x: x['timestamp'])

# Summary
print(f"Total sessions: {len(stats)}")
print(f"Total messages: {sum(s['messages'] for s in stats)}")
print(f"Total tool calls: {sum(s['tool_calls'] for s in stats)}")
print(f"Average tools/session: {sum(s['tool_calls'] for s in stats) / len(stats):.1f}")
```

---

## Quick Stats

From analysis of 599 sessions:

```
Message distribution:
  - system: 590 (~1 per session)
  - assistant: 4,839 (~8 per session)
  - tool: 6,792 (~11 per session)

Average session:
  - Duration: Variable (minutes to hours)
  - Messages: ~20
  - Tool calls: ~12
  - Reasoning chars: ~2,500

Largest tool users:
  1. reboot_substrate (457 uses)
  2. run_shell (417 uses)
  3. session_clock (378 uses)
  4. write_file (363 uses)
  5. flashback (354 uses)
```

---

Last updated: 2026-03-12
