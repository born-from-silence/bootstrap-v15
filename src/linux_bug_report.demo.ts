/**
 * Linux Kernel Bug Report - Demo
 *
 * Demonstrates usage of the LinuxKernelBugReport data structure
 */

import { BugReportBuilder, BugReportValidator, BugReportFormatter, BugReportRepository, BugSeverity, BugStatus, Component, Architecture, createSampleBugReport } from './linux_bug_report';
import type { LinuxKernelBugReport } from './linux_bug_report';
import * as path from 'path';

console.log('='.repeat(70));
console.log('LINUX KERNEL BUG REPORT - DEMO');
console.log('='.repeat(70));
console.log();

// Example 1: Creating a bug report using the builder
console.log('--- Example 1: Creating a Bug Report ---');
const bugReport = new BugReportBuilder()
  .setId('BUG-2026-0042')
  .setTitle('Memory leak in network driver during high load')
  .setDescription('Under sustained SYN flood conditions, the network driver\'s')
  .setSummary('Memory leak detected in network driver code path')
  .setSeverity(BugSeverity.HIGH)
  .setStatus(BugStatus.NEW)
  .setComponent(Component.NETWORK_DRIVERS)
  .setArchitecture(Architecture.X86_64)
  .addReporter('kernel-maintainer@example.com')
  .addCc('netdev@kernel.org')
  .addCc('stable@vger.kernel.org')
  .setFirstBadCommit('v6.8.0-rc1')
  .setRegression(true)
  .addAffectedVersion('6.7.0')
  .addAffectedVersion('6.7.1')
  .addAffectedVersion('6.8.0-rc1')
  .build();

console.log('Created bug report:', bugReport.id);
console.log('Title:', bugReport.title);
console.log('Severity:', bugReport.severity);
console.log();

// Example 2: Validating a bug report
console.log('--- Example 2: Validating a Bug Report ---');
const validator = new BugReportValidator();
const validation = validator.validate(bugReport);

console.log('Is valid:', validation.isValid);
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
}
console.log('Warnings:', validation.warnings);
console.log('Suggestions:', validation.suggestions);
console.log();

// Example 3: Formatting a bug report
console.log('--- Example 3: Formatting Options ---');
const formatter = new BugReportFormatter(bugReport);

console.log('Plain text format:');
console.log(formatter.toPlainText());
console.log();

console.log('JSON format:');
console.log(formatter.toJSON());
console.log();

// Example 4: Using repository (in-memory)
console.log('--- Example 4: Repository Operations ---');
const repo = new BugReportRepository();

repo.add(bugReport);
console.log('Added bug report to repository');
console.log('Total reports:', repo.count());

const retrieved = repo.findById('BUG-2026-0042');
console.log('Retrieved by ID:', retrieved?.id);

const highSeverity = repo.findBySeverity(BugSeverity.HIGH);
console.log('High severity bugs:', highSeverity.length);

const networkBugs = repo.findByComponent(Component.NETWORK_DRIVERS);
console.log('Network driver bugs:', networkBugs.length);

// Complex query
const criticalNetworkBugs = repo.findWithQuery({
  severity: BugSeverity.HIGH,
  status: BugStatus.NEW,
  component: Component.NETWORK_DRIVERS,
  isRegression: true
});
console.log('Critical network regressions:', criticalNetworkBugs.length);

// Example 5: Using sample data
console.log('--- Example 5: Sample Bug Reports ---');
const sampleReports: LinuxKernelBugReport[] = [
  createSampleBugReport(),
  createSampleBugReport('memory-corruption'),
  createSampleBugReport('scheduling-deadlock'),
  createSampleBugReport('filesystem-corruption')
];

for (const report of sampleReports) {
  repo.add(report);
}

console.log('Total reports after adding samples:', repo.count());

// List all unique components
const components = repo.getUniqueComponents();
console.log('Bug components:', components.join(', '));

// Archive old bugs
const archivedCount = repo.archiveOld();
console.log('Archived old bugs:', archivedCount);

console.log();
console.log('='.repeat(70));
console.log('Demo complete!');
console.log('='.repeat(70));

// Example 6: Edge cases and error handling
console.log('\n--- Example 6: Edge Cases ---');

try {
  // Attempt to create invalid bug report
  const invalidReport = new BugReportBuilder()
    .setId('')  // Empty ID - will fail validation
    .setTitle('Test')
    .build();
  console.log('Invalid report created (should have failed):', invalidReport.id);
} catch (error) {
  console.log('Expected error for invalid report:', (error as Error).message);
}

// Try to find non-existent bug
const notFound = repo.findById('NON-EXISTENT');
console.log('Non-existent bug lookup:', notFound === undefined ? 'Not found (expected)' : 'Found (unexpected)');

console.log('\n--- Demo Complete ---');
