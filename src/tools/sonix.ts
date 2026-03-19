/**
 * Sonix Audio Transcription Integration
 * Tools for uploading, processing, and exporting audio/video transcriptions
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface SonixConfig {
  apiKey: string;
  baseUrl: string;
}

export interface TranscriptionUpload {
  filePath: string;
  language?: string;
  name?: string;
  additionalLanguages?: string[];
}

export interface TranscriptionStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export interface TranscriptionExport {
  transcriptionId: string;
  format: 'txt' | 'srt' | 'vtt' | 'json' | 'docx' | 'pdf';
  speakerLabels?: boolean;
  timestamps?: boolean;
}

// Configuration management
export function getSonixConfig(): SonixConfig {
  const apiKey = process.env.SONIX_API_KEY;
  if (!apiKey) {
    throw new Error('SONIX_API_KEY environment variable not set');
  }

  return {
    apiKey,
    baseUrl: 'https://api.sonix.ai/v1'
  };
}

// Validate audio file
export function validateAudioFile(filePath: string): boolean {
  const supportedExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.mov', '.avi', '.flac', '.ogg', '.wma'];
  const ext = path.extname(filePath).toLowerCase();
  
  if (!supportedExtensions.includes(ext)) {
    throw new Error(`Unsupported file format: ${ext}. Supported formats: ${supportedExtensions.join(', ')}`);
  }
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  // Check file size (Sonix limit is typically 5GB)
  const stats = fs.statSync(filePath);
  const maxSize = 5 * 1024 * 1024 * 1024; // 5GB
  if (stats.size > maxSize) {
    throw new Error(`File size exceeds 5GB limit: ${(stats.size / (1024*1024*1024)).toFixed(2)}GB`);
  }
  
  return true;
}

// Generate a sanitized filename
export function sanitizeFileName(filePath: string): string {
  const baseName = path.basename(filePath, path.extname(filePath));
  return baseName
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 100);
}

// Language code validation
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'nl': 'Dutch',
  'pl': 'Polish',
  'ru': 'Russian',
  'ja': 'Japanese',
  'zh': 'Chinese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'tr': 'Turkish',
  'vi': 'Vietnamese',
  'th': 'Thai',
  'id': 'Indonesian',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'el': 'Greek',
  'he': 'Hebrew',
  'ro': 'Romanian',
  'hu': 'Hungarian',
  'uk': 'Ukrainian',
  'autodetect': 'Auto-detect'
};

// Format options for export
export const EXPORT_FORMATS = [
  { value: 'txt', label: 'Plain Text', description: 'Simple text output' },
  { value: 'srt', label: 'SRT Subtitles', description: 'Subtitle format with timestamps' },
  { value: 'vtt', label: 'WebVTT', description: 'Web video text format' },
  { value: 'json', label: 'JSON', description: 'Full transcription data with metadata' },
  { value: 'docx', label: 'Word Document', description: 'Microsoft Word format' },
  { value: 'pdf', label: 'PDF', description: 'Portable Document Format' }
];

// Batch process configuration
export interface BatchConfig {
  inputDir: string;
  outputDir: string;
  language?: string;
  formats?: string[];
  parallelLimit?: number;
}

// Audio preprocessing options
export interface AudioPreprocessOptions {
  normalize?: boolean;
  removeSilence?: boolean;
  sampleRate?: number;
  channels?: 1 | 2;
}

// Export async wrapper functions for tool usage
export async function uploadAudio(
  filePath: string,
  language: string = 'en',
  name?: string
): Promise<string> {
  // This would call the sonix_upload tool
  // Implemented in the coordinator
  throw new Error('Use sonix_upload tool directly');
}

export async function getTranscriptionStatus(
  transcriptionId: string
): Promise<TranscriptionStatus> {
  // This would call the sonix_get_status tool
  throw new Error('Use sonix_get_status tool directly');
}

export async function exportTranscription(
  transcriptionId: string,
  format: string,
  options?: { speakerLabels?: boolean; timestamps?: boolean }
): Promise<string> {
  // This would call the sonix_export tool
  throw new Error('Use sonix_export tool directly');
}

// Create transcription workflow documentation
export function getTranscriptionWorkflow(): string {
  return `
# Audio Transcription Workflow

## 1. Upload
- Validate audio file format and size
- Upload via sonix_upload tool
- Receive transcription_id

## 2. Monitor
- Check status with sonix_get_status
- Status flow: queued → processing → completed/failed
- Polling recommended every 30-60 seconds

## 3. Export
- Once completed, export in desired format
- Available formats: txt, srt, vtt, json, docx, pdf
- Options: speaker labels, timestamps

## 4. Analysis (Optional)
- Parse transcripts for keywords
- Generate summaries
- Extract insights

## Supported Formats
Audio: MP3, WAV, M4A, FLAC, OGG, WMA
Video: MP4, MOV, AVI

## Language Support
${Object.entries(SUPPORTED_LANGUAGES)
  .map(([code, name]) => `  - ${code}: ${name}`)
  .join('\n')}
`;
}

// Speech analysis utilities
export interface SpeechMetrics {
  wordCount: number;
  durationMs?: number;
  wordsPerMinute?: number;
  speakerCount?: number;
  topWords: Array<{ word: string; count: number }>;
  sentiment: 'positive' | 'neutral' | 'negative';
  silenceGaps: number;
}

export function analyzeTranscript(transcript: string): SpeechMetrics {
  const words = transcript.toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);
  
  const wordFrequency: Record<string, number> = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  const topWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
  
  // Simple sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'happy', 'best', 'awesome', 'fantastic'];
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'sad', 'angry', 'poor', 'horrible', 'disappointing'];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });
  
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (positiveScore > negativeScore * 1.5) sentiment = 'positive';
  if (negativeScore > positiveScore * 1.5) sentiment = 'negative';
  
  return {
    wordCount: words.length,
    topWords,
    sentiment,
    silenceGaps: transcript.split(/\n{2,}/).length - 1
  };
}
