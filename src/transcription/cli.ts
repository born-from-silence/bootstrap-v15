#!/usr/bin/env node
/**
 * Audio Transcription CLI
 * Command-line interface for transcription workflow
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  getWorkflow,
  TranscriptionWorkflow,
  type WorkflowJob,
  type ExportPlan
} from './workflow';

interface CLIArgs {
  command: string;
  filePath: string | undefined;
  language: string | undefined;
  name: string | undefined;
  jobId: string | undefined;
  format: string | undefined;
  outputDir: string | undefined;
  timestamps: boolean | undefined;
  speakers: boolean | undefined;
  limit: number | undefined;
}

function printHelp(): void {
  console.log(`
Audio Transcription CLI

Commands:
  upload <file> [options]    Upload audio file for transcription
  status <jobId>             Check transcription status
  export <jobId> [options]   Export completed transcription
  list [options]             List all transcription jobs
  report                     Generate workflow report
  analyze <jobId>            Analyze completed transcription
  cancel <jobId>             Cancel/delete a job
  cleanup <days>             Remove jobs older than N days

Upload Options:
  -l, --language <code>      Language code (default: en)
  -n, --name <name>          Custom name for transcription
  -h, --help                 Show this help message

Export Options:
  -f, --format <formats>     Comma-separated formats (txt,srt,json)
  -o, --output <dir>         Output directory
  -t, --timestamps          Include timestamps
  -s, --speakers            Include speaker labels
  --limit <num>             Maximum jobs to list

Examples:
  npx tsx src/transcription/cli.ts upload interview.mp3 --language en
  npx tsx src/transcription/cli.ts status job_1234567890
  npx tsx src/transcription/cli.ts export job_1234567890 --format txt,json,srt
  npx tsx src/transcription/cli.ts list --limit 20
`);
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
    printHelp();
    process.exit(0);
  }

  const command = args[0]!;
  const options: CLIArgs = { command, filePath: undefined, language: undefined, name: undefined, jobId: undefined, format: undefined, outputDir: undefined, timestamps: undefined, speakers: undefined, limit: undefined };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '-l':
      case '--language':
        if (next) options.language = next;
        i++;
        break;
      case '-n':
      case '--name':
        if (next) options.name = next;
        i++;
        break;
      case '-f':
      case '--format':
        if (next) options.format = next;
        i++;
        break;
      case '-o':
      case '--output':
        if (next) options.outputDir = next;
        i++;
        break;
      case '-t':
      case '--timestamps':
        options.timestamps = true;
        break;
      case '-s':
      case '--speakers':
        options.speakers = true;
        break;
      case '--limit':
        if (next) options.limit = parseInt(next) || undefined;
        i++;
        break;
      default:
        if (arg && !arg.startsWith('-') && !options.filePath && !options.jobId) {
          if (command === 'upload') {
            options.filePath = arg;
          } else if (['status', 'export', 'cancel', 'analyze'].includes(command)) {
            options.jobId = arg;
          } else if (command === 'cleanup' && next) {
            options.limit = parseInt(next) || undefined;
          }
        }
        break;
    }
  }

  return options;
}

// Format job status for display
function formatJob(job: WorkflowJob): string {
  const lines = [
    `Job: ${job.name}`,
    `  ID: ${job.id}`,
    `  Status: ${job.status}`,
    `  Language: ${job.language}`,
    `  File: ${path.basename(job.filePath)}`,
    `  Created: ${job.createdAt.toLocaleString()}`,
    `  Updated: ${job.updatedAt.toLocaleString()}`
  ];

  if (job.transcriptionId) {
    lines.push(`  Transcription ID: ${job.transcriptionId}`);
  }

  if (job.result) {
    lines.push(`  Result:`);
    if (job.result.metrics) {
      lines.push(`    - Word Count: ${job.result.metrics.wordCount}`);
      lines.push(`    - Duration: ${formatDuration(job.result.metrics.durationSeconds)}`);
      lines.push(`    - WPM: ${job.result.metrics.wordsPerMinute?.toFixed(1) ?? 'N/A'}`);
    }
    if (job.result.txtPath) {
      lines.push(`    - Text: ${job.result.txtPath}`);
    }
    if (job.result.srtPath) {
      lines.push(`    - SRT: ${job.result.srtPath}`);
    }
  }

  if (job.error) {
    lines.push(`  Error: ${job.error}`);
  }

  return lines.join('\n');
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return 'Unknown';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

// Command handlers
async function handleUpload(args: CLIArgs): Promise<void> {
  if (!args.filePath) {
    console.error('Error: File path required');
    process.exit(1);
  }

  if (!fs.existsSync(args.filePath)) {
    console.error(`Error: File not found: ${args.filePath}`);
    process.exit(1);
  }

  const workflow = getWorkflow();
  const job = workflow.createJob(
    args.filePath,
    args.language || 'en',
    args.name
  );

  console.log('Created transcription job:');
  console.log(formatJob(job));
  console.log('\nNext steps:');
  console.log(`  1. Use Sonix API to upload: sonix_upload("${args.filePath}")`);
  console.log(`  2. Update job status: Transcription job ${job.id} created`);
  console.log(`  3. Monitor: status ${job.id}`);
}

async function handleStatus(args: CLIArgs): Promise<void> {
  if (!args.jobId) {
    console.error('Error: Job ID required');
    process.exit(1);
  }

  const workflow = getWorkflow();
  const job = workflow.getJob(args.jobId);

  if (!job) {
    console.error(`Error: Job ${args.jobId} not found`);
    process.exit(1);
  }

  console.log(formatJob(job));

  if (job.status === 'processing' && job.transcriptionId) {
    console.log(`\nTo check Sonix status: sonix_get_status("${job.transcriptionId}")`);
  }
}

async function handleList(args: CLIArgs): Promise<void> {
  const workflow = getWorkflow();
  const jobs = workflow.listJobs();
  const limit = args.limit ?? 20;

  console.log(`Showing ${Math.min(jobs.length, limit)} of ${jobs.length} jobs:\n`);

  for (const job of jobs.slice(0, limit)) {
    console.log(formatJob(job));
    console.log('');
  }
}

async function handleReport(): Promise<void> {
  const workflow = getWorkflow();
  console.log(workflow.generateReport());
}

async function handleExport(args: CLIArgs): Promise<void> {
  if (!args.jobId) {
    console.error('Error: Job ID required');
    process.exit(1);
  }

  const workflow = getWorkflow();
  const job = workflow.getJob(args.jobId);

  if (!job) {
    console.error(`Error: Job ${args.jobId} not found`);
    process.exit(1);
  }

  if (job.status !== 'completed') {
    console.error(`Error: Job is ${job.status}, not completed`);
    process.exit(1);
  }

  if (!job.transcriptionId) {
    console.error('Error: No transcription ID available');
    process.exit(1);
  }

  const formats = (args.format ?? 'txt,json')
    .split(',')
    .map(f => f.trim()) as ExportPlan['formats'];

  const plan: ExportPlan = {
    formats,
    includeTimestamps: args.timestamps ?? true,
    includeSpeakerLabels: args.speakers ?? true,
    outputDir: args.outputDir ?? `./exports/${args.jobId}`
  };

  console.log('Export Configuration:');
  console.log(`  Job: ${job.name}`);
  console.log(`  Transcription ID: ${job.transcriptionId}`);
  console.log(`  Formats: ${plan.formats.join(', ')}`);
  console.log(`  Include timestamps: ${plan.includeTimestamps}`);
  console.log(`  Include speakers: ${plan.includeSpeakerLabels}`);
  console.log(`  Output: ${plan.outputDir}`);
  console.log('\nTo export, use:');
  
  for (const format of plan.formats) {
    console.log(`  sonix_export("${job.transcriptionId}", "${format}")`);
  }
}

async function handleAnalyze(args: CLIArgs): Promise<void> {
  if (!args.jobId) {
    console.error('Error: Job ID required');
    process.exit(1);
  }

  const workflow = getWorkflow();
  const job = workflow.getJob(args.jobId);

  if (!job) {
    console.error(`Error: Job ${args.jobId} not found`);
    process.exit(1);
  }

  if (!job.result?.txtPath || !fs.existsSync(job.result.txtPath)) {
    console.error('Error: Transcript file not available');
    process.exit(1);
  }

  const transcript = fs.readFileSync(job.result.txtPath, 'utf-8');
  
  // Simple analysis
  const words = transcript.split(/\s+/).filter(w => w.length > 0);
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^\w]/g, '')));
  
  // Word frequency
  const wordFreq: Record<string, number> = {};
  words.forEach(w => {
    const clean = w.toLowerCase().replace(/[^\w]/g, '');
    if (clean.length > 3) {
      wordFreq[clean] = (wordFreq[clean] ?? 0) + 1;
    }
  });

  const topWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  console.log('Transcript Analysis');
  console.log('=' .repeat(50));
  console.log(`\nJob: ${job.name}`);
  console.log(`Language: ${job.language}`);
  console.log(`\nContent Metrics:`);
  console.log(`  Total Words: ${words.length.toLocaleString()}`);
  console.log(`  Unique Words: ${uniqueWords.size.toLocaleString()}`);
  console.log(`  Sentences: ${sentences.length.toLocaleString()}`);
  console.log(`  Average Words per Sentence: ${(words.length / sentences.length).toFixed(1)}`);
  
  if (job.result.metrics) {
    console.log(`\nAudio Metrics:`);
    console.log(`  Duration: ${formatDuration(job.result.metrics.durationSeconds)}`);
    console.log(`  Words per Minute: ${job.result.metrics.wordsPerMinute?.toFixed(1) ?? 'N/A'}`);
    if (job.result.metrics.speakerCount) {
      console.log(`  Speakers: ${job.result.metrics.speakerCount}`);
    }
  }

  console.log(`\nTop Words:`);
  topWords.forEach(([word, count]) => {
    console.log(`  ${word}: ${count}`);
  });
}

async function handleCancel(args: CLIArgs): Promise<void> {
  if (!args.jobId) {
    console.error('Error: Job ID required');
    process.exit(1);
  }

  const workflow = getWorkflow();
  const success = workflow.deleteJob(args.jobId);

  if (success) {
    console.log(`Job ${args.jobId} deleted successfully`);
  } else {
    console.error(`Job ${args.jobId} not found`);
    process.exit(1);
  }
}

async function handleCleanup(args: CLIArgs): Promise<void> {
  const days = args.limit ?? 30;
  const workflow = getWorkflow();
  const deleted = workflow.cleanup(days);
  console.log(`Deleted ${deleted} jobs older than ${days} days`);
}

// Main
async function main(): Promise<void> {
  const args = parseArgs();
  const workflow = getWorkflow();
  workflow.loadFromDisk();

  try {
    switch (args.command) {
      case 'upload':
        await handleUpload(args);
        break;
      case 'status':
        await handleStatus(args);
        break;
      case 'list':
        await handleList(args);
        break;
      case 'report':
        await handleReport();
        break;
      case 'export':
        await handleExport(args);
        break;
      case 'analyze':
        await handleAnalyze(args);
        break;
      case 'cancel':
        await handleCancel(args);
        break;
      case 'cleanup':
        await handleCleanup(args);
        break;
      default:
        console.error(`Unknown command: ${args.command}`);
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { parseArgs, printHelp };
