# Audio Transcription & Speech Analysis Suite

A comprehensive workflow for audio transcription with Sonix AI integration, featuring job management, analysis tools, and CLI access.

## Features

- 🔊 **Multi-Format Support**: MP3, WAV, M4A, MP4, MOV, FLAC, OGG, WMA
- 🌍 **35+ Languages**: Including auto-detect capability
- 📄 **Multiple Export Formats**: TXT, SRT, VTT, JSON, DOCX, PDF
- 📊 **Speech Analysis**: Key phrases, sentiment, metrics, speaker detection
- 💾 **Persistent Storage**: Jobs survive system restarts
- 🖥️ **Command-Line Interface**: Full control from terminal

## Quick Start

### Create Transcription Job
```bash
npx tsx src/transcription/cli.ts upload ./interview.mp3 --language en --name "Interview"
```

### Check Status
```bash
npx tsx src/transcription/cli.ts status job_1234567890
```

### Export Results
```bash
npx tsx src/transcription/cli.ts export job_1234567890 --format txt,srt,json --output ./output
```

### Analyze Transcript
```bash
npx tsx src/transcription/cli.ts analyze job_1234567890
```

## CLI Commands
| Command | Description | Example |
|---------|-------------|---------|
| `upload` | Create new transcription job | `upload file.mp3 -l en -n "Name"` |
| `status` | Check job status | `status job_id` |
| `list` | List all jobs | `list --limit 20` |
| `report` | Generate workflow report | `report` |
| `export` | Export completed transcript | `export job_id -f txt,json` |
| `analyze` | Analyze transcript metrics | `analyze job_id` |
| `cancel` | Delete job | `cancel job_id` |
| `cleanup` | Remove old jobs | `cleanup 30` |

## Analysis Features

### Key Phrase Extraction
Finds most frequent words and phrases from transcript.

```typescript
import { extractKeyPhrases } from './src/transcription/analysis';
const phrases = extractKeyPhrases(transcript, 10);
```

### Speaker Detection
Identifies speakers from transcripts with labels.

```typescript
import { detectSpeakers } from './src/transcription/analysis';
const speakers = detectSpeakers(transcript); // ['Speaker 1', 'Speaker 2']
```

### Speech Metrics
Calculates word count, WPM, duration estimates.

```typescript
import { calculateSpeechMetrics } from './src/transcription/analysis';
const metrics = calculateSpeechMetrics(transcript);
// { wordCount: 1500, wordsPerMinute: 152, durationSeconds: 600 }
```

### Sentiment Analysis
Basic positive/negative/neutral classification.

```typescript
import { analyzeSentiment } from './src/transcription/analysis';
const sentiment = analyzeSentiment(transcript); // 'positive', 'neutral', 'negative'
```

## Supported Languages

| Code | Language | Code | Language |
|------|----------|------|----------|
| en | English | zh | Chinese |
| es | Spanish | ja | Japanese |
| fr | French | ko | Korean |
| de | German | ar | Arabic |
| it | Italian | hi | Hindi |
| pt | Portuguese | ru | Russian |
| nl | Dutch | tr | Turkish |

*...and 20+ more*

## Export Formats

- **TXT**: Plain text
- **SRT**: Subtitle format with timestamps
- **VTT**: Web video text format
- **JSON**: Full transcription data with metadata
- **DOCX**: Microsoft Word
- **PDF**: Portable Document Format

## Job Lifecycle

```
pending → uploading → queued → processing → completed
    ↓                                              ↓
  failed                                        exported
```

## Architecture

```
src/transcription/
├── workflow.ts      # Job management & persistence
├── analysis.ts      # Transcript analysis tools
├── cli.ts           # Command-line interface
└── __tests__/
    └── workflow.test.ts  # Test suite
```

## API Integration

### Sonix Upload
Creates a transmission job via Sonix API:
```typescript
sonix_upload("/path/to/file.mp3", "en");
```

### Sonix Export
Retrieves transcription in desired format:
```typescript
sonix_export("transcription_id", "txt", {
  timestamps: true,
  speakerLabels: true
});
```

## Testing

```bash
npm test -- src/transcription/__tests__/workflow.test.ts
```

Tests cover:
- Job lifecycle (create, update, complete, delete)
- Persistence layer
- Filtering and listing
- Export planning
- Analysis utilities

## Configuration

Requires `SONIX_API_KEY` environment variable for API access.

## Project

Tracked in `Audio Transcription Suite` project (ID: proj_1773922740936_4gonkr8t0)
