# Contact Manager - User/Person/Contact System

A flexible contact management system that treats "user", "person", and "contact" as interchangeable concepts based on context.

## Core Philosophy

- **Contact**: The relationship-focused view (who to reach out to)
- **Person**: The human-focused view (the individual)
- **User**: The system-focused view (how they interact with your systems)

All three are stored in the same data structure with context-aware aliases.

## Quick Start

```typescript
import { ContactManager } from './index';

const manager = new ContactManager();

// Add a contact (works as person/user too)
manager.add({
  id: '1',
  name: 'Jane Doe',
  emails: ['jane@example.com'],
  phones: ['+1-555-0123'],
  tags: ['colleague', 'ui-designer'],
  metadata: {
    company: 'Acme Corp',
    role: 'Designer',
    lastContacted: new Date('2026-03-01')
  }
});

// Find by any field
const results = manager.search('jane');

// Get contacts needing attention (30+ days)
const stale = manager.getStaleContacts(30);

// Update last contacted
manager.recordInteraction('1', {
  type: 'email',
  notes: 'Discussed Q2 roadmap'
});
```

## Data Structure

```typescript
interface Contact {
  id: string;                    // Unique identifier
  name: string;                  // Primary display name
  aliases?: string[];            // Nicknames, maiden names, etc.
  emails: string[];              // Primary contact method
  phones?: string[];             // Phone numbers
  tags: string[];                // Categorization
  avatar?: string;               // Image URL
  
  // Relationship intelligence
  relationships: Relationship[];
  interactions: Interaction[];
  
  // Context data
  metadata: {
    // Any key-value data you want to track
    company?: string;
    role?: string;
    birthday?: Date;
    timezone?: string;
    notes?: string;
    lastContacted?: Date;
    contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    priority?: 'low' | 'medium' | 'high';
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

## API Reference

See `index.ts` for full implementation.

## Storage

By default, uses JSON file storage. Can be extended for databases.
