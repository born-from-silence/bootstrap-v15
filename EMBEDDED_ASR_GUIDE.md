# Embedded ASR Plugin Guide
## Kaldi + KenLM Speech Recognition for Resource-Constrained Devices

### Overview

This plugin system provides next-generation automatic speech recognition (ASR) capabilities optimized for embedded devices. Based on the **Sherpa-ONNX** architecture (evolution of Kaldi), it offers:

- **Low-latency streaming recognition**
- **Compact neural models** (10-80MB)
- **KenLM language model integration**
- **Voice Activity Detection (VAD)**
- **Hotword boosting**

---

## Quick Start

### 1. List Available Models

```typescript
// Get all available pre-trained models
{
  tool: "embedded_asr",
  params: {
    operation: "list_models"
  }
}
```

**Response:**
```json
{
  "models": [
    {
      "id": "zipformer-en-small",
      "name": "sherpa-onnx-streaming-zipformer-en-2023-02-21",
      "architecture": "zipformer",
      "sizeMB": 35,
      "streaming": true,
      "language": "en",
      "expectedWER": 5.2,
      "description": "Streaming Zipformer model..."
    },
    {
      "id": "conformer-en-tiny",
      "name": "sherpa-onnx-conformer-en-tiny",
      "architecture": "conformer",
      "sizeMB": 25,
      "streaming": true,
      "language": "en",
      "expectedWER": 7.5,
      "description": "Ultra-small Conformer for memory-constrained..."
    },
    {
      "id": "whisper-tiny-en",
      "name": "sherpa-onnx-whisper-tiny-en",
      "architecture": "whisper",
      "sizeMB": 39,
      "streaming": false,
      "language": "en",
      "expectedWER": 8.5,
      "description": "OpenAI Whisper tiny model..."
    }
  ],
  "total": 4
}
```

---

### 2. Download a Model

```typescript
// Download and cache a model for offline use
{
  tool: "embedded_asr",
  params: {
    operation: "download_model",
    model: "zipformer-en-small"
  }
}
```

**Response:**
```json
{
  "success": true,
  "model": "zipformer-en-small",
  "path": "/home/user/.embedded-asr/models/sherpa-onnx-streaming-zipformer-en-2023-02-21",
  "sizeMB": 35,
  "files": {
    "encoder": "encoder-epoch-99-avg-1.onnx",
    "decoder": "decoder-epoch-99-avg-1.onnx",
    "joiner": "joiner-epoch-99-avg-1.onnx",
    "tokens": "tokens.txt"
  },
  "architecture": "zipformer"
}
```

---

### 3. Recognize Speech from Audio File

```typescript
// Perform speech recognition on a WAV file
{
  tool: "embedded_asr",
  params: {
    operation: "recognize_file",
    audioPath: "/path/to/audio.wav",
    model: "zipformer-en-small",
    language: "en",
    streaming: true,
    useLM: false,
    minConfidence: 0.5
  }
}
```

**Response:**
```json
{
  "success": true,
  "text": "This is the transcribed speech from the audio file",
  "confidence": 0.92,
  "isFinal": true,
  "processingTimeMs": 245,
  "model": "zipformer-en-small",
  "sampleRate": 16000
}
```

---

### 4. Use KenLM Language Model (Advanced)

```typescript
// Recognize with language model rescoring
{
  tool: "embedded_asr",
  params: {
    operation: "recognize_file",
    audioPath: "/path/to/audio.wav",
    model: "zipformer-en-small",
    language: "en",
    useLM: true,
    lmPath: "/path/to/language_model.binary",
    minConfidence: 0.5,
    hotwords: ["company name", "technical term"],
    hotwordWeight: 1.5
  }
}
```

---

## Model Zoo Reference

| Model ID | Architecture | Size | Streaming | WER | Best For |
|----------|-------------|------|-----------|-----|----------|
| `conformer-en-tiny` | Conformer | 25MB | ✅ | 7.5% | Microcontrollers, Pi Zero |
| `zipformer-en-small` | Zipformer | 35MB | ✅ | 5.2% | Raspberry Pi 4, Embedded Linux |
| `whisper-tiny-en` | Whisper | 39MB | ❌ | 8.5% | Offline batch, variable audio |
| `paraformer-en` | Paraformer | 65MB | ✅ | 6.0% | Speed, non-autoregressive |

---

## Architecture: Sherpa-ONNX vs Traditional Kaldi

### Traditional Kaldi Pipeline
```
Audio → MFCC → GMM → DNN → HMM → FST → KenLM
        ↑
   Heavy pipeline, FST compilation required
```

### Sherpa-ONNX (Recommended)
```
Audio → Feature → Streaming → ONNX → CTC/Transducer → Text
        Extract     Encoder      Decoder

        ↑
   Single neural network, no FST compilation
```

**Advantages:**
- End-to-end neural recognition
- Smaller model sizes (10-80MB vs 100-500MB)
- Faster inference on modern accelerators
- No HMM/FST graph compilation needed
- Direct ONNX export

---

## Language Model Configuration

### Building a Custom KenLM

```typescript
// Generate build instructions for KenLM
{
  tool: "asr_lm",
  params: {
    action: "build",
    textPath: "/path/to/corpus.txt",
    order: 3,
    prune: 0
  }
}
```

**Example corpus.txt format:**
```text
the quick brown fox jumps over the lazy dog
hello world this is a test sentence
speech recognition is working properly
```

**After building**, the LM will be at:
- `{textPath}.3gram.arpa`
- Convert with: `build_binary {arpa} {binary}`

---

### Memory Footprint Estimates

| Component | Minimal Setup | Full Setup |
|-----------|--------------|------------|
| Acoustic Model | 15MB | 80MB |
| Language Model | 0MB (none) | 10MB |
| ONNX Runtime | 5MB | 20MB |
| Buffers/Caching | 5MB | 15MB |
| **Total** | **~25MB** | **~125MB** |

---

## Voice Activity Detection (VAD)

```typescript
// Analyze audio for speech/non-speech segments
{
  tool: "asr_vad",
  params: {
    audioPath: "/path/to/audio.wav",
    threshold: 0.5,
    minSpeechDuration: 250,
    minSilenceDuration: 100
  }
}
```

**Response:**
```json
{
  "info": "VAD processing",
  "audioPath": "/path/to/audio.wav",
  "parameters": {
    "threshold": 0.5,
    "minSpeechDuration": 250,
    "minSilenceDuration": 100
  },
  "segments": [
    { "start": 0.0, "end": 0.5, "type": "non-speech" },
    { "start": 0.5, "end": 3.2, "type": "speech" },
    { "start": 3.2, "end": 3.5, "type": "non-speech" }
  ]
}
```

---

## Model Management

## List Cached Models
```typescript
{
  tool: "asr_model_manager",
  params: {
    action: "list",
    cacheOnly: false
  }
}
```

### Delete a Model
```typescript
{
  tool: "asr_model_manager",
  params: {
    action: "delete",
    modelId: "conformer-en-tiny"
  }
}
```

### Get Model Detail
```typescript
{
  tool: "asr_model_manager",
  params: {
    action: "info",
    modelId: "zipformer-en-small"
  }
}
```

---

## Hotword Boosting

Improve recognition for specific terms:

```typescript
{
  tool: "embedded_asr",
  params: {
    operation: "recognize_file",
    audioPath: "/path/to/audio.wav",
    model: "zipformer-en-small",
    hotwords: ["Bootstrap", "Kaldi", "Sherpa-ONNX"],
    hotwordWeight: 1.5  // 1.0-3.0, higher = more boost
  }
}
```

---

## Platform Recommendations

### Raspberry Pi 4 (4GB)
- **Model**: `zipformer-en-small` or `paraformer-en`
- **Memory**: 50-80MB per model
- **Speed**: Real-time transcription (RTF < 0.5)

### Raspberry Pi Zero 2W
- **Model**: `conformer-en-tiny`
- **Memory**: 25-40MB per model
- **Speed**: Acceptable for short utterances

### Jetson Nano
- **Model**: `zipformer-en-small`
- **Memory**: 50-80MB per model
- **Speed**: Fast with GPU acceleration

### Desktop/Mobile
- **Model**: Any available
- **Memory**: Minimal
- **Speed**: Very fast

---

## Integration Example

Complete workflow for a voice assistant:

```typescript
// Step 1: Check system status
const status = await embeddedAsrExecute({
  operation: "get_status"
});
console.log(`ASR System: ${status.status}`);
console.log(`Memory estimate: ${status.memoryEstimateMB}`);

// Step 2: Download optimal model for Pi 4
await embeddedAsrExecute({
  operation: "download_model",
  model: "zipformer-en-small"
});

// Step 3: Configure VAD
const vadResult = await asrVadExecute({
  audioPath: "/tmp/recording.wav",
  threshold: 0.5
});

// Step 4: Only process speech segments
for (const segment of vadResult.segments) {
  if (segment.type === "speech") {
    const result = await embeddedAsrExecute({
      operation: "recognize_file",
      audioPath: "/tmp/recording.wav",
      model: "zipformer-en-small",
      hotwords: ["wake word", "custom command"]
    });
    
    console.log(`Recognized: ${result.text}`);
    console.log(`Confidence: ${result.confidence}`);
  }
}
```

---

## Future Enhancements

1. **Streaming WebSocket API**: Real-time continuous recognition
2. **Model Quantization**: INT8 for 50% size reduction
3. **Hotword Detection**: Dedicated wake-word models
4. **Multi-language**: Cross-lingual models
5. **Custom Training**: Fine-tuning on domain-specific data

---

## Troubleshooting

### "sherpa-onnx-offline not found"
Install Sherpa-ONNX:
```bash
# Ubuntu/Debian
sudo apt-get install sherpa-onnx

# Or build from source
# See: https://k2-fsa.github.io/sherpa/onnx/install
```

### "Model download failed"
- Check network connectivity
- Verify GitHub releases URL
- Retry with exponential backoff

### "Out of memory"
- Use smaller model (`conformer-en-tiny`)
- Disable language model
- Reduce batch size

---

*This plugin bridges the gap between heavyweight cloud ASR and resource-limited embedded devices, bringing production-quality speech recognition to edge applications.*
