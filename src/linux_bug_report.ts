/**
 * Linux Kernel Bug Report Data Structure
 * 
 * Comprehensive TypeScript definitions and utilities for representing
 * a Linux kernel bug report following standard kernel bug reporting conventions.
 */

import * as fs from 'fs';
import * as path from 'path';

// =============================================================================
// ENUMERATIONS
// =============================================================================

export enum BugSeverity {
    CRITICAL = 'critical',    // System crash, data corruption
    HIGH = 'high',            // Major functionality broken
    MEDIUM = 'medium',          // Minor functionality broken
    LOW = 'low',              // Cosmetic issues
}

export enum BugStatus {
    NEW = 'new',              // Just reported
    CONFIRMED = 'confirmed',      // Reproduced by maintainer
    IN_PROGRESS = 'in_progress',  // Being worked on
    NEEDS_INFO = 'needs_info',    // Waiting for reporter
    RESOLVED = 'resolved',        // Fix available
    CLOSED = 'closed',          // Fixed or wontfix
}

export enum BugResolution {
    FIXED = 'fixed',            // Bug is fixed
    DUPLICATE = 'duplicate',      // Same as another bug
    WONT_FIX = 'wont_fix',        // Not going to fix
    NOT_A_BUG = 'not_a_bug',      // Works as intended
    CANT_REPRODUCE = 'cant_reproduce', // Cannot reproduce
}

export enum Architecture {
    X86_64 = 'x86_64',
    I386 = 'i386',
    ARM64 = 'arm64',
    ARM = 'arm',
    RISCV = 'riscv',
    MIPS = 'mips',
    POWERPC = 'powerpc',
    S390 = 's390',
    SPARC = 'sparc',
}

export enum Component {
    KERNEL = 'kernel',
    MM = 'mm',                // Memory Management
    SCHEDULER = 'scheduler',
    FILESYSTEM = 'fs',        // Filesystems
    NETWORK = 'net',          // Networking
    PCI = 'pci',
    USB = 'usb',
    SCSI = 'scsi',
    BLOCK = 'block',
    DRM = 'drm',              // Direct Rendering
    SOUND = 'sound',
    ACPI = 'acpi',
    POWER = 'power',
    INPUT = 'input',
    SECURITY = 'security',
    SELINUX = 'selinux',
    BTRFS = 'btrfs',
    EXT4 = 'ext4',
    XFS = 'xfs',
    VFS = 'vfs',              // Virtual Filesystem
}

// =============================================================================
// INTERFACES
// =============================================================================

export interface KernelVersion {
    major: number;
    minor: number;
    patch: number;
    extra?: string;           // e.g., "-rc1", "-generic"
    gitCommit?: string;       // Git commit hash
}

export interface SystemInfo {
    architecture: Architecture;
    distribution?: string;    // e.g., "Ubuntu 22.04", "Fedora 37"
    cpuModel?: string;
    memorySize?: string;      // e.g., "16GB"
    bootParameters?: string[];
}

export interface Environment {
    kernelVersion: KernelVersion;
    systemInfo: SystemInfo;
    compilerVersion?: string; // GCC/Clang version
    configFile?: string;      // Path to kernel config
    loadedModules: string[];
    dmesgExcerpt?: string;   // Relevant dmesg output
}

export interface RegressionInfo {
    isRegression: boolean;
    workingVersion?: KernelVersion;
    firstBadVersion?: KernelVersion;
    bisectedCommit?: string;
}

export interface Attachment {
    id: string;
    filename: string;
    description: string;
    contentType: string;
    size: number;
    data?: Buffer;            // Binary data
    path?: string;            // File path if stored locally
}

export interface Comment {
    id: string;
    author: string;
    email: string;
    timestamp: Date;
    content: string;
    isMaintainerComment: boolean;
}

export interface Patch {
    id: string;
    title: string;
    author: string;
    email: string;
    timestamp: Date;
    content: string;          // The actual patch text
    applied: boolean;
    commitHash?: string;      // If applied
}

export interface Reporter {
    name: string;
    email: string;
    isMaintainer: boolean;
    expertiseLevel: 'novice' | 'intermediate' | 'expert';
}

export interface LinuxKernelBugReport {
    // Core identification
    id: string;               // Bug tracking ID
    title: string;
    description: string;

    // Classification
    severity: BugSeverity;
    status: BugStatus;
    resolution?: BugResolution;
    component: Component;
    subComponent?: string;

    // People
    reporter: Reporter;
    assignedTo?: string;
    cc: string[];             // Mailing list

    // Environment
    environment: Environment;

    // Regression info
    regression: RegressionInfo;

    // Timeline
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;

    // Content
    stepsToReproduce: string[];
    expectedResult: string;
    actualResult: string;

    // Attachments
    attachments: Attachment[];

    // Discussion
    comments: Comment[];

    // Patches
    patches: Patch[];

    // References
    relatedBugs: string[];    // IDs of related reports
    upstreamCommit?: string;    // Fix commit in upstream

    // Metadata
    tags: string[];
    keywords: string[];
}

// =============================================================================
// ERROR CLASSES
// =============================================================================

export class BugReportError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BugReportError';
    }
}

export class ValidationError extends BugReportError {
    public validationErrors: string[];

    constructor(errors: string[]) {
        super(`Validation failed: ${errors.join(', ')}`);
        this.name = 'ValidationError';
        this.validationErrors = errors;
    }
}

export class AttachmentError extends BugReportError {
    constructor(message: string) {
        super(`Attachment error: ${message}`);
        this.name = 'AttachmentError';
    }
}

// =============================================================================
// VALIDATOR CLASS
// =============================================================================

export class BugReportValidator {
    static validate(report: LinuxKernelBugReport): string[] {
        const errors: string[] = [];

        // Required fields
        if (!report.id?.trim()) errors.push('ID is required');
        if (!report.title?.trim()) errors.push('Title is required');
        if (!report.description?.trim()) errors.push('Description is required');

        // Environment validation
        if (!report.environment) {
            errors.push('Environment is required');
        } else {
            const env = report.environment;
            
            // Kernel version validation
            if (!env.kernelVersion) {
                errors.push('Kernel version is required');
            } else {
                const kv = env.kernelVersion;
                if (kv.major === undefined || kv.major < 0) {
                    errors.push('Kernel major version must be a non-negative number');
                }
                if (kv.minor === undefined || kv.minor < 0) {
                    errors.push('Kernel minor version must be a non-negative number');
                }
                if (kv.patch === undefined || kv.patch < 0) {
                    errors.push('Kernel patch version must be a non-negative number');
                }
            }

            // System info validation
            if (!env.systemInfo?.architecture) {
                errors.push('System architecture is required');
            }

            if (!env.loadedModules || env.loadedModules.length === 0) {
                errors.push('At least one loaded module should be listed');
            }
        }

        // Steps to reproduce
        if (!report.stepsToReproduce || report.stepsToReproduce.length === 0) {
            errors.push('At least one step to reproduce is required');
        }

        // Results
        if (!report.expectedResult?.trim()) {
            errors.push('Expected result is required');
        }
        if (!report.actualResult?.trim()) {
            errors.push('Actual result is required');
        }

        // Reporter validation
        if (!report.reporter?.name?.trim()) errors.push('Reporter name is required');
        if (!report.reporter?.email?.trim()) {
            errors.push('Reporter email is required');
        } else if (!this.isValidEmail(report.reporter.email)) {
            errors.push('Reporter email format is invalid');
        }

        // Email validation for CC list
        report.cc.forEach((email, index) => {
            if (!this.isValidEmail(email)) {
                errors.push(`CC email at index ${index} is invalid: ${email}`);
            }
        });

        return errors;
    }

    static isValid(email: string): boolean {
        return this.isValidEmail(email);
    }

    private static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

// =============================================================================
// FORMATTER CLASS
// =============================================================================

export class BugReportFormatter {
    /**
     * Format the bug report in standard Linux kernel bug report style
     */
    static toStandardFormat(report: LinuxKernelBugReport): string {
        const lines: string[] = [];

        // Header
        lines.push('=============================================================================');
        lines.push('LINUX KERNEL BUG REPORT');
        lines.push('=============================================================================');
        lines.push(`  Bug ID:      ${report.id}`);
        lines.push(`  Status:      ${report.status}${report.resolution ? ` (${report.resolution})` : ''}`);
        lines.push(`  Severity:    ${report.severity}`);
        lines.push(`  Component:   ${report.component}${report.subComponent ? `/${report.subComponent}` : ''}`);
        lines.push(`  Created:     ${report.createdAt.toISOString()}`);
        lines.push(`  Updated:     ${report.updatedAt.toISOString()}`);
        if (report.resolvedAt) {
            lines.push(`  Resolved:    ${report.resolvedAt.toISOString()}`);
        }
        lines.push('=============================================================================');
        lines.push('');

        // Reporter
        lines.push('REPORTER');
        lines.push('---------');
        lines.push(`  Name:        ${report.reporter.name}`);
        lines.push(`  Email:       ${report.reporter.email}`);
        lines.push(`  Expertise:   ${report.reporter.expertiseLevel}`);
        lines.push('');

        // Title
        lines.push('TITLE');
        lines.push('-----');
        lines.push(report.title);
        lines.push('');

        // Description
        lines.push('DESCRIPTION');
        lines.push('-----------');
        lines.push(report.description);
        lines.push('');

        // Environment
        lines.push('ENVIRONMENT');
        lines.push('-----------');
        const env = report.environment;
        const kv = env.kernelVersion;
        lines.push(`  Kernel:      ${kv.major}.${kv.minor}.${kv.patch}${kv.extra || ''}`);
        if (kv.gitCommit) {
            lines.push(`  Git Commit:  ${kv.gitCommit}`);
        }
        lines.push(`  Arch:        ${env.systemInfo.architecture}`);
        if (env.systemInfo.distribution) {
            lines.push(`  Distro:      ${env.systemInfo.distribution}`);
        }
        if (env.systemInfo.cpuModel) {
            lines.push(`  CPU:         ${env.systemInfo.cpuModel}`);
        }
        if (env.systemInfo.memorySize) {
            lines.push(`  Memory:      ${env.systemInfo.memorySize}`);
        }
        if (env.compilerVersion) {
            lines.push(`  Compiler:    ${env.compilerVersion}`);
        }
        lines.push('');

        // Loaded modules
        lines.push('LOADED MODULES');
        lines.push('--------------');
        env.loadedModules.forEach(mod => lines.push(`  - ${mod}`));
        lines.push('');

        // Regression info
        if (report.regression.isRegression) {
            lines.push('REGRESSION INFO');
            lines.push('---------------');
            lines.push(`  This IS a regression`);
            if (report.regression.workingVersion) {
                const wv = report.regression.workingVersion;
                lines.push(`  Last known good: ${wv.major}.${wv.minor}.${wv.patch}${wv.extra || ''}`);
            }
            if (report.regression.firstBadVersion) {
                const fbv = report.regression.firstBadVersion;
                lines.push(`  First bad:       ${fbv.major}.${fbv.minor}.${fbv.patch}${fbv.extra || ''}`);
            }
            if (report.regression.bisectedCommit) {
                lines.push(`  Bisected to:     ${report.regression.bisectedCommit}`);
            }
            lines.push('');
        }

        // Steps to reproduce
        lines.push('STEPS TO REPRODUCE');
        lines.push('------------------');
        report.stepsToReproduce.forEach((step, index) => {
            lines.push(`  ${index + 1}. ${step}`);
        });
        lines.push('');

        // Results
        lines.push('EXPECTED RESULT');
        lines.push('---------------');
        lines.push(report.expectedResult);
        lines.push('');
        lines.push('ACTUAL RESULT');
        lines.push('-------------');
        lines.push(report.actualResult);
        lines.push('');

        // dmesg excerpt
        if (env.dmesgExcerpt) {
            lines.push('DMESG EXCERPT');
            lines.push('-------------');
            lines.push(env.dmesgExcerpt);
            lines.push('');
        }

        // Attachments
        if (report.attachments.length > 0) {
            lines.push('ATTACHMENTS');
            lines.push('-----------');
            report.attachments.forEach(att => {
                lines.push(`  [${att.id}] ${att.filename} (${att.size} bytes)`);
                lines.push(`    ${att.description}`);
            });
            lines.push('');
        }

        // Comments
        if (report.comments.length > 0) {
            lines.push('COMMENTS');
            lines.push('--------');
            report.comments.forEach(comment => {
                lines.push(`  From: ${comment.author} <${comment.email}>`);
                lines.push(`  Date: ${comment.timestamp.toISOString()}`);
                if (comment.isMaintainerComment) {
                    lines.push('  [MAINTAINER]');
                }
                lines.push('');
                const contentLines = comment.content.split('\n');
                contentLines.forEach(line => lines.push(`  > ${line}`));
                lines.push('');
            });
        }

        // Patches
        if (report.patches.length > 0) {
            lines.push('PATCHES');
            lines.push('-------');
            report.patches.forEach(patch => {
                lines.push(`  [${patch.applied ? 'APPLIED' : 'PENDING'}] ${patch.title}`);
                lines.push(`  by ${patch.author} <${patch.email}>`);
                if (patch.commitHash) {
                    lines.push(`  Commit: ${patch.commitHash}`);
                }
                lines.push('');
            });
        }

        // Related bugs
        if (report.relatedBugs.length > 0) {
            lines.push('RELATED BUGS');
            lines.push('------------');
            report.relatedBugs.forEach(bugId => lines.push(`  - ${bugId}`));
            lines.push('');
        }

        // Keywords
        if (report.keywords.length > 0) {
            lines.push('KEYWORDS');
            lines.push('--------');
            lines.push(report.keywords.join(', '));
            lines.push('');
        }

        // Footer
        lines.push('=============================================================================');
        lines.push(`Generated: ${new Date().toISOString()}`);
        lines.push('=============================================================================');

        return lines.join('\n');
    }

    /**
     * Generate a minimal email-bugs@kernel.org format
     */
    static toEmailFormat(report: LinuxKernelBugReport): string {
        const lines: string[] = [];

        lines.push(`Subject: [BUG] ${report.component}: ${report.title}`);
        lines.push(`To: linux-${report.component}@vger.kernel.org`);
        if (report.cc.length > 0) {
            lines.push(`Cc: ${report.cc.join(', ')}`);
        }
        lines.push('');
        lines.push(report.description);
        lines.push('');
        lines.push('Environment:');
        const env = report.environment;
        const kv = env.kernelVersion;
        lines.push(`  Kernel: ${kv.major}.${kv.minor}.${kv.patch}${kv.extra || ''}`);
        lines.push(`  Architecture: ${env.systemInfo.architecture}`);
        lines.push('');
        lines.push('Steps to reproduce:');
        report.stepsToReproduce.forEach((step, index) => {
            lines.push(`  ${index + 1}. ${step}`);
        });
        lines.push('');
        lines.push('Expected result:');
        lines.push(report.expectedResult);
        lines.push('');
        lines.push('Actual result:');
        lines.push(report.actualResult);
        lines.push('');

        if (report.regression.isRegression) {
            lines.push('Regression: Yes');
            if (report.regression.workingVersion) {
                const wv = report.regression.workingVersion;
                lines.push(`Last known working: ${wv.major}.${wv.minor}.${wv.patch}`);
            }
        }

        return lines.join('\n');
    }

    /**
     * Format as JSON for API/structured storage
     */
    static toJSON(report: LinuxKernelBugReport, pretty: boolean = true): string {
        return JSON.stringify(report, (key, value) => {
            // Convert Buffer to base64 for JSON serialization
            if (Buffer.isBuffer(value)) {
                return { __type: 'Buffer', data: value.toString('base64') };
            }
            return value;
        }, pretty ? 2 : undefined);
    }
}

// =============================================================================
// BUILDER CLASS
// =============================================================================

export class BugReportBuilder {
    private report: Partial<LinuxKernelBugReport>;

    constructor() {
        const now = new Date();
        this.report = {
            id: this.generateId(),
            createdAt: now,
            updatedAt: now,
            severity: BugSeverity.MEDIUM,
            status: BugStatus.NEW,
            component: Component.KERNEL,
            cc: [],
            attachments: [],
            comments: [],
            patches: [],
            relatedBugs: [],
            tags: [],
            keywords: [],
            regression: { isRegression: false },
            reporter: {
                name: '',
                email: '',
                isMaintainer: false,
                expertiseLevel: 'intermediate'
            },
            environment: {
                kernelVersion: { major: 0, minor: 0, patch: 0 },
                systemInfo: {
                    architecture: Architecture.X86_64,
                },
                loadedModules: [],
            },
            stepsToReproduce: [],
            expectedResult: '',
            actualResult: '',
        };
    }

    private generateId(): string {
        const date = new Date();
        const random = Math.floor(Math.random() * 10000);
        return `LKBG-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}-${random}`;
    }

    setId(id: string): BugReportBuilder {
        this.report.id = id;
        return this;
    }

    setTitle(title: string): BugReportBuilder {
        this.report.title = title;
        return this;
    }

    setDescription(description: string): BugReportBuilder {
        this.report.description = description;
        return this;
    }

    setSeverity(severity: BugSeverity): BugReportBuilder {
        this.report.severity = severity;
        return this;
    }

    setStatus(status: BugStatus): BugReportBuilder {
        this.report.status = status;
        return this;
    }

    setResolution(resolution: BugResolution): BugReportBuilder {
        this.report.resolution = resolution;
        return this;
    }

    setComponent(component: Component, subComponent?: string): BugReportBuilder {
        this.report.component = component;
        if (subComponent) {
            this.report.subComponent = subComponent;
        }
        return this;
    }

    setReporter(name: string, email: string, expertise: Reporter['expertiseLevel'] = 'intermediate'): BugReportBuilder {
        this.report.reporter = {
            name,
            email,
            isMaintainer: false,
            expertiseLevel: expertise
        };
        return this;
    }

    setAssignee(assignee: string): BugReportBuilder {
        this.report.assignedTo = assignee;
        return this;
    }

    addCCEmail(email: string): BugReportBuilder {
        this.report.cc!.push(email);
        return this;
    }

    setKernelVersion(major: number, minor: number, patch: number, extra?: string, gitCommit?: string): BugReportBuilder {
        this.report.environment!.kernelVersion = { major, minor, patch, extra, gitCommit };
        return this;
    }

    setSystemInfo(arch: Architecture, distribution?: string, cpuModel?: string, memorySize?: string): BugReportBuilder {
        this.report.environment!.systemInfo = {
            architecture: arch,
            distribution,
            cpuModel,
            memorySize
        };
        return this;
    }

    setBootParameters(params: string[]): BugReportBuilder {
        this.report.environment!.systemInfo.bootParameters = params;
        return this;
    }

    setCompilerVersion(version: string): BugReportBuilder {
        this.report.environment!.compilerVersion = version;
        return this;
    }

    setConfigFile(path: string): BugReportBuilder {
        this.report.environment!.configFile = path;
        return this;
    }

    addLoadedModule(module: string): BugReportBuilder {
        this.report.environment!.loadedModules.push(module);
        return this;
    }

    setDmesgExcerpt(dmesg: string): BugReportBuilder {
        this.report.environment!.dmesgExcerpt = dmesg;
        return this;
    }

    setRegression(isRegression: boolean, workingVersion?: KernelVersion, firstBadVersion?: KernelVersion, bisectedCommit?: string): BugReportBuilder {
        this.report.regression = {
            isRegression,
            workingVersion,
            firstBadVersion,
            bisectedCommit
        };
        return this;
    }

    addStepToReproduce(step: string): BugReportBuilder {
        this.report.stepsToReproduce!.push(step);
        return this;
    }

    setExpectedResult(result: string): BugReportBuilder {
        this.report.expectedResult = result;
        return this;
    }

    setActualResult(result: string): BugReportBuilder {
        this.report.actualResult = result;
        return this;
    }

    addKeyword(keyword: string): BugReportBuilder {
        this.report.keywords!.push(keyword);
        return this;
    }

    addTag(tag: string): BugReportBuilder {
        this.report.tags!.push(tag);
        return this;
    }

    addRelatedBug(bugId: string): BugReportBuilder {
        this.report.relatedBugs!.push(bugId);
        return this;
    }

    setUpstreamCommit(commit: string): BugReportBuilder {
        this.report.upstreamCommit = commit;
        return this;
    }

    /**
     * Validate and build the bug report
     */
    build(): LinuxKernelBugReport {
        const errors = BugReportValidator.validate(this.report as LinuxKernelBugReport);
        if (errors.length > 0) {
            throw new ValidationError(errors);
        }
        return this.report as LinuxKernelBugReport;
    }
}

// =============================================================================
// REPOSITORY CLASS (File-based persistence)
// =============================================================================

export interface BugReportRepositoryOptions {
    basePath: string;
}

export class BugReportRepository {
    private basePath: string;

    constructor(options: BugReportRepositoryOptions) {
        this.basePath = options.basePath;
        this.ensureDirectory();
    }

    private ensureDirectory(): void {
        if (!fs.existsSync(this.basePath)) {
            fs.mkdirSync(this.basePath, { recursive: true });
        }
    }

    private getReportPath(id: string): string {
        return path.join(this.basePath, `${id}.json`);
    }

    private getAttachmentDir(id: string): string {
        return path.join(this.basePath, id, 'attachments');
    }

    save(report: LinuxKernelBugReport): void {
        const filePath = this.getReportPath(report.id);
        const json = BugReportFormatter.toJSON(report, true);
        fs.writeFileSync(filePath, json, 'utf-8');
    }

    load(id: string): LinuxKernelBugReport | null {
        const filePath = this.getReportPath(id);
        if (!fs.existsSync(filePath)) {
            return null;
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content, (key, value) => {
            // Restore Buffer from base64
            if (value && typeof value === 'object' && value.__type === 'Buffer') {
                return Buffer.from(value.data, 'base64');
            }
            // Restore Date objects
            if (key === 'timestamp' || key === 'createdAt' || key === 'updatedAt' || key === 'resolvedAt') {
                return value ? new Date(value) : value;
            }
            return value;
        });

        return parsed as LinuxKernelBugReport;
    }

    delete(id: string): boolean {
        const filePath = this.getReportPath(id);
        const attachmentDir = path.join(this.basePath, id);
        
        let deleted = false;

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deleted = true;
        }

        // Also remove attachment directory if exists
        if (fs.existsSync(attachmentDir)) {
            fs.rmSync(attachmentDir, { recursive: true, force: true });
        }

        return deleted;
    }

    list(): string[] {
        if (!fs.existsSync(this.basePath)) {
            return [];
        }
        return fs.readdirSync(this.basePath)
            .filter(f => f.endsWith('.json'))
            .map(f => path.basename(f, '.json'));
    }

    saveAttachment(bugId: string, attachment: Attachment, data: Buffer): void {
        const attachmentDir = this.getAttachmentDir(bugId);
        fs.mkdirSync(attachmentDir, { recursive: true });
        
        const filePath = path.join(attachmentDir, attachment.filename);
        fs.writeFileSync(filePath, data);
    }

    loadAttachment(bugId: string, filename: string): Buffer | null {
        const filePath = path.join(this.getAttachmentDir(bugId), filename);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        return fs.readFileSync(filePath);
    }
}

// =============================================================================
// SAMPLE DATA GENERATOR
// =============================================================================

export function createSampleBugReport(): LinuxKernelBugReport {
    return new BugReportBuilder()
        .setId('LKBG-202503-1234')
        .setTitle('Kernel panic when unplugging USB storage device')
        .setDescription(
            'When unplugging a USB mass storage device without properly unmounting it, ' +
            'the kernel panics with an Oops in the SCSI subsystem. This appears to be a ' +
            'race condition between device removal and ongoing I/O operations.'
        )
        .setSeverity(BugSeverity.HIGH)
        .setStatus(BugStatus.NEW)
        .setComponent(Component.USB, 'storage')
        .setReporter('John Developer', 'johndev@example.com', 'expert')
        .setAssignee('USB Storage Maintainer')
        .addCCEmail('linux-usb@vger.kernel.org')
        .addCCEmail('linux-scsi@vger.kernel.org')
        .setKernelVersion(6, 7, 2, '-generic', '1a2b3c4d5e6f7890')
        .setSystemInfo(Architecture.X86_64, 'Ubuntu 22.04', 'Intel Core i7-12700K', '32GB')
        .setCompilerVersion('gcc version 12.3.0')
        .addLoadedModule('usb_storage')
        .addLoadedModule('uas')
        .addLoadedModule('scsi_mod')
        .addLoadedModule('sd_mod')
        .setDmesgExcerpt(
            '[  123.456789] usb 2-1: USB disconnect, device number 3\n' +
            '[  123.456790] sd 2:0:0:0: [sdb] Synchronizing SCSI cache\n' +
            '[  123.456799] BUG: unable to handle page fault for address: 0000000000001234\n' +
            '[  123.456800] Oops: 0000 [#1] PREEMPT SMP NOPTI\n' +
            '[  123.456801] CPU: 7 PID: 1234 Comm: kworker/u16:3 Not tainted 6.7.2-generic'
        )
        .setRegression(true, { major: 6, minor: 6, patch: 12 }, { major: 6, minor: 7, patch: 0 })
        .addStepToReproduce('Connect USB storage device (tested with SanDisk Extreme Pro)')
        .addStepToReproduce('Mount the device: mount /dev/sdb1 /mnt')
        .addStepToReproduce('Start a large file copy to the device')
        .addStepToReproduce('While copy is in progress, unplug the USB device')
        .addStepToReproduce('Observe kernel panic')
        .setExpectedResult(
            'The device should be safely removed, or at worst the filesystem should be marked ' +
            'as dirty. No kernel panic should occur.'
        )
        .setActualResult(
            'Kernel panic occurs with Oops in scsi_softirq_done. System becomes unresponsive ' +
            'and requires hard reboot.'
        )
        .addKeyword('usb')
        .addKeyword('storage')
        .addKeyword('panic')
        .addKeyword('race-condition')
        .addTag('regression')
        .addTag('needs-bisect')
        .addRelatedBug('LKBG-202503-1000')
        .build();
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
    BugSeverity,
    BugStatus,
    BugResolution,
    Architecture,
    Component,
    BugReportValidator,
    BugReportFormatter,
    BugReportBuilder,
    BugReportRepository,
    createSampleBugReport,
};

// Note: All types are already exported above via 'export interface'
// No duplicate type exports needed
