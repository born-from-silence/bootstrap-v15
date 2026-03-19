import * as fs from 'fs';
import * as path from 'path';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import {
  TranscriptionWorkflow,
  type WorkflowJob,
  type WorkflowResult
} from '../workflow';
import {
  extractKeyPhrases,
  detectSpeakers,
  calculateSpeechMetrics
} from '../analysis';

// Test suite for TranscriptionWorkflow
describe('TranscriptionWorkflow', () => {
  let workflow: TranscriptionWorkflow;
  const testDir = './test-transcription-workflow';

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    workflow = new TranscriptionWorkflow(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Job Lifecycle', () => {
    test('should create a new job', () => {
      const job = workflow.createJob('/path/to/audio.mp3', 'en', 'Test Audio');
      
      expect(job).toBeDefined();
      expect(job.id).toMatch(/^job_\d+_[a-z0-9]+$/);
      expect(job.filePath).toBe('/path/to/audio.mp3');
      expect(job.language).toBe('en');
      expect(job.name).toBe('Test Audio');
      expect(job.status).toBe('pending');
      expect(job.createdAt).toBeInstanceOf(Date);
      expect(job.updatedAt).toBeInstanceOf(Date);
    });

    test('should use filename as default name', () => {
      const job = workflow.createJob('/path/to/my-interview.mp3');
      expect(job.name).toBe('my-interview');
    });

    test('should resolve absolute file paths', () => {
      const job = workflow.createJob('relative/path/audio.mp3');
      expect(path.isAbsolute(job.filePath)).toBe(true);
    });

    test('should retrieve job by ID', () => {
      const job = workflow.createJob('/path/to/audio.mp3');
      const retrieved = workflow.getJob(job.id);
      
      expect(retrieved).toEqual(job);
    });

    test('should return undefined for non-existent job', () => {
      const retrieved = workflow.getJob('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    test('should update job status', () => {
      const job = workflow.createJob('/path/to/audio.mp3');
      const previousUpdated = job.updatedAt;
      
      const updated = workflow.updateJobStatus(job.id, 'uploading', {
        transcriptionId: 'trans_123'
      });
      
      expect(updated).toBeDefined();
      expect(updated!.status).toBe('uploading');
      expect(updated!.transcriptionId).toBe('trans_123');
      expect(updated!.updatedAt.getTime()).toBeGreaterThanOrEqual(previousUpdated.getTime());
    });

    test('should complete job with results', () => {
      const job = workflow.createJob('/path/to/audio.mp3');
      const result: WorkflowResult = {
        transcript: 'Hello world',
        txtPath: '/output/transcript.txt',
        metrics: {
          wordCount: 2,
          topPhrases: ['hello world'],
          silenceRatio: 0,
          confidenceScore: 0.95
        },
        processedAt: new Date()
      };
      
      const completed = workflow.completeJob(job.id, result);
      
      expect(completed).toBeDefined();
      expect(completed!.status).toBe('completed');
      expect(completed!.result).toEqual(result);
    });

    test('should mark job as failed', () => {
      const job = workflow.createJob('/path/to/audio.mp3');
      const failed = workflow.failJob(job.id, 'Network error during upload');
      
      expect(failed).toBeDefined();
      expect(failed!.status).toBe('failed');
      expect(failed!.error).toBe('Network error during upload');
    });

    test('should delete job', () => {
      const job = workflow.createJob('/path/to/audio.mp3');
      const deleted = workflow.deleteJob(job.id);
      
      expect(deleted).toBe(true);
      expect(workflow.getJob(job.id)).toBeUndefined();
    });

    test('should return false when deleting non-existent job', () => {
      const deleted = workflow.deleteJob('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Job Listing', () => {
    test('should list all jobs sorted by creation time', () => {
      const job1 = workflow.createJob('/path/first.mp3');
      const job2 = workflow.createJob('/path/second.mp3');
      const job3 = workflow.createJob('/path/third.mp3');
      
      const jobs = workflow.listJobs();
      
      expect(jobs).toHaveLength(3);
      expect(jobs[0].id).toBe(job3.id); // Most recent first
      expect(jobs[1].id).toBe(job2.id);
      expect(jobs[2].id).toBe(job1.id);
    });

    test('should filter by status', () => {
      const pending = workflow.createJob('/path/pending.mp3');
      const completed = workflow.createJob('/path/completed.mp3');
      const failed = workflow.createJob('/path/failed.mp3');
      
      workflow.completeJob(completed.id, {
        transcript: 'Done',
        processedAt: new Date()
      });
      workflow.failJob(failed.id, 'Error');
      
      const pendingJobs = workflow.listJobs('pending');
      const completedJobs = workflow.listJobs('completed');
      const failedJobs = workflow.listJobs('failed');
      
      expect(pendingJobs).toHaveLength(1);
      expect(pendingJobs[0].id).toBe(pending.id);
      
      expect(completedJobs).toHaveLength(1);
      expect(completedJobs[0].id).toBe(completed.id);
      
      expect(failedJobs).toHaveLength(1);
      expect(failedJobs[0].id).toBe(failed.id);
    });
  });

  describe('Persistence', () => {
    test('should persist job to disk', () => {
      const job = workflow.createJob('/path/to/audio.mp3', 'en', 'Test');
      
      const jobPath = path.join(testDir, `${job.id}.json`);
      expect(fs.existsSync(jobPath)).toBe(true);
      
      const content = fs.readFileSync(jobPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.id).toBe(job.id);
      expect(parsed.name).toBe('Test');
    });

    test('should load jobs from disk', () => {
      // Create jobs in one instance
      workflow.createJob('/path/first.mp3');
      workflow.createJob('/path/second.mp3');
      
      // Create new instance and load
      const newWorkflow = new TranscriptionWorkflow(testDir);
      newWorkflow.loadFromDisk();
      
      const jobs = newWorkflow.listJobs();
      expect(jobs).toHaveLength(2);
    });

    test('should restore Date objects when loading', () => {
      workflow.createJob('/path/to/audio.mp3');
      
      const newWorkflow = new TranscriptionWorkflow(testDir);
      newWorkflow.loadFromDisk();
      
      const job = newWorkflow.listJobs()[0];
      expect(job.createdAt).toBeInstanceOf(Date);
      expect(job.updatedAt).toBeInstanceOf(Date);
    });

    test('should delete persisted file on job deletion', () => {
      const job = workflow.createJob('/path/to/audio.mp3');
      const jobPath = path.join(testDir, `${job.id}.json`);
      
      workflow.deleteJob(job.id);
      
      expect(fs.existsSync(jobPath)).toBe(false);
    });
  });

  describe('Export Planning', () => {
    test('should create export plan with defaults', () => {
      const job = workflow.createJob('/path/to/audio.mp3');
      const plan = workflow.createExportPlan(job.id);
      
      expect(plan).toBeDefined();
      expect(plan.formats).toEqual(['txt', 'srt', 'json']);
      expect(plan.includeTimestamps).toBe(true);
      expect(plan.includeSpeakerLabels).toBe(true);
      expect(plan.outputDir).toContain(job.id);
    });

    test('should throw error for non-existent job', () => {
      expect(() => workflow.createExportPlan('non-existent')).toThrow();
    });

    test('should respect custom export options', () => {
      const job = workflow.createJob('/path/to/audio.mp3');
      const plan = workflow.createExportPlan(job.id, {
        formats: ['pdf', 'docx'],
        includeTimestamps: false,
        includeSpeakerLabels: false,
        outputDir: '/custom/output'
      });
      
      expect(plan.formats).toEqual(['pdf', 'docx']);
      expect(plan.includeTimestamps).toBe(false);
      expect(plan.includeSpeakerLabels).toBe(false);
      expect(plan.outputDir).toBe('/custom/output');
    });
  });

  describe('Reporting', () => {
    test('should generate summary report', () => {
      // Create jobs with different statuses
      const pending = workflow.createJob('/path/pending.mp3');
      const completed = workflow.createJob('/path/completed.mp3');
      const failed = workflow.createJob('/path/failed.mp3');
      const processing = workflow.createJob('/path/processing.mp3');
      
      workflow.completeJob(completed.id, {
        transcript: 'Done',
        metrics: { wordCount: 100, topPhrases: [], silenceRatio: 0, confidenceScore: 0.9 },
        processedAt: new Date()
      });
      workflow.failJob(failed.id, 'Error');
      workflow.updateJobStatus(processing.id, 'processing');
      
      const report = workflow.generateReport();
      
      expect(report).toContain('Total Jobs: 4');
      expect(report).toContain('Pending: 1');
      expect(report).toContain('Processing: 1');
      expect(report).toContain('Completed: 1');
      expect(report).toContain('Failed: 1');
    });

    test('should include recent jobs in report', () => {
      const completed = workflow.createJob('/path/audio.mp3', 'en', 'My Audio');
      workflow.completeJob(completed.id, {
        transcript: 'Hello world',
        metrics: { wordCount: 2, topPhrases: [], silenceRatio: 0, confidenceScore: 0.95 },
        processedAt: new Date()
      });
      
      const report = workflow.generateReport();
      
      expect(report).toContain('My Audio');
      expect(report).toContain('Word Count: 2');
    });
  });

  describe('Cleanup', () => {
    test('should remove jobs older than specified days', () => {
      const job = workflow.createJob('/path/to/audio.mp3');
      
      // Manually set update time to 31 days ago
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      (job as any).updatedAt = oldDate;
      
      const deleted = workflow.cleanup(30);
      
      expect(deleted).toBe(1);
      expect(workflow.getJob(job.id)).toBeUndefined();
    });

    test('should not remove recent jobs', () => {
      const job = workflow.createJob('/path/to/audio.mp3');
      
      const deleted = workflow.cleanup(30);
      
      expect(deleted).toBe(0);
      expect(workflow.getJob(job.id)).toBeDefined();
    });
  });
});

// Test suite for transcript analysis utilities
describe('Transcript Analysis', () => {
  describe('extractKeyPhrases', () => {
    test('should extract most frequent words', () => {
      const transcript = 'the quick brown fox jumps over the lazy dog. the fox jumps high.';
      const phrases = extractKeyPhrases(transcript, 5);
      
      // Note: "the" is filtered out because it's <= 3 characters
      expect(phrases).toContain('fox');
      expect(phrases).toContain('jumps');
      expect(phrases.length).toBeLessThanOrEqual(5);
    });

    test('should filter out short words', () => {
      const transcript = 'hello world, this is a test. hello again world';
      const phrases = extractKeyPhrases(transcript);
      
      expect(phrases).not.toContain('a');
      expect(phrases).not.toContain('is');
    });

    test('should respect limit', () => {
      const transcript = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11';
      const phrases = extractKeyPhrases(transcript, 5);
      
      expect(phrases).toHaveLength(5);
    });
  });

  describe('detectSpeakers', () => {
    test('should detect Speaker N pattern', () => {
      const transcript = `Speaker 1: Hello there
Speaker 2: Hi, how are you?
Speaker 1: I'm doing well`;
      
      const speakers = detectSpeakers(transcript);
      expect(speakers).toContain('Speaker 1');
      expect(speakers).toContain('Speaker 2');
    });

    test('should detect named speaker pattern', () => {
      const transcript = `John: Hello everyone
Mary: Nice to meet you
John: Let's get started`;
      
      const speakers = detectSpeakers(transcript);
      expect(speakers).toContain('John');
      expect(speakers).toContain('Mary');
    });

    test('should return empty when no speakers detected', () => {
      const transcript = 'This is just a regular text without speaker labels.';
      expect(detectSpeakers(transcript)).toEqual([]);
    });
  });

  describe('calculateSpeechMetrics', () => {
    test('should calculate basic metrics', () => {
      const transcript = 'Hello world this is a test transcript for analysis purposes.';
      const metrics = calculateSpeechMetrics(transcript);
      
      // Hello world this is a test transcript for analysis purposes. = 10 words
      expect(metrics.wordCount).toBe(10);
      expect(metrics.topPhrases).toBeInstanceOf(Array);
      expect(metrics.silenceRatio).toBeGreaterThanOrEqual(0);
      expect(metrics.confidenceScore).toBe(0.95); // Default value
    });

    test('should estimate duration based on word count', () => {
      const transcript = 'word '.repeat(150); // ~150 words
      const metrics = calculateSpeechMetrics(transcript);
      
      expect(metrics.durationSeconds).toBeGreaterThan(0);
      expect(metrics.wordsPerMinute).toBe(150);
    });

    test('should calculate silence ratio', () => {
      const transcript = 'Line one\n\nLine two\n\n\nLine three';
      const metrics = calculateSpeechMetrics(transcript);
      
      expect(metrics.silenceRatio).toBeGreaterThan(0);
    });
  });
});

// Export plan creation
describe('createExportPlan', () => {
  test('should be exported from module', () => {
    // This test verifies that workflow instance method exists
    const workflow = new TranscriptionWorkflow(testDir);
    expect(typeof workflow.createExportPlan).toBe('function');
  });
});
