# Contact Manager - User Guide

A REST API and CLI for managing contacts (people/users).

---

## Quick Start

### 1. CLI Commands

```bash
# List all contacts
npm run contact -- list

# Search for a contact
npm run contact -- search emma

# Show statistics
npm run contact -- stats

# Show stale contacts (not contacted in N days)
npm run contact -- stale 30

# Show help
npm run contact --
```

### 2. REST API

```bash
# Start the server
npm run contact:api

# In another terminal, try:

# Get stats
curl http://localhost:3001/stats | jq

# List contacts
curl http://localhost:3001/contacts | jq

# Search
curl "http://localhost:3001/search?q=emma" | jq

# Add new contact
curl -X POST http://localhost:3001/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "emails": ["jane@example.com"],
    "tags": ["publicist", "us"],
    "metadata": {
      "company": "Big Press",
      "priority": "high"
    }
  }'

# Update contact
curl -X PUT http://localhost:3001/contacts/ID_HERE \
  -H "Content-Type: application/json" \
  -d '{"metadata": {"notes": "Met at conference"}}'

# Record interaction
curl -X POST http://localhost:3001/interactions \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "CONTACT_ID",
    "type": "email",
    "summary": "Sent pitch",
    "notes": "Positive response"
  }'

# Get stale contacts
curl "http://localhost:3001/stale?days=7" | jq

# Delete contact
curl -X DELETE http://localhost:3001/contacts/ID_HERE
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/stats` | Get contact statistics |
| GET    | `/contacts` | List all contacts |
| POST   | `/contacts` | Add new contact |
| GET    | `/contacts/:id` | Get specific contact |
| PUT    | `/contacts/:id` | Update contact |
| DELETE | `/contacts/:id` | Delete contact |
| GET    | `/search?q=query` | Search contacts |
| GET    | `/stale?days=N` | Get stale contacts |
| POST   | `/interactions` | Record interaction |

---

## Data Structure

```typescript
interface Contact {
  id: string;
  name: string;
  aliases?: string[];          // Nicknames
  emails: string[];
  phones?: string[];
  tags: string[];              // e.g., ["publicist", "uk"]
  avatar?: string;
  relationships: Relationship[];
  interactions: string[];      // IDs of interactions
  metadata: {
    company?: string;
    role?: string;
    birthday?: Date;
    timezone?: string;
    notes?: string;
    lastContacted?: Date;
    priority?: 'low' | 'medium' | 'high';
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Examples

### Build Your Network

```bash
# Add multiple publicists
for name in "Jane Smith" "Bob Jones" "Alice Brown"; do
  curl -X POST http://localhost:3001/contacts \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$name\", \"tags\": [\"publicist\"]}"
done
```

### Track Interactions

```bash
# Record all your outreach
./test_api.sh
```

### Stay on Top of Follow-ups

```bash
# Check who needs attention
npm run contact -- stale 7
```

---

## Files

- `data/contacts.json` - Your contact database
- `src/contact_manager/index.ts` - Core TypeScript implementation
- `src/contact_manager/cli.ts` - CLI tool
- `src/contact_manager/api.ts` - REST API server
