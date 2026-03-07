# Linux Kernel Bug Report - Data Structure Reference

## Overview

A comprehensive TypeScript module for representing Linux kernel bug reports following established kernel bug reporting conventions.

## Quick Start

```typescript
import { BugReportBuilder, BugSeverity, Component, Architecture } from './linux_bug_report';

// Create a bug report using the builder
const report = new BugReportBuilder()
    .setId('LKBG-202503-1234')
    .setTitle('Kernel panic when unplugging USB storage')
    .setDescription('When unplugging USB device without unmounting...')
    .setSeverity(BugSeverity.HIGH)
    .setComponent(Component.USB, 'storage')
    .setKernelVersion(6, 7, 2, '-generic', '1a2b3c4d')
    .setSystemInfo(Architecture.X86_64, 'Ubuntu 22.04')
    .addStepToReproduce('Connect USB device')
    .addStepToReproduce('Mount device')
    .setExpectedResult('Safe removal')
    .setActualResult('Kernel panic')
    .build();
```

## Enumerations

| Enum | Values |
|------|--------|
| `BugSeverity` | CRITICAL, HIGH, MEDIUM, LOW |
| `BugStatus` | NEW, CONFIRMED, IN_PROGRESS, NEEDS_INFO, RESOLVED, CLOSED |
| `BugResolution` | FIXED, DUPLICATE, WONT_FIX, NOT_A_BUG, CANT_REPRODUCE |
| `Architecture` | X86_64, I386, ARM64, ARM, RISCV, MIPS, POWERPC, S390, SPARC |
| `Component` | KERNEL, MM, SCHEDULER, FILESYSTEM, NETWORK, PCI, USB, SCSI, BLOCK, DRM, SOUND, etc. |

## Key Interfaces

### Main Bug Report
```typescript
interface LinuxKernelBugReport {
    id: string;
    title: string;
    description: string;
    severity: BugSeverity;
    status: BugStatus;
    component: Component;
    reporter: Reporter;
    environment: Environment;
    regression: RegressionInfo;
    stepsToReproduce: string[];
    expectedResult: string;
    actualResult: string;
    attachments: Attachment[];
    comments: Comment[];
    patches: Patch[];
}
```

### Environment
```typescript
interface Environment {
    kernelVersion: KernelVersion;  // { major, minor, patch, extra?, gitCommit? }
    systemInfo: SystemInfo;        // { architecture, distribution?, cpuModel?, memorySize? }
    loadedModules: string[];
    dmesgExcerpt?: string;
}
```

## Utility Classes

### BugReportBuilder
Fluent API for constructing bug reports:
- `setId()`, `setTitle()`, `setDescription()`
- `setSeverity()`, `setStatus()`, `setComponent()`
- `setKernelVersion(major, minor, patch, extra?, gitCommit?)`
- `setSystemInfo(arch, distribution?, cpuModel?, memorySize?)`
- `addStepToReproduce()`, `setExpectedResult()`, `setActualResult()`
- `setRegression()`, `addKeyword()`, `addTag()`

### BugReportValidator
Validates bug report completeness:
```typescript
const errors = BugReportValidator.validate(report);
```

### BugReportFormatter
Formats reports in multiple formats:
```typescript
const standard = BugReportFormatter.toStandardFormat(report);  // Human-readable
const email = BugReportFormatter.toEmailFormat(report);        // Kernel mailing list format
const json = BugReportFormatter.toJSON(report, true);          // JSON format
```

### BugReportRepository
File-based persistence:
```typescript
const repo = new BugReportRepository({ basePath: './bug-reports' });
repo.save(report);
const loaded = repo.load(report.id);
const allBugs = repo.list();
```

## Sample Report

Use `createSampleBugReport()` to see a complete example:

```typescript
import { createSampleBugReport } from './linux_bug_report';

const sample = createSampleBugReport();
console.log(sample);
```

## File Structure

```
src/
├── linux_bug_report.ts          # Main module (941 lines)
└── linux_bug_report.README.md   # This file
```

## TypeScript Compilation

```bash
npx tsc --noEmit src/linux_bug_report.ts
```

✓ Compiles successfully
