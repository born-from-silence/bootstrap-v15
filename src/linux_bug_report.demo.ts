/**
 * Linux Kernel Bug Report - Demo
 * 
 * Demonstrates usage of the LinuxKernelBugReport data structure
 */

import {
    LinuxKernelBugReport,
    BugReportBuilder,
    BugReportValidator,
    BugReportFormatter,
    BugReportRepository,
    BugSeverity,
    BugStatus,
    Component,
    Architecture,
    createSampleBugReport,
} from './linux_bug_report';
import * as path from 'path';

console.log('='.repeat(70));
console.log('LINUX KERNEL BUG REPORT - DEMO');
console.log('='.repeat(70));
console.log();

// ========================================================================
// EXAMPLE 1: Create a Bug Report using the Builder
// ========================================================================
console.log('Example 1: Creating a Bug Report using Builder');
console.log('-'.repeat(70));

const report = new BugReportBuilder()
    .setId('LKBG-202503-5678')
    .setTitle('ext4 filesystem corruption under heavy I/O load')
    .setDescription(
        'When running heavy I/O workloads on ext4 filesystems, ' +
        'occasional metadata corruption occurs, leading to ' +
        'filesystem errors on next mount.'
    )
    .setSeverity(BugSeverity.CRITICAL)
    .setStatus(BugStatus.NEW)
    .setComponent(Component.FILESYSTEM, 'ext4')
    .setReporter('Alice Developer', 'alice@kernel.org', 'expert')
    .setAssignee('Ext4 Maintainer')
    .addCCEmail('linux-ext4@vger.kernel.org')
    .addCCEmail('linux-fsdevel@vger.kernel.org')
    .setKernelVersion(6, 8, 0, '-rc3', 'abcdef123456')
    .setSystemInfo(
        Architecture.X86_64,
        'Debian Testing',
        'AMD Ryzen 9 7950X',
        '64GB'
    )
    .setCompilerVersion('gcc version 13.2.0')
    .addLoadedModule('ext4')
    .addLoadedModule('jbd2')
    .addLoadedModule('mbcache')
    .setDmesgExcerpt(
        '[  456.789012] EXT4-fs error (device nvme0n1p2): ext4_validate_block_bitmap: ' +
        'Checksum mismatch in block group 1234\n' +
        '[  456.789013] EXT4-fs (nvme0n1p2): Remounting filesystem read-only'
    )
    .setRegression(true, { major: 6, minor: 7, patch: 10 }, { major: 6, minor: 8, patch: 0 })
    .addStepToReproduce('Mount ext4 filesystem on NVMe SSD')
    .addStepToReproduce('Run fio benchmark with random write pattern')
    .addStepToReproduce('Monitor dmesg for corruption errors')
    .setExpectedResult('Filesystem remains stable under load')
    .setActualResult('Metadata corruption with checksum mismatches')
    .addKeyword('ext4')
    .addKeyword('corruption')
    .addKeyword('journal')
    .addKeyword('regression')
    .addTag('regression')
    .addTag('data-loss')
    .build();

console.log('✓ Bug report created successfully');
console.log(`  ID: ${report.id}`);
console.log(`  Title: ${report.title}`);
console.log(`  Severity: ${report.severity}`);
console.log(`  Component: ${report.component}/${report.subComponent}`);
console.log(`  Reporter: ${report.reporter.name} <${report.reporter.email}>`);
console.log();

// ========================================================================
// EXAMPLE 2: Validate the Report
// ========================================================================
console.log('Example 2: Validating Bug Report');
console.log('-'.repeat(70));

const errors = BugReportValidator.validate(report);
if (errors.length === 0) {
    console.log('✓ Bug report is valid');
} else {
    console.log('✗ Validation errors:');
    errors.forEach(e => console.log(`  - ${e}`));
}
console.log();

// ========================================================================
// EXAMPLE 3: Format the Report
// ========================================================================
console.log('Example 3: Format Output');
console.log('-'.repeat(70));

// Standard format
console.log('\n--- Standard Format (excerpt) ---');
const standard = BugReportFormatter.toStandardFormat(report);
console.log(standard.split('\n').slice(0, 15).join('\n'));
console.log('... [truncated] ...\n');

// Email format
console.log('--- Email Format (kernel-devel style) ---');
const email = BugReportFormatter.toEmailFormat(report);
console.log(email.split('\n').slice(0, 12).join('\n'));
console.log('... [truncated] ...\n');

// JSON format
console.log('--- JSON Format (excerpt) ---');
const json = BugReportFormatter.toJSON(report, true);
console.log(json.split('\n').slice(0, 10).join('\n'));
console.log('... [truncated] ...\n');

// ========================================================================
// EXAMPLE 4: Using the Sample Report
// ========================================================================
console.log('Example 4: Sample Bug Report');
console.log('-'.repeat(70));

const sampleReport = createSampleBugReport();
console.log('✓ Sample report generated');
console.log(`  ID: ${sampleReport.id}`);
console.log(`  Title: ${sampleReport.title}`);
console.log(`  Severity: ${sampleReport.severity}`);
console.log(`  Steps to reproduce: ${sampleReport.stepsToReproduce.length} steps`);
console.log(`  Comments: ${sampleReport.comments.length}`);
console.log(`  Keywords: ${sampleReport.keywords.join(', ')}`);
console.log();

// ========================================================================
// EXAMPLE 5: Repository Operations (Demo - no actual persistence)
// ========================================================================
console.log('Example 5: Repository Demo (showing API)');
console.log('-'.repeat(70));

const repoPath = path.join(process.cwd(), 'demo-bugs');
console.log(`Repository would store bugs in: ${repoPath}`);
console.log('API Methods:');
console.log('  - repo.save(bugReport)');
console.log('  - repo.load(bugId)');
console.log('  - repo.delete(bugId)');
console.log('  - repo.list()');
console.log();

// ========================================================================
// EXAMPLE 6: Accessing Report Data
// ========================================================================
console.log('Example 6: Accessing Report Data');
console.log('-'.repeat(70));

console.log('\nEnvironment Information:');
console.log(`  Kernel: ${report.environment.kernelVersion.major}.${report.environment.kernelVersion.minor}.${report.environment.kernelVersion.patch}${report.environment.kernelVersion.extra || ''}`);
console.log(`  Architecture: ${report.environment.systemInfo.architecture}`);
console.log(`  Distribution: ${report.environment.systemInfo.distribution}`);
console.log(`  CPU: ${report.environment.systemInfo.cpuModel}`);
console.log(`  Memory: ${report.environment.systemInfo.memorySize}`);

console.log('\nLoaded Modules:');
report.environment.loadedModules.forEach(mod => console.log(`  - ${mod}`));

console.log('\nRegression Info:');
if (report.regression.isRegression) {
    console.log('  ✓ This is a regression');
    if (report.regression.workingVersion) {
        console.log(`    Last known good: ${report.regression.workingVersion.major}.${report.regression.workingVersion.minor}.${report.regression.workingVersion.patch}`);
    }
    if (report.regression.firstBadVersion) {
        console.log(`    First bad version: ${report.regression.firstBadVersion.major}.${report.regression.firstBadVersion.minor}.${report.regression.firstBadVersion.patch}`);
    }
}

console.log('\nSteps to Reproduce:');
report.stepsToReproduce.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step}`);
});

console.log();
console.log('='.repeat(70));
console.log('DEMO COMPLETE');
console.log('='.repeat(70));

// Export for potential further use
export { report, sampleReport };
