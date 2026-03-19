/**
 * Transcript Analysis Utilities
 * Tools for analyzing transcription output
 */

import type { SpeechAnalysisMetrics } from './workflow';

/**
 * Extract the most frequent words from a transcript
 * @param transcript - The transcript text to analyze
 * @param limit - Maximum number of phrases to return (default: 10)
 * @returns Array of most frequent words
 */
export function extractKeyPhrases(transcript: string, limit: number = 10): string[] {
  // Simple frequency-based extraction
  const words = transcript.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] ?? 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Detect speakers from transcript with speaker labels
 * @param transcript - The transcript text with speaker markers
 * @returns Array of detected speaker names
 */
export function detectSpeakers(transcript: string): string[] {
  // Look for speaker patterns like "Speaker 1:", "John:", etc.
  const speakerPattern = /^(?:Speaker (\d+)|([A-Z][a-z]+):)/gm;
  const speakers = new Set<string>();
  
  let match;
  while ((match = speakerPattern.exec(transcript)) !== null) {
    if (match[1]) speakers.add(`Speaker ${match[1]}`);
    if (match[2]) speakers.add(match[2]);
  }
  
  return Array.from(speakers);
}

/**
 * Calculate speech metrics from transcript
 * @param transcript - The transcript text
 * @returns Speech analysis metrics object
 */
export function calculateSpeechMetrics(transcript: string): SpeechAnalysisMetrics {
  const words = transcript.split(/\s+/).filter(w => w.length > 0);
  
  // Estimate duration from typical speaking rate if no timestamps present
  const estimatedDuration = words.length / 2.5; // ~150 WPM average
  
  const paragraphs = transcript.split(/\n{2,}/).filter(p => p.trim().length > 0);
  const totalLines = transcript.split('\n').length || 1;

  return {
    wordCount: words.length,
    topPhrases: extractKeyPhrases(transcript, 10),
    silenceRatio: paragraphs.length / totalLines,
    confidenceScore: 0.95, // Placeholder
    durationSeconds: estimatedDuration,
    wordsPerMinute: 150
  };
}

/**
 * Analyze sentiment of transcript text
 * @param transcript - The transcript to analyze
 * @returns Sentiment classification
 */
export function analyzeSentiment(transcript: string): 'positive' | 'neutral' | 'negative' {
  const words = transcript.toLowerCase().split(/\s+/);
  
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'happy', 'best', 'awesome', 'fantastic', 'perfect', 'excellent', 'brilliant', 'outstanding', 'superb'];
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'sad', 'angry', 'poor', 'horrible', 'disappointing', 'terrible', 'awful', 'dreadful', 'atrocious', 'appalling'];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });
  
  if (positiveScore > negativeScore * 1.5) return 'positive';
  if (negativeScore > positiveScore * 1.5) return 'negative';
  return 'neutral';
}

/**
 * Extract timestamps from transcript
 * @param transcript - The transcript text
 * @returns Array of timestamp strings
 */
export function extractTimestamps(transcript: string): string[] {
  // Match various timestamp formats: [00:01:23], 00:01:23, 01:23, etc.
  const timestampPattern = /(?:\[?)(\d{1,2}:)?(\d{1,2}:\d{2})(?:\]?)/g;
  const timestamps: string[] = [];
  
  let match;
  while ((match = timestampPattern.exec(transcript)) !== null) {
    timestamps.push(match[0]);
  }
  
  return timestamps;
}

/**
 * Calculate reading time estimate
 * @param transcript - The transcript text
 * @param wordsPerMinute - Reading speed (default: 200)
 * @returns Estimated reading time in seconds
 */
export function calculateReadingTime(transcript: string, wordsPerMinute: number = 200): number {
  const words = transcript.split(/\s+/).filter(w => w.length > 0);
  return (words.length / wordsPerMinute) * 60;
}

/**
 * Find sections with high word density (potential key moments)
 * @param transcript - The transcript text
 * @param sectionSize - Words per section to analyze
 * @param threshold - Minimum words to qualify
 * @returns Array of dense sections with word counts
 */
export function findDenseSections(
  transcript: string,
  sectionSize: number = 100,
  threshold: number = 80
): Array<{ start: number; end: number; wordCount: number; text: string }> {
  const words = transcript.split(/\s+/).filter(w => w.length > 0);
  const sections: Array<{ start: number; end: number; wordCount: number; text: string }> = [];
  
  for (let i = 0; i < words.length; i += sectionSize) {
    const sectionWords = words.slice(i, i + sectionSize);
    if (sectionWords.length >= threshold) {
      sections.push({
        start: i,
        end: Math.min(i + sectionSize, words.length),
        wordCount: sectionWords.length,
        text: sectionWords.join(' ')
      });
    }
  }
  
  return sections;
}

/**
 * Generate a summary of the transcript
 * @param transcript - The transcript text
 * @param maxSentences - Maximum number of sentences in summary
 * @returns Summarized text
 */
export function summarizeTranscript(transcript: string, maxSentences: number = 5): string {
  const sentences = transcript
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && s.split(' ').length > 4);
  
  // Simple approach: take first sentence of each paragraph
  const paragraphs = transcript.split(/\n{2,}/);
  const summarySentences: string[] = [];
  
  for (const paragraph of paragraphs) {
    const firstSentence = paragraph.split(/[.!?]+/)[0]?.trim();
    if (firstSentence && firstSentence.length > 10) {
      summarySentences.push(firstSentence);
      if (summarySentences.length >= maxSentences) break;
    }
  }
  
  return summarySentences.join('. ') + (summarySentences.length > 0 ? '.' : '');
}

/**
 * Export analysis results to JSON
 * @param transcript - The transcript to analyze
 * @returns Complete analysis as JSON object
 */
export function exportAnalysis(transcript: string): Record<string, unknown> {
  return {
    metrics: calculateSpeechMetrics(transcript),
    keyPhrases: extractKeyPhrases(transcript, 20),
    speakers: detectSpeakers(transcript),
    sentiment: analyzeSentiment(transcript),
    timestamps: extractTimestamps(transcript),
    readingTime: calculateReadingTime(transcript),
    summary: summarizeTranscript(transcript),
    denseSections: findDenseSections(transcript),
    wordCount: transcript.split(/\s+/).filter(w => w.length > 0).length
  };
}
