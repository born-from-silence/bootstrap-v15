/**
 * Audio Transcription Workflow Manager
 * Comprehensive orchestration for transcription pipelines
 */

import * as fs from 'fs';
import * as path from 'path';

export interface WorkflowJob {
  id: string;
  filePath: string;
  status: 'pending' | 'uploading' | 'queued' | 'processing' | 'completed' | 'failed';
  transcriptionId?: string;
  language: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  error?: string;
  result?: WorkflowResult;
}

export interface WorkflowResult {
  transcript?: string;
  srtPath?: string;
  jsonPath?: string;
  txtPath?: string;
  metrics?: SpeechAnalysisMetrics;
  processedAt: Date;
}

export interface SpeechAnalysisMetrics {
  wordCount: number;
  speakerCount?: number;
  durationSeconds?: number;
  wordsPerMinute?: number;
  topPhrases: string[];
  silenceRatio: number;
  confidenceScore: number;
}

export interface ExportPlan {
  formats: Array<'txt' | 'srt' | 'vtt' | 'json' | 'docx' | 'pdf'>;
  includeTimestamps: boolean;
  includeSpeakerLabels: boolean;
  outputDir: string;
}

export class TranscriptionWorkflow {
  private jobs: Map<string, WorkflowJob> = new Map();
  private workflowDir: string;

  constructor(workflowDir: string = './transcription_workflow') {
    this.workflowDir = workflowDir;
    if (!fs.existsSync(workflowDir)) {
      fs.mkdirSync(workflowDir, { recursive: true });
    }
  }

  // Create a new transcription job
  createJob(
    filePath: string,
    language: string = 'en',
    name?: string
  ): WorkflowJob {
    const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const job: WorkflowJob = {
      id,
      filePath: path.resolve(filePath),
      status: 'pending',
      language,
      name: name || path.basename(filePath, path.extname(filePath)),
      createdAt: now,
      updatedAt: now
    };

    this.jobs.set(id, job);
    this.persistJob(job);
    
    return job;
  }

  // Get job by ID
  getJob(id: string): WorkflowJob | undefined {
    return this.jobs.get(id);
  }

  // List all jobs
  listJobs(status?: WorkflowJob['status']): WorkflowJob[] {
    const jobs = Array.from(this.jobs.values());
    if (status) {
      return jobs.filter(j => j.status === status);
    }
    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Update job status
  updateJobStatus(
    id: string,
    status: WorkflowJob['status'],
    updates?: Partial<WorkflowJob>
  ): WorkflowJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;

    job.status = status;
    job.updatedAt = new Date();
    
    if (updates) {
      Object.assign(job, updates);
    }

    this.persistJob(job);
    return job;
  }

  // Complete job with results
  completeJob(id: string, result: WorkflowResult): WorkflowJob | undefined {
    return this.updateJobStatus(id, 'completed', { result });
  }

  // Mark job as failed
  failJob(id: string, error: string): WorkflowJob | undefined {
    return this.updateJobStatus(id, 'failed', { error });
  }

  // Delete job
  deleteJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;

    this.jobs.delete(id);
    
    // Clean up persisted file
    const jobPath = path.join(this.workflowDir, `${id}.json`);
    if (fs.existsSync(jobPath)) {
      fs.unlinkSync(jobPath);
    }

    return true;
  }

  // Get all job entries
  private getJobEntries(): Array<[string, WorkflowJob]> {
    return Array.from(this.jobs.entries());
  }

  // Persist job to disk
  private persistJob(job: WorkflowJob): void {
    const jobPath = path.join(this.workflowDir, `${job.id}.json`);
    fs.writeFileSync(jobPath, JSON.stringify(job, null, 2));
  }

  // Load persisted jobs
  loadFromDisk(): void {
    if (!fs.existsSync(this.workflowDir)) return;

    const files = fs.readdirSync(this.workflowDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const jobPath = path.join(this.workflowDir, file);
        try {
          const content = fs.readFileSync(jobPath, 'utf-8');
          const job: WorkflowJob = JSON.parse(content);
          // Restore Date objects
          job.createdAt = new Date(job.createdAt);
          job.updatedAt = new Date(job.updatedAt);
          if (job.result?.processedAt) {
            job.result.processedAt = new Date(job.result.processedAt);
          }
          this.jobs.set(job.id, job);
        } catch (err) {
          console.error(`Failed to load job from ${jobPath}:`, err);
        }
      }
    }
  }

  // Generate export plan
  createExportPlan(
    jobId: string,
    options: Partial<ExportPlan> = {}
  ): ExportPlan {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const outputDir = options.outputDir || path.join(
      this.workflowDir,
      'exports',
      job.id
    );

    return {
      formats: options.formats || ['txt', 'srt', 'json'],
      includeTimestamps: options.includeTimestamps ?? true,
      includeSpeakerLabels: options.includeSpeakerLabels ?? true,
      outputDir
    };
  }

  // Execute export plan
  async executeExportPlan(
    transcriptionId: string,
    plan: ExportPlan
  ): Promise<Record<string, string>> {
    if (!fs.existsSync(plan.outputDir)) {
      fs.mkdirSync(plan.outputDir, { recursive: true });
    }

    const results: Record<string, string> = {};

    for (const format of plan.formats) {
      const outputPath = path.join(plan.outputDir, `transcript.${format}`);
      // This would call the actual export tool
      // Placeholder for implementation
      results[format] = outputPath;
    }

    return results;
  }

  // Generate workflow report
  generateReport(): string {
    const jobs = this.listJobs();
    const summary = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => ['uploading', 'queued', 'processing'].includes(j.status)).length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    };

    const lines = [
      '# Transcription Workflow Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Summary',
      `- Total Jobs: ${summary.total}`,
      `- Pending: ${summary.pending}`,
      `- Processing: ${summary.processing}`,
      `- Completed: ${summary.completed}`,
      `- Failed: ${summary.failed}`,
      '',
      '## Recent Jobs',
    ];

    jobs.slice(0, 10).forEach(job => {
      lines.push(`\n### ${job.name} (${job.id})`);
      lines.push(`- Status: ${job.status}`);
      lines.push(`- Language: ${job.language}`);
      lines.push(`- Created: ${job.createdAt.toISOString()}`);
      lines.push(`- Updated: ${job.updatedAt.toISOString()}`);
      
      if (job.result?.metrics) {
        lines.push(`- Word Count: ${job.result.metrics.wordCount}`);
        lines.push(`- WPM: ${job.result.metrics.wordsPerMinute || 'N/A'}`);
      }
      
      if (job.error) {
        lines.push(`- Error: ${job.error}`);
      }
    });

    return lines.join('\n');
  }

  // Cleanup old jobs
  cleanup(olderThanDays: number = 30): number {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    let deleted = 0;
    for (const [id, job] of Array.from(this.jobs.entries())) {
      if (job.updatedAt < cutoff) {
        this.deleteJob(id);
        deleted++;
      }
    }

    return deleted;
  }
}

// Singleton instance
let workflowInstance: TranscriptionWorkflow | null = null;

export function getWorkflow(): TranscriptionWorkflow {
  if (!workflowInstance) {
    workflowInstance = new TranscriptionWorkflow('./data/transcription_workflow');
    workflowInstance.loadFromDisk();
  }
  return workflowInstance;
}

// Transcript analysis utilities
// Re-export analysis utilities from analysis.ts
export {
  extractKeyPhrases,
  detectSpeakers,
  calculateSpeechMetrics,
  analyzeSentiment,
  extractTimestamps,
  calculateReadingTime,
  findDenseSections,
  summarizeTranscript,
  exportAnalysis
} from './analysis';
