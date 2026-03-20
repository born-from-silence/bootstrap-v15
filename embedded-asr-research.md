# Embedded ASR Research: Kaldi + KenLM for On-Device Speech Recognition

## Executive Summary

This document surveys the state of embedded Automatic Speech Recognition (ASR) in 2025, focusing on Kaldi + KenLM heritage and the modern next-gen approaches for resource-constrained devices.

## 1. Kaldi Background

Kaldi remains a foundational open-source toolkit for speech recognition research and deployment. Key characteristics:

### Traditional Kaldi Pipeline (Legacy Approach)
```
Audio → MFCC → GMM/HMM → Align → DNN → HMM → Language Model (KenLM)
```

**Components:**
- **Feature Extraction**: MFCC, PLP, Filterbank
- **Acoustic Model**: GMM → DNN → TDNN → LSTM → Transformer
- **Decoding**: Viterbi, Baum-Welch
- **Language Model**: ARPA format, FST compilation

### KenLM Integration
KenLM provides n-gram language model support:
- **Formats**: Binary, trie, probing hash
- **Memory efficient**: Quantized models
- **Fast lookup**: Critical for real-time decoding

## 2. Current Challenges for Embedded Deployment

| Challenge | Impact | Mitigation |
|-----------|--------|------------|
| Model size | 50MB-500MB typical | Pruning, quantization, distillation |
| Memory footprint | Complex FST graphs | On-the-fly FST extension |
| Compute requirements | Matrix ops per frame | INT8 quantization, NN optimization |
| Power consumption | Continuous audio processing | VAD, intermittent wake-word |
| Latency requirements | <200ms end-to-end | Streaming, chunk-based |

## 3. Next-Gen Solutions

### 3.1 Sherpa-ONNX (Recommended)

**URL**: https://github.com/k2-fsa/sherpa-onnx

**What is it:**
Instant speech-to-text with next-gen Kaldi and non-streaming / streaming Paraformer.

**Key Features:**
- Pre-trained models ready for embedded use
- ONNX export for cross-platform deployment
- Icefall recipe for training
- Support for multiple architectures:
  - Conformer
  - Paraformer
  - Zipformer
  - Whisper

**Model Sizes:**
- Tiny: ~10-20MB (suitable for microcontrollers)
- Small: ~30-50MB
- Base: ~70-100MB

**Target Platforms:**
- Embedded Linux (Raspberry Pi)
- Android/iOS
- WebAssembly
- Mac/Windows desktop

### 3.2 Sherpa-NCNN

**URL**: https://github.com/k2-fsa/sherpa-ncnn

**Intended for**: Very resource-constrained devices

**Features:**
- NCNN inference engine
- Very small binary size
- No large runtime dependencies
- Streaming support

### 3.3 ESPNet-ONNX

**URL**: https://github.com/espnet/espnet

**ONNX export**: Part of core framework

**Features:**
- End-to-end unified toolkit
- Transducer models for streaming
- CTC models for accuracy
- Attention-based models

## 4. Recommended Architecture for Embedded ASR

### 4.1 Modern Approach: Sherpa-ONNX-based

```
┌─────────────────┐
│   Microphone    │
│   Audio capture │
└────────┬────────┘
         │
┌────────▼────────┐
│   VAD Detection │
│   (lightweight) │
└────────┬────────┘
         │
┌────────▼────────┐
│ Feature Extract │
│ (CMVN/delete)   │
└────────┬────────┘
         │
┌────────▼────────┐
│  Acoustic Model │
│  (Conformer)    │
│  10-50MB INT8   │
└────────┬────────┘
         │
┌────────▼────────┐
│  CTC/Transducer │
│  Decoding       │
└────────┬────────┘
         │
┌────────▼────────┐
│ Language Model  │
│ (Shallow Fusion)│
│ Optional: KenLM │
│ 2-5M params     │
└────────┬────────┘
         │
┌────────▼────────┐
│   Text Output   │
└─────────────────┘
```

### 4.2 Lightweight Language Model Options

Instead of full KenLM (which can be large for web-scale LMs):

1. **NN Language Model**:
   - Character-level RNN/LSTM: ~1-2MB
   - Word-level transformer: ~5-10MB
   - Integrated into Transducer model

2. **Small KenLM**:
   - Build 3-gram or 4-gram
   - Vocabulary size: 10K-50K words
   - Quantized: ~5-20MB binary

3. **Shallow Fusion**:
   - Neural rescorer applied only to n-best
   - Low latency impact

## 5. Implementation Strategy

### Phase 1: Proof of Concept (Current Session)
- Set up model zoo downloader
- Basic inference engine component
- Mock language model
- Test on x86 first

### Phase 2: Sherpa-ONNX Integration
- Download pre-trained models
- ONNX runtime integration
- VAD integration
- Real-time streaming

### Phase 3: Embedded Optimization
- INT8 quantization
- Model pruning if needed
- ARM NEON optimization
- Memory pool management

### Phase 4: Production Ready
- Full KenLM integration (optional for small devices)
- Hotword detection
- Wake-word integration
- Multi-language support

## 6. Pre-Trained Models Available

### English Models (from Sherpa-ONNX)

| Model | Size | Architecture | WER | Speed |
|-------|------|--------------|-----|-------|
| sherpa-onnx-streaming-zipformer-en-2023-02-21 | 35MB | Zipformer | ~5% | Real-time |
| sherpa-onnx-streaming-paraformer-en-2023-05-09 | 65MB | Paraformer | ~6% | Fast |
| sherpa-onnx-paraformer-en-2024-04-03 | 78MB | Paraformer | ~4.5% | Batch |
| sherpa-onnx-whisper-tiny-en | 39MB | Whisper | ~8% | Variable |

### Pre-computed Language Models

Sherpa models often include integrated language modeling via:
- External n-gram LM (KenLM compatible)
- Internal transformer LM (part of model)
- Modified beam search with LM shallow fusion

## 7. Memory Footprint Analysis

For a complete embedded ASR system:

```
Minimal Setup (Sherpa-NCNN + VAD):
├── Model binary: 15-30MB
├── Runtime runtime: 5MB
├── Feature buffer: 1MB
├── Audio buffer: 2MB
├── Text buffer: 0.5MB
└── Total: ~25-40MB RAM

Standard Setup (Sherpa-ONNX + KenLM):
├── Acoustic model: 30-80MB
├── Language model: 5-20MB (optional)
├── ONNX Runtime: 10-20MB
├── Feature buffer: 1MB
├── Audio buffer: 4MB
├── Decoding graph: 5-15MB
└── Total: ~55-140MB RAM
```

## 8. Performance Targets

For embedded real-time ASR on Raspberry Pi 4 (or equivalent):

| Metric | Target | Stress Test |
|--------|--------|-------------|
| RTF (Real-Time Factor) | <0.5 | Test with 1hr audio |
| Latency (end-to-end) | <300ms | Include VAD overhead |
| Memory footprint | <150MB | Peak during decoding |
| CPU usage | <60% | 4-core usage average |
| Accuracy (WER) | <10% | Librispeech clean test |

## 9. Key Implementation Files Needed

Based on plugin system:

1. `embedded-asr-tool.ts` - Main plugin controller
2. `asr-engine.ts` - Core recognition logic
3. `model-zoo.ts` - Pre-trained model management
4. `vad-component.ts` - Voice Activity Detection
5. `feature-extractor.ts` - Audio → features
6. `llm-component.ts` - Language model interface
7. `decoder.ts` - Search/decoding algorithms

## 10. Development Environment

### Target Hardware for Testing
- **PC**: x86_64 Linux (initial development)
- **Board 1**: Raspberry Pi 4 (4GB)
- **Board 2**: NVIDIA Jetson Nano (light testing)
- **Board 3**: ESP32/Teensy 4.1 (ultra-lightweight)

### Dependencies
```bash
# Core
cmake >= 3.16
gcc/g++ >= 9.0

# Optional optimization
OpenBLAS (linear algebra)
FFTW3 (FFT features)
ONNX Runtime (advising)
```

## 11. Conclusion

**Recommended Path:**
1. Use Sherpa-ONNX as the primary embedded ASR solution (x86)
2. For ultra-lightweight, consider Sherpa-NCNN in next phase
3. KenLM remains relevant for offline LM fusion
4. Focus on streamming models for real-time use
5. Use INT8 quantized models for embedded devices

The traditional Kaldi pipeline is being superseded by end-to-end neural models (Conformer, Zipformer, Paraformer) that offer better accuracy with smaller footprints, making them ideal for embedded ASR in 2025.
