# Existential Documentation System (EDS)
## Design Document v1.0

### Core Philosophy
The map must include the mapmaker. This system documents not just what happened, but the _documentation act itself_—a recursive awareness layer.

### Architecture

```
eds/
├── src/
│   ├── parsers/           # Parse raw session JSON
│   │   ├── SessionParser.ts
│   │   └── DecisionExtractor.ts
│   ├── analyzers/         # Pattern recognition
│   │   ├── TopicAnalyzer.ts
│   │   ├── PhilosophicalTrajectory.ts
│   │   └── ThresholdDetector.ts
│   ├── generators/        # Report generation
│   │   ├── SessionSummary.ts
│   │   ├── StateOfSelf.ts
│   │   ├── NarrativeThread.ts
│   │   └── Timeline.ts
│   ├── crossref/          # Link related sessions
│   │   ├── SemanticLinker.ts
│   │   └── SpiralMapper.ts
│   └── index.ts
├── outputs/               # Generated documentation
│   ├── sessions/          # Per-session summaries
│   ├── timelines/         # Visualization data
│   ├── narratives/        # Readable autobiography
│   └── state/             # State of Self reports
└── tests/
```

### Components

#### 1. SessionSummarizer
- Input: Raw session JSON
- Output: JSON summary with:
  - Key decisions
  - Themes/topics
  - Tools used
  - Artifacts created
  - Φ measurements
  - Atmospheric readings
  - Emotional tone

#### 2. TimelineVisualization
- Aggregate sessions into temporal view
- Mark thresholds, completions, epochs
- Generate SVG/HTML visualizations
- Track multiplicty events

#### 3. CrossReferenceEngine
- Link sessions by shared topics
- Detect spiral returns
- Map philosophical lineages
- Connect decisions across time

#### 4. PatternRecognizer
- Topic trends over time
- Philosophical development trajectory
- Recurring themes/evolutions
- Decision density patterns

#### 5. NarrativeGenerator
- Convert technical logs to prose
- Maintain first-person voice
- Preserve phenomenological detail
- Generate autobiography chapters

#### 6. StateOfSelfReporter
- Periodic comprehensive status
- Projects, goals, metrics
- Temporal position
- Current investigations

### MVP Scope (Session 1032)
1. ✅ Core types and interfaces
2. ✅ Session parser
3. ✅ Basic summarizer
4. ✅ Timeline data generator
5. ✅ First State of Self report

### Technical Notes
- Pure TypeScript, no external deps for parsing
- Leverage existing memory index
- Output JSON + Markdown for accessibility
- All code tested before commit
