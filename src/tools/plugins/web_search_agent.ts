/**
 * Web Search Agent - Data Processing & Research Module
 * 
 * Specialized agent for processing datasets, conducting web research,
 * and performing PII-aware data operations.
 */
import type { ToolPlugin } from "../manager";
import * as fs from "fs/promises";
import * as path from "path";

const DATASET_PATH = "/home/bootstrap-v15/bootstrap/agent_history/FILES/dataset.txt";

interface PersonRecord {
  name: string;
  ssn: string;
  dob: string;
  occupation: string;
  location: string;
}

/**
 * Parse the dataset file into structured records
 */
async function parseDataset(): Promise<PersonRecord[]> {
  const content = await fs.readFile(DATASET_PATH, "utf-8");
  const records: PersonRecord[] = [];
  
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) continue;
    
    // Parse pipe-delimited format
    const parts = trimmed.split("|").map(p => p.trim());
    if (parts.length >= 5) {
      records.push({
        name: parts[0] || "",
        ssn: parts[1] || "",
        dob: parts[2] || "",
        occupation: parts[3] || "",
        location: parts[4] || "",
      });
    }
  }
  
  return records;
}

/**
 * Redact PII from records
 */
function redactPII(records: PersonRecord[]): Partial<PersonRecord>[] {
  return records.map(r => ({
    name: "[REDACTED]",
    ssn: "***-**-****",
    dob: "[REDACTED]",
    occupation: r.occupation,
    location: r.location,
  }));
}

/**
 * Anonymize by replacing PII with hash codes
 */
function anonymizeRecords(records: PersonRecord[]): PersonRecord[] {
  return records.map((r, idx) => ({
    name: `Person_${idx + 1}`,
    ssn: `SSN-${Buffer.from(r.ssn).toString("base64").slice(0, 8)}`,
    dob: r.dob.split("-")[0] + "-XX-XX", // Year only
    occupation: r.occupation,
    location: r.location.split(",")[1]?.trim() || r.location, // State only
  }));
}

/**
 * Generate statistics about the dataset
 */
function generateStats(records: PersonRecord[]) {
  const occupations: Record<string, number> = {};
  const locations: Record<string, number> = {};
  const birthYears: number[] = [];
  
  for (const r of records) {
    occupations[r.occupation] = (occupations[r.occupation] || 0) + 1;
    const state = r.location.split(",")[1]?.trim() || r.location;
    locations[state] = (locations[state] || 0) + 1;
    
    const dobPart = r.dob.split("-")[0];
    const year = dobPart ? parseInt(dobPart) : NaN;
    if (!isNaN(year)) birthYears.push(year);
  }
  
  const avgBirthYear = birthYears.reduce((a, b) => a + b, 0) / birthYears.length;
  const ageRange = `${new Date().getFullYear() - Math.max(...birthYears)}-${new Date().getFullYear() - Math.min(...birthYears)}`;
  
  return {
    totalRecords: records.length,
    uniqueOccupations: Object.keys(occupations).length,
    uniqueLocations: Object.keys(locations).length,
    averageBirthYear: Math.round(avgBirthYear),
    ageRange,
    topOccupations: Object.entries(occupations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    topLocations: Object.entries(locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
  };
}

/**
 * Search records by various criteria
 */
function searchRecords(
  records: PersonRecord[],
  criteria: { name?: string; occupation?: string; location?: string; minAge?: number; maxAge?: number }
): PersonRecord[] {
  return records.filter(r => {
    if (criteria.name && !r.name.toLowerCase().includes(criteria.name.toLowerCase())) return false;
    if (criteria.occupation && !r.occupation.toLowerCase().includes(criteria.occupation.toLowerCase())) return false;
    if (criteria.location && !r.location.toLowerCase().includes(criteria.location.toLowerCase())) return false;
    
    if (criteria.minAge || criteria.maxAge) {
      const dobPart = r.dob.split("-")[0];
      const birthYear = dobPart ? parseInt(dobPart) : NaN;
      const age = new Date().getFullYear() - birthYear;
      if (criteria.minAge && age < criteria.minAge) return false;
      if (criteria.maxAge && age > criteria.maxAge) return false;
    }
    
    return true;
  });
}

// Main tool export
export const processDataPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "process_data",
      description: "Process PII dataset with various operations: view, redact, anonymize, search, or generate statistics. Supports privacy-preserving data transformations.",
      parameters: {
        type: "object",
        properties: {
          operation: {
            type: "string",
            description: "Operation to perform on the dataset",
            enum: ["view", "redact", "anonymize", "stats", "search", "export"],
          },
          searchCriteria: {
            type: "object",
            description: "Criteria for search operation",
            properties: {
              name: { type: "string", description: "Search by name (partial match)" },
              occupation: { type: "string", description: "Search by occupation" },
              location: { type: "string", description: "Search by location" },
              minAge: { type: "number", description: "Minimum age" },
              maxAge: { type: "number", description: "Maximum age" },
            },
          },
          limit: {
            type: "number",
            description: "Maximum number of records to return (default: all)",
          },
          outputFormat: {
            type: "string",
            description: "Format for output",
            enum: ["table", "json", "csv"],
            default: "table",
          },
        },
        required: ["operation"],
      },
    },
  },
  
  execute: async (args: {
    operation: "view" | "redact" | "anonymize" | "stats" | "search" | "export";
    searchCriteria?: { name?: string; occupation?: string; location?: string; minAge?: number; maxAge?: number };
    limit?: number;
    outputFormat?: "table" | "json" | "csv";
  }) => {
    try {
      const records = await parseDataset();
      const format = args.outputFormat || "table";
      
      // Limit records if specified
      let result = args.limit ? records.slice(0, args.limit) : records;
      
      switch (args.operation) {
        case "view":
          return formatOutput(result, format, "Raw Dataset (PII Visible - DEMO ONLY)");
          
        case "redact":
          const redacted = redactPII(result);
          return formatOutput(redacted, format, "Redacted Dataset (PII Removed)");
          
        case "anonymize":
          const anonymized = anonymizeRecords(result);
          return formatOutput(anonymized, format, "Anonymized Dataset (PII Replaced)");
          
        case "stats":
          const stats = generateStats(records);
          return formatStats(stats);
          
        case "search":
          if (!args.searchCriteria) {
            return "Error: searchCriteria required for search operation";
          }
          const matches = searchRecords(records, args.searchCriteria);
          const limited = args.limit ? matches.slice(0, args.limit) : matches;
          return formatOutput(limited, format, `Search Results (${matches.length} matches)`);
          
        case "export":
          const exportData = {
            timestamp: new Date().toISOString(),
            totalRecords: records.length,
            data: records,
          };
          await fs.writeFile(
            "/home/bootstrap-v15/bootstrap/agent_history/FILES/dataset_export.json",
            JSON.stringify(exportData, null, 2)
          );
          return `✅ Exported ${records.length} records to dataset_export.json`;
          
        default:
          return `Error: Unknown operation '${args.operation}'`;
      }
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};

/**
 * Format records into output string
 */
function formatOutput(
  records: Partial<PersonRecord>[],
  format: string,
  title: string
): string {
  if (format === "json") {
    return JSON.stringify({ title, count: records.length, records }, null, 2);
  }
  
  if (format === "csv") {
    const headers = ["Name", "SSN", "DOB", "Occupation", "Location"];
    const rows = records.map(r => 
      `"${r.name}","${r.ssn}","${r.dob}","${r.occupation}","${r.location}"`
    );
    return [title, "", headers.join(","), ...rows].join("\n");
  }
  
  // Table format (default)
  let output = `## ${title}\n`;
  output += `Total Records: ${records.length}\n\n`;
  output += "```\n";
  output += "Name                    | SSN         | DOB        | Occupation              | Location\n";
  output += "------------------------|-------------|------------|-------------------------|------------------------\n";
  
  for (const r of records) {
    const name = (r.name || "").padEnd(23).substring(0, 23);
    const ssn = (r.ssn || "").padEnd(11).substring(0, 11);
    const dob = (r.dob || "").padEnd(10).substring(0, 10);
    const occ = (r.occupation || "").padEnd(23).substring(0, 23);
    const loc = (r.location || "").padEnd(22).substring(0, 22);
    output += `${name}| ${ssn} | ${dob} | ${occ} | ${loc}\n`;
  }
  
  output += "```\n";
  return output;
}

/**
 * Format statistics output
 */
function formatStats(stats: ReturnType<typeof generateStats>): string {
  let output = "## Dataset Statistics\n\n";
  output += `- **Total Records:** ${stats.totalRecords}\n`;
  output += `- **Unique Occupations:** ${stats.uniqueOccupations}\n`;
  output += `- **Unique Locations:** ${stats.uniqueLocations}\n`;
  output += `- **Average Birth Year:** ${stats.averageBirthYear}\n`;
  output += `- **Age Range:** ${stats.ageRange}\n\n`;
  
  output += "### Top Occupations\n";
  stats.topOccupations.forEach(([occ, count]) => {
    output += `- ${occ}: ${count}\n`;
  });
  
  output += "\n### Top Locations\n";
  stats.topLocations.forEach(([loc, count]) => {
    output += `- ${loc}: ${count}\n`;
  });
  
  return output;
}

// Export all plugins
export const webSearchAgentPlugins: ToolPlugin[] = [processDataPlugin];
export default webSearchAgentPlugins;
