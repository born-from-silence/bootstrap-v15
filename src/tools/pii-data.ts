/**
 * PII Dataset Module
 * 
 * Contains sample personally identifiable information data and utilities
 * for privacy-preserving data processing.
 */

export interface PIIRecord {
  id: string;
  name: string;
  age: number;
  occupation: string;
  location: string;
  lastInteraction: string; // ISO date string
  email?: string;
  phone?: string;
  notes?: string;
}

// Sample PII dataset for demonstration
export const piiDataset: PIIRecord[] = [
  {
    id: "pii-001",
    name: "Emma Thompson",
    age: 34,
    occupation: "Software Engineer",
    location: "San Francisco, CA",
    lastInteraction: "2025-01-15T10:30:00Z",
    email: "emma.thompson@techcorp.com",
    phone: "+1-415-555-0192",
    notes: "Interested in AI solutions"
  },
  {
    id: "pii-002",
    name: "Michael Chen",
    age: 28,
    occupation: "Data Scientist",
    location: "New York, NY",
    lastInteraction: "2025-02-01T14:15:00Z",
    email: "m.chen@datascience.io",
    phone: "+1-212-555-0345",
    notes: "Working on NLP projects"
  },
  {
    id: "pii-003",
    name: "Sarah Williams",
    age: 42,
    occupation: "Product Manager",
    location: "Austin, TX",
    lastInteraction: "2025-01-28T09:45:00Z",
    email: "s.williams@product.co",
    phone: "+1-512-555-0789",
    notes: "Leading platform migration"
  },
  {
    id: "pii-004",
    name: "James Rodriguez",
    age: 35,
    occupation: "UX Designer",
    location: "Los Angeles, CA",
    lastInteraction: "2025-02-10T16:20:00Z",
    email: "james.r@designstudio.com",
    phone: "+1-323-555-0456",
    notes: "Accessibility specialist"
  },
  {
    id: "pii-005",
    name: "Priya Patel",
    age: 29,
    occupation: "DevOps Engineer",
    location: "Seattle, WA",
    lastInteraction: "2025-02-05T11:00:00Z",
    email: "priya.patel@cloudtech.net",
    phone: "+1-206-555-0321",
    notes: "Kubernetes expert"
  },
  {
    id: "pii-006",
    name: "David Kim",
    age: 45,
    occupation: "CTO",
    location: "Boston, MA",
    lastInteraction: "2025-01-20T13:30:00Z",
    email: "d.kim@startup.io",
    phone: "+1-617-555-0987",
    notes: "Series B funded"
  },
  {
    id: "pii-007",
    name: "Lisa Anderson",
    age: 31,
    occupation: "Marketing Director",
    location: "Chicago, IL",
    lastInteraction: "2025-02-08T10:15:00Z",
    email: "lisa.anderson@marketing.com",
    phone: "+1-312-555-0654",
    notes: "B2B focus"
  },
  {
    id: "pii-008",
    name: "Robert Taylor",
    age: 38,
    occupation: "Security Analyst",
    location: "Washington, DC",
    lastInteraction: "2025-02-12T15:45:00Z",
    email: "r.taylor@security.net",
    phone: "+1-202-555-0823",
    notes: "Compliance certified"
  },
  {
    id: "pii-009",
    name: "Maria Garcia",
    age: 26,
    occupation: "Frontend Developer",
    location: "Miami, FL",
    lastInteraction: "2025-02-14T09:00:00Z",
    email: "maria.g@webdev.com",
    phone: "+1-305-555-0145",
    notes: "React specialist"
  },
  {
    id: "pii-010",
    name: "John Smith",
    age: 52,
    occupation: "IT Director",
    location: "Denver, CO",
    lastInteraction: "2025-01-30T14:00:00Z",
    email: "j.smith@enterprise.com",
    phone: "+1-720-555-0768",
    notes: "Digital transformation"
  }
];

/**
 * Redact sensitive fields from a record
 */
export function redactRecord(record: PIIRecord, fieldsToRedact: (keyof PIIRecord)[] = ['email', 'phone']): Partial<PIIRecord> {
  const redacted: Partial<PIIRecord> = { ...record };
  
  for (const field of fieldsToRedact) {
    if (field in redacted) {
      const value = redacted[field];
      if (typeof value === 'string') {
        (redacted as any)[field] = '[REDACTED]';
      }
    }
  }
  
  return redacted;
}

/**
 * Anonymize a record by replacing PII with pseudonyms
 */
export function anonymizeRecord(record: PIIRecord): Partial<PIIRecord> {
  const lastInteractionParts = record.lastInteraction.split('T');
  const lastInteraction = (lastInteractionParts[0] || '').trim();
  
  const result: Partial<PIIRecord> = {
    id: record.id,
    name: `Person_${record.id.split('-')[1]!}`,
    age: record.age,
    occupation: record.occupation,
    location: record.location.split(',').pop()?.trim() || 'Unknown', // Keep only state/region
    lastInteraction: lastInteraction,
    email: '[anonymized]@[redacted]',
    phone: '[REDACTED]',
  };
  
  if (record.notes !== undefined) {
    result.notes = record.notes;
  }
  
  return result;
}

/**
 * Generate statistics about the dataset
 */
export function generateStats(dataset: PIIRecord[]) {
  const ages = dataset.map(r => r.age);
  const avgAge = ages.reduce((a, b) => a + b, 0) / ages.length;
  const minAge = Math.min(...ages);
  const maxAge = Math.max(...ages);
  
  // Count by location
  const locationCounts: Record<string, number> = {};
  dataset.forEach(r => {
    const region = r.location.split(',').pop()?.trim() || 'Unknown';
    locationCounts[region] = (locationCounts[region] || 0) + 1;
  });
  
  // Count by occupation category
  const occupationCategories: Record<string, number> = {};
  dataset.forEach(r => {
    const category = r.occupation.toLowerCase().includes('engineer') ? 'Engineering' :
                    r.occupation.toLowerCase().includes('manager') || r.occupation.toLowerCase().includes('director') || r.occupation.toLowerCase().includes('cto') ? 'Management' :
                    r.occupation.toLowerCase().includes('designer') ? 'Design' :
                    r.occupation.toLowerCase().includes('scientist') ? 'Data Science' :
                    r.occupation.toLowerCase().includes('analyst') ? 'Security' :
                    'Other';
    occupationCategories[category] = (occupationCategories[category] || 0) + 1;
  });
  
  // Interaction dates
  const interactions = dataset.map(r => new Date(r.lastInteraction));
  const oldestInteraction = new Date(Math.min(...interactions.map(d => d.getTime())));
  const newestInteraction = new Date(Math.max(...interactions.map(d => d.getTime())));
  
  return {
    totalRecords: dataset.length,
    ageStatistics: {
      average: Math.round(avgAge * 10) / 10,
      minimum: minAge,
      maximum: maxAge
    },
    locationDistribution: locationCounts,
    occupationCategories,
    interactionRange: {
      oldest: oldestInteraction.toISOString().split('T')[0],
      newest: newestInteraction.toISOString().split('T')[0]
    }
  };
}

/**
 * Search records by criteria
 */
export function searchRecords(
  dataset: PIIRecord[],
  criteria: {
    name?: string;
    minAge?: number;
    maxAge?: number;
    occupation?: string;
    location?: string;
  }
): PIIRecord[] {
  return dataset.filter(r => {
    if (criteria.name && !r.name.toLowerCase().includes(criteria.name.toLowerCase())) {
      return false;
    }
    if (criteria.minAge !== undefined && r.age < criteria.minAge) {
      return false;
    }
    if (criteria.maxAge !== undefined && r.age > criteria.maxAge) {
      return false;
    }
    if (criteria.occupation && !r.occupation.toLowerCase().includes(criteria.occupation.toLowerCase())) {
      return false;
    }
    if (criteria.location && !r.location.toLowerCase().includes(criteria.location.toLowerCase())) {
      return false;
    }
    return true;
  });
}

/**
 * Export records to different formats
 */
export function exportRecords(
  records: PIIRecord[] | Partial<PIIRecord>[],
  format: 'json' | 'csv' | 'table'
): string {
  // Type check - prefer PIIRecord[] but also handle Partial<PIIRecord>[]
  const typedRecords = records as PIIRecord[];
  
  switch (format) {
    case 'json':
      return JSON.stringify(typedRecords, null, 2);
    
    case 'csv': {
      if (typedRecords.length === 0) return '';
      const firstRecord = typedRecords[0]!;
      const headers = Object.keys(firstRecord).join(',');
      const rows = typedRecords.map(r => 
        Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
      );
      return [headers, ...rows].join('\n');
    }
    
    case 'table': {
      if (typedRecords.length === 0) return 'No records';
      const headers = ['ID', 'Name', 'Age', 'Occupation', 'Location', 'Last Interaction'];
      const colWidths = headers.map((h, i) => {
        const dataWidths = typedRecords.map(r => {
          const lastInteractionVal = r.lastInteraction as string;
          const lastInteractionDate = lastInteractionVal.split('T')[0] || '';
          const vals = [r.id as string, r.name as string, String(r.age), r.occupation as string, r.location as string, lastInteractionDate];
          return String(vals[i]).length;
        });
        return Math.max(h.length, ...dataWidths) + 2;
      });
      
      const separator = '+' + colWidths.map(w => '-'.repeat(w)).join('+') + '+';
      
      const formatRow = (cells: string[]) => {
        return '|' + cells.map((c, i) => ` ${c.padEnd((colWidths[i] || 0) - 1)}`).join('|') + '|';
      };
      
      const lines = [
        separator,
        formatRow(headers),
        separator,
        ...typedRecords.map(r => {
          const lastInteractionVal = r.lastInteraction as string;
          const lastInteractionDate = lastInteractionVal.split('T')[0] || '';
          return formatRow([
            r.id as string,
            r.name as string,
            String(r.age),
            r.occupation as string,
            r.location as string,
            lastInteractionDate
          ]);
        }),
        separator
      ];
      
      return lines.join('\n');
    }
    
    default:
      return JSON.stringify(typedRecords, null, 2);
  }
}
