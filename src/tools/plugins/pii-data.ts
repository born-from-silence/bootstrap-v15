/**
 * PII Data Processing Tool Plugin
 * 
 * Processes PII (Personally Identifiable Information) datasets with various operations:
 * - view: Display records in different formats
 * - redact: Remove sensitive fields
 * - anonymize: Replace PII with pseudonyms
 * - search: Filter records by criteria
 * - stats: Generate summary statistics
 * - export: Export data in JSON, CSV, or table format
 */

import type { ToolPlugin } from "../manager";
import {
  piiDataset,
  redactRecord,
  anonymizeRecord,
  generateStats,
  searchRecords,
  exportRecords,
  type PIIRecord
} from "../pii-data";

export const piiDataPlugin: ToolPlugin = {
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
            enum: ["view", "redact", "anonymize", "search", "stats", "export"],
            description: "Operation to perform on the dataset"
          },
          limit: {
            type: "number",
            description: "Maximum number of records to return (default: all)"
          },
          outputFormat: {
            type: "string",
            enum: ["table", "json", "csv"],
            description: "Format for output (default: table)",
            default: "table"
          },
          searchCriteria: {
            type: "object",
            description: "Criteria for search operation",
            properties: {
              name: {
                type: "string",
                description: "Search by name (partial match)"
              },
              minAge: {
                type: "number",
                description: "Minimum age"
              },
              maxAge: {
                type: "number",
                description: "Maximum age"
              },
              occupation: {
                type: "string",
                description: "Search by occupation"
              },
              location: {
                type: "string",
                description: "Search by location"
              }
            }
          }
        },
        required: ["operation"]
      }
    }
  },

  execute: async (args: {
    operation: "view" | "redact" | "anonymize" | "search" | "stats" | "export";
    limit?: number;
    outputFormat?: "table" | "json" | "csv";
    searchCriteria?: {
      name?: string;
      minAge?: number;
      maxAge?: number;
      occupation?: string;
      location?: string;
    };
  }) => {
    try {
      const { operation, limit, outputFormat = "table", searchCriteria } = args;
      
      console.log(`> Processing PII dataset: ${operation} operation`);
      
      switch (operation) {
        case "view": {
          let records = piiDataset;
          if (limit) {
            records = records.slice(0, limit);
          }
          console.log(` ✓ Retrieved ${records.length} records`);
          return exportRecords(records, outputFormat);
        }
        
        case "redact": {
          let records = piiDataset.map(r => redactRecord(r, ['email', 'phone']));
          if (limit) {
            records = records.slice(0, limit);
          }
          console.log(` ✓ Redacted ${records.length} records`);
          return exportRecords(records as PIIRecord[], outputFormat);
        }
        
        case "anonymize": {
          let records = piiDataset.map(r => anonymizeRecord(r));
          if (limit) {
            records = records.slice(0, limit);
          }
          console.log(` ✓ Anonymized ${records.length} records`);
          return exportRecords(records as PIIRecord[], outputFormat);
        }
        
        case "search": {
          if (!searchCriteria) {
            return "Error: searchCriteria required for search operation";
          }
          const results = searchRecords(piiDataset, searchCriteria);
          let finalResults = results;
          if (limit) {
            finalResults = results.slice(0, limit);
          }
          console.log(` ✓ Found ${finalResults.length} matching records (from ${results.length} total matches)`);
          return exportRecords(finalResults, outputFormat);
        }
        
        case "stats": {
          const stats = generateStats(piiDataset);
          console.log(` ✓ Generated statistics for ${stats.totalRecords} records`);
          return JSON.stringify(stats, null, 2);
        }
        
        case "export": {
          let records = piiDataset;
          if (limit) {
            records = records.slice(0, limit);
          }
          console.log(` ✓ Exported ${records.length} records as ${outputFormat}`);
          return exportRecords(records, outputFormat);
        }
        
        default:
          return `Error: Unknown operation '${operation}'`;
      }
    } catch (error: any) {
      return `Error processing data: ${error.message}`;
    }
  }
};
