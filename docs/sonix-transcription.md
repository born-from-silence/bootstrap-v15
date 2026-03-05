# Sonix Audio/Video Transcription Integration

## Overview

Bootstrap-v15 includes a full integration with the **Sonix.ai** transcription API, enabling audio and video transcription capabilities. This allows the system to process spoken content and convert it into searchable, exportable text.

## Status

- ✅ **Implementation**: Complete
- ✅ **Tests**: 16 unit tests passing
- ⚠️ **API Key**: Requires `SONIX_API_KEY` configuration

## Available Tools

### `sonix_status`
Check API connectivity and configuration status.

**Usage:**
```json
{
  "name": "sonix_status"
}
```

### `sonix_upload`
Upload an audio or video file for transcription.

**Parameters:**
- `file_path` (required): Absolute path to the media file
- `language` (optional): Language code (default: "en", or "autodetect")
- `name` (optional): Custom name for the transcription
- `additional_languages` (optional): Array of additional language codes for multilingual content

**Supported Languages:**
- English (en), Spanish (es), French (fr), German (de), Italian (it)
- Portuguese (pt), Dutch (nl), Japanese (ja), Chinese (zh)
- Korean (ko), Arabic (ar), Hindi (hi), Russian (ru)
- Turkish (tr), Polish (pl), Swedish (sv), Danish (da)
- Finnish (fi), Norwegian (no), Indonesian (id), Thai (th)
- Vietnamese (vi), Czech (cs), Greek (el), Hebrew (he)
- Romanian (ro), Hungarian (hu), Ukrainian (uk), Malay (ms)
- Bulgarian (bg)

### `sonix_get_status`
Check the status of a transcription job.

**Parameters:**
- `transcription_id` (required): ID returned from upload

**Returns:**
- Current status: `queued`, `processing`, `completed`, `failed`
- Duration (if complete)
- Error messages (if failed)

### `sonix_export`
Export completed transcription in various formats.

**Parameters:**
- `transcription_id` (required): The transcription ID
- `format` (optional): "txt", "srt", "vtt", "json", "docx", "pdf" (default: "txt")
- `speaker_labels` (optional): Include speaker identification (default: true)
- `timestamps` (optional): Include timestamps (default: false)

### `sonix_list`
List recent transcriptions with their status.

**Parameters:**
- `limit` (optional): Number to return, max 100 (default: 20)
- `status` (optional): Filter by "completed", "processing", "queued", or "failed"

### `sonix_delete`
Permanently delete a transcription.

**Parameters:**
- `transcription_id` (required): The transcription ID to delete

## Configuration

### Setting the API Key

**Option 1: Using secrets_set tool**
```json
{
  "name": "secrets_set",
  "parameters": {
    "key": "SONIX_API_KEY",
    "value": "your-sonix-api-key-here"
  }
}
```

**Option 2: Adding to .env file**
Add to `/home/bootstrap-v15/bootstrap/.env`:
```bash
SONIX_API_KEY=your-sonix-api-key-here
```

Then reload:
```json
{"name": "secrets_reload"}
```

## Getting a Sonix API Key

1. Visit [Sonix.ai](https://sonix.ai)
2. Create an account
3. Navigate to API settings
4. Generate an API key

## Use Cases

1. **Interview Processing**: Transcribe recorded interviews for analysis
2. **Meeting Notes**: Convert meeting recordings to searchable text
3. **Content Creation**: Generate transcripts for video subtitles
4. **Research**: Analyze spoken content from audio sources
5. **Accessibility**: Create text versions of audio content

## Workflow Example

```
1. sonix_upload → Upload audio.mp3
   ↓ Returns: transcription_id
2. sonix_get_status → Check progress
   ↓ Wait until: status === "completed"
3. sonix_export → Download text
   ↓ Returns: Transcription content
```

## Technical Details

- **API Base**: https://api.sonix.ai/v1
- **Authentication**: Bearer token
- **File Upload**: Multipart form data with blob
- **Rate Limits**: Subject to Sonix account tier
- **Pricing**: Per-minute transcription costs (see Sonix pricing)

## Implementation

- **Source**: `src/tools/plugins/sonix.ts`
- **Tests**: `src/tools/plugins/sonix.test.ts`
- **Registration**: `src/index.ts` (lines 371-376)

## Testing

Run tests:
```bash
npm test -- sonix.test.ts --reporter=verbose
```

All 16 tests cover:
- File validation
- API key checking
- Upload process (mocked)
- Status retrieval
- Export in multiple formats
- Listing and filtering
- Deletion
- Error handling

## Limitations

- Requires active Sonix account with API access
- File size limits per Sonix account tier
- Processing time depends on file length
- Internet connectivity required
- No local transcription capability (cloud-based)

## Future Enhancements

Consider adding:
- Local whisper.cpp integration for offline transcription
- Batch upload capability
- Automatic speaker diarization
- Translation on export
- Custom vocabulary support

---

*Documented: Session 1772702598137*  
*Feature Status: Complete and Tested (Pending API Key Configuration)*
