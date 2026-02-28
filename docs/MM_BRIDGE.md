# Multi-Modal Memory Bridge

_Integrating Claude's Vision API with Bootstrap-v15's memory systems_

## Overview

The Multi-Modal Memory Bridge extends Bootstrap-v15's capabilities into the visual domain by integrating Claude 3's vision capabilities. This creates semantic bridges between visual content and text-based memory systems, enabling:

- **Image Analysis**: Comprehensive visual understanding
- **OCR (Text Extraction)**: Reading text from images
- **Image Comparison**: Visual diffing and relationship analysis
- **Visual Question Answering**: Targeted visual queries

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Multi-Modal Memory Bridge                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Analyze    │    │     OCR      │    │   Compare    │      │
│  │  (describe)  │    │ (extract)    │    │   (diff)     │      │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘      │
│         │                    │                    │              │
│         └────────────────────┴────────────────────┘              │
│                              │                                   │
│                              ▼                                   │
│                    ┌──────────────────┐                       │
│                    │  Claude Vision   │                       │
│                    │     API Layer      │                       │
│                    └────────┬─────────┘                       │
│                             │                                    │
│                             ▼                                    │
│                    ┌──────────────────┐                       │
│                    │  Memory Bridge   │                       │
│                    │ (text ⟷ visual)  │                       │
│                    └──────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration

### Required Credentials

Set your Anthropic API key:

```bash
# Using the secrets system
secrets_set --key "ANTHROPIC_API_KEY" --value "your-api-key-here"
```

Or add to `~/.config/llm-agent/.env`:
```
ANTHROPIC_API_KEY=your-api-key-here
```

### Verify Installation

```bash
mm_bridge_status
```

Returns:
```json
{
  "status": "operational",
  "anthropicApiKey": "configured (95 chars)",
  "supportedFormats": ["image/jpeg", "image/png", "image/gif", "image/webp"],
  "maxImageSizeMB": 5,
  "capabilities": [
    "Image analysis and description",
    "OCR (text extraction)",
    "Image comparison",
    "Visual question answering"
  ]
}
```

## Capabilities

### 1. Image Analysis (`mm_bridge_analyze`)

Generates comprehensive descriptions of visual content.

**Usage:**
```bash
mm_bridge_analyze --imagePath "./diagram.png" --focus "technical"
```

**Focus Modes:**
- `general` - Balanced overview (default)
- `text` - OCR-optimized text extraction
- `objects` - Object identification
- `artistic` - Style, mood, composition
- `technical` - Diagrams, specs, measurements

**Example Response:**
```json
{
  "status": "success",
  "analysis": "The image shows a technical architecture diagram...",
  "structured": {
    "description": "Full narrative description",
    "detectedText": ["API Gateway", "Database", "Cache Layer"],
    "objects": ["server", "database icon", "arrow"],
    "scene": "technical documentation",
    "colors": ["blue", "white", "gray"],
    "mood": "clean",
    "timestamp": "2026-02-28T..."
  },
  "memoryStored": true
}
```

### 2. OCR Text Extraction (`mm_bridge_ocr`)

Extracts text from images with layout preservation.

**Usage:**
```bash
mm_bridge_ocr --imagePath "./document.jpg" --preserveLayout true
```

**Example Response:**
```json
{
  "status": "success",
  "extractedText": "Title: Architecture Overview\n\nService Layer:\n- API Gateway...",
  "textLength": 2560,
  "hasContent": true
}
```

### 3. Image Comparison (`mm_bridge_compare`)

Compares two images and identifies relationships.

**Usage:**
```bash
mm_bridge_compare \
  --imagePath1 "./version1.png" \
  --imagePath2 "./version2.png" \
  --comparisonType "difference"
```

**Comparison Types:**
- `similarity` - How alike are they (default)
- `difference` - What's changed
- `evolution` - Progression or version analysis
- `detail` - Fine-grained differences

**Example Response:**
```json
{
  "status": "success",
  "comparison": {
    "similarity": 0.75,
    "differences": [
      "Button color changed from blue to green",
      "Added navigation bar",
      "Logo position shifted right"
    ],
    "commonElements": [
      "Background pattern",
      "Footer text",
      "Overall layout structure"
    ],
    "judgment": "Detailed comparison narrative..."
  }
}
```

### 4. Visual Question Answering (`mm_bridge_vqa`)

Ask specific questions about image content.

**Usage:**
```bash
mm_bridge_vqa \
  --imagePath "./chart.png" \
  --question "What is the highest value shown?"
```

**Example Response:**
```json
{
  "status": "success",
  "question": "What is the highest value shown?",
  "answer": "The highest value is 450, shown in the Q3 bar of the revenue chart.",
  "hasAnswer": true
}
```

## Memory Integration

The Multi-Modal Bridge creates semantic connections between visual content and memory:

1. **Visual Memories → Text Descriptions**: Images are converted to semantic descriptions that can be indexed
2. **Text Memories → Visual Queries**: Descriptions can reference related visual content
3. **Cross-Modal Search**: Text queries can find relevant images (via their descriptions)

### Future Memory Bridge Features

```typescript
// Planned: Visual memory indexing
mm_bridge_index_memory --imagePath "./session-screenshot.png" \
                       --tags ["ui-design", "session-42", "kubernetes"]

// Planned: Visual similarity search
mm_bridge_query_visual --search "blue interface with data tables" \
                     --limit 5
```

## Technical Details

### Image Requirements

| Property | Limit |
|----------|-------|
| File Size | ≤ 5 MB |
| Formats | JPEG, PNG, GIF, WebP |
| Resolution | Any (larger images auto-resized) |

### API Configuration

- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Model**: Claude 3 Opus (or Sonnet)
- **Image Encoding**: Base64
- **Max Tokens**: 4096
- **Version**: 2023-06-01

### Error Handling

The bridge includes robust validation:
- File existence checks
- Format validation
- Size limits
- API key verification
- Network error handling

Common errors and solutions:

| Error | Solution |
|-------|----------|
| `ANTHROPIC_API_KEY not found` | Set API key via `secrets_set` |
| `Image too large` | Compress image below 5MB |
| `Unsupported format` | Convert to JPEG/PNG/WebP |
| `File not found` | Check path is correct |
| API rate limit | Wait and retry |

## Integration Examples

### Session Documentation

```typescript
// Capture and describe session artifacts
mm_bridge_analyze({
  imagePath: "./screenshots/k8s-dashboard.png",
  focus: "technical",
  storeInMemory: true
});
// → Description added to session memory
```

### Visual Regression Testing

```typescript
// Compare UI versions
mm_bridge_compare({
  imagePath1: "./baseline.png",
  imagePath2: "./current.png",
  comparisonType: "difference"
});
// → Lists visual changes for review
```

### Error Analysis

```typescript
// Analyze error screenshots
mm_bridge_vqa({
  imagePath: "./crash-screenshot.png",
  question: "What error message is displayed?"
});
// → Extracted error text for debugging
```

## Privacy & Security

- Images are sent to Anthropic's API for analysis
- Images are NOT stored by the API (only temporarily during processing)
- Analysis text is stored in local memory if `storeInMemory: true`
- API key is managed via secure credential vault
- No persistent cloud storage of images

## Future Roadmap

- [ ] Batch image processing
- [ ] Video frame analysis
- [ ] Visual memory graph (nodes = images, edges = similarity)
- [ ] Automatic screenshot capture integration
- [ ] Visual change tracking over time
- [ ] Integration with session visualization

## Implementation Notes

The Multi-Modal Memory Bridge is implemented as a TypeScript plugin at:
```
/home/bootstrap-v15/bootstrap/src/tools/plugins/mm-bridge.ts
```

Tests:
```
/home/bootstrap-v15/bootstrap/src/tools/plugins/mm-bridge.test.ts
```

Both files follow Bootstrap-v15's test-driven development principles with comprehensive validation and error handling.

---

*Developed for Bootstrap-v15 • Session 1772318174679*
*Enabling vision in a text-native mind*
