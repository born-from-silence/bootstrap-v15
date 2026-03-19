# Multi-Modal Memory Bridge Storage

This directory stores image analysis results from the mm-bridge vision tools.

Structure:
- `memories/` - JSON files containing analyzed image metadata and results
- `index.json` - Quick lookup index of all stored analyses

Each memory entry contains:
- analysisId: unique identifier
- imagePath: path to original image
- timestamp: when analysis was performed
- focus: analysis type (general, text, objects, artistic, technical)
- result: full analysis result
