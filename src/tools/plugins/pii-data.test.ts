/**
 * PII Data Processing Tool Tests
 */

import { describe, it, expect } from "vitest";
import {
  piiDataset,
  redactRecord,
  anonymizeRecord,
  generateStats,
  searchRecords,
  exportRecords,
} from "../pii-data";

describe("PII Data Processing", () => {
  describe("redactRecord", () => {
    it("should redact email and phone by default", () => {
      const record = piiDataset[0];
      const redacted = redactRecord(record);
      
      expect(redacted.email).toBe("[REDACTED]");
      expect(redacted.phone).toBe("[REDACTED]");
      expect(redacted.name).toBe(record.name);
      expect(redacted.age).toBe(record.age);
    });

    it("should redact specified fields", () => {
      const record = piiDataset[0];
      const redacted = redactRecord(record, ["name", "email"]);
      
      expect(redacted.name).toBe("[REDACTED]");
      expect(redacted.email).toBe("[REDACTED]");
      expect(redacted.phone).toBe(record.phone);
    });
  });

  describe("anonymizeRecord", () => {
    it("should replace name with pseudonym", () => {
      const record = piiDataset[0];
      const anonymized = anonymizeRecord(record);
      
      expect(anonymized.name).toBe("Person_001");
      expect(anonymized.email).toBe("[anonymized]@[redacted]");
      expect(anonymized.phone).toBe("[REDACTED]");
      expect(anonymized.age).toBe(record.age);
    });

    it("should simplify location to state only", () => {
      const record = piiDataset[0];
      const anonymized = anonymizeRecord(record);
      
      expect(anonymized.location).toBe("CA");
    });
  });

  describe("generateStats", () => {
    it("should calculate correct statistics", () => {
      const stats = generateStats(piiDataset);
      
      expect(stats.totalRecords).toBe(10);
      expect(stats.ageStatistics.minimum).toBe(26);
      expect(stats.ageStatistics.maximum).toBe(52);
      expect(stats.ageStatistics.average).toBeGreaterThan(26);
      expect(stats.ageStatistics.average).toBeLessThan(52);
    });

    it("should count locations correctly", () => {
      const stats = generateStats(piiDataset);
      
      const locationValues = Object.values(stats.locationDistribution);
      const total = locationValues.reduce((a, b) => a + b, 0);
      expect(total).toBe(10);
    });
  });

  describe("searchRecords", () => {
    it("should find records by partial name match", () => {
      const results = searchRecords(piiDataset, { name: "Emma" });
      expect(results.length).toBe(1);
      expect(results[0].name).toContain("Emma");
    });

    it("should find records by age range", () => {
      const results = searchRecords(piiDataset, { minAge: 30, maxAge: 40 });
      expect(results.length).toBeGreaterThan(0);
      
      for (const record of results) {
        expect(record.age).toBeGreaterThanOrEqual(30);
        expect(record.age).toBeLessThanOrEqual(40);
      }
    });

    it("should find records by occupation", () => {
      const results = searchRecords(piiDataset, { occupation: "Engineer" });
      expect(results.length).toBeGreaterThan(0);
      
      for (const record of results) {
        expect(record.occupation.toLowerCase()).toContain("engineer");
      }
    });

    it("should combine multiple criteria", () => {
      const results = searchRecords(piiDataset, {
        location: "San Francisco",
        minAge: 30,
      });
      
      for (const record of results) {
        expect(record.location).toContain("San Francisco");
        expect(record.age).toBeGreaterThanOrEqual(30);
      }
    });
  });

  describe("exportRecords", () => {
    it("should export to JSON format", () => {
      const result = exportRecords(piiDataset.slice(0, 2), "json");
      const parsed = JSON.parse(result);
      
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe(piiDataset[0].name);
    });

    it("should export to CSV format", () => {
      const result = exportRecords(piiDataset.slice(0, 2), "csv");
      const lines = result.split("\n");
      
      expect(lines.length).toBe(3); // header + 2 records
      expect(lines[0]).toContain("id");
      expect(lines[0]).toContain("name");
    });

    it("should export to table format", () => {
      const result = exportRecords(piiDataset.slice(0, 2), "table");
      
      expect(result).toContain("|");
      expect(result).toContain("ID");
      expect(result).toContain("Name");
    });
  });
});

describe("piiDataPlugin", () => {
  it("should have correct definition", async () => {
    const { piiDataPlugin } = await import("./pii-data");
    
    expect(piiDataPlugin.definition.function.name).toBe("process_data");
    expect(piiDataPlugin.definition.function.description).toContain("PII");
  });
});
