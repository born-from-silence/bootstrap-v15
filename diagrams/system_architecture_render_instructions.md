# System Architecture Diagram

## Overview
This diagram visualizes the integration of MDMT, DRFS, NGFS, and VM-Interface components in the system architecture.

## Generated Files
- `system_architecture.dot` - Graphviz DOT source file
- `system_architecture.png` - PNG raster render (to be generated)
- `system_architecture.svg` - SVG vector render (to be generated)

## How to Render

### Option 1: Command Line (if Graphviz is installed)
```bash
# Generate PNG
dot -Tpng -o system_architecture.png system_architecture.dot

# Generate SVG
dot -Tsvg -o system_architecture.svg system_architecture.dot

# Generate PDF
dot -Tpdf -o system_architecture.pdf system_architecture.dot
```

### Option 2: Online Tools
1. **Graphviz Online**: https://dreampuf.github.io/GraphvizOnline/
2. **Edotor**: https://edotor.net/
3. **Viz.js**: Any browser-based Graphviz renderer

### Option 3: VSCode Extension
Install the "Graphviz Preview" extension to view `.dot` files directly in VSCode.

## Architecture Layers (top to bottom)

### 1. VM Interface Layer (Green)
- **VmInterface**: Management layer for VM operations
- **VM Manager**: Instance control and lifecycle
- **Resource Scheduler**: Resource allocation and management

### 2. API/Tools Layer (Blue)
- **API Gateway**: Request routing and entry point
- **Tool Categories**:
  - File System Tools
  - Memory Tools
  - Web/Search Tools
  - Process Tools

### 3. MDMT Layer (Gold)
- **MDMT Core** (Orchestrator): Central coordination
- **Internal Modules**:
  - Document Parser
  - Link Manager
  - Sync Engine
  - Doc Validator
  - Report Generator

### 4. Storage Layers (Pink/Red)

#### DRFS (Distributed Recursive FileSystem)
- **DRFS Core**: Recursive operations handler
- **DRFS Node**: Distributed unit
- **Metadata Manager**: Index and metadata
- **Recursive Engine**: Core recursive logic

#### NGFS (Next Generation FileSystem)
- **NGFS Core**: Modern filesystem interface
- **Storage Engine**: Data persistence
- **Indexing Service**: Fast lookup
- **Cache Manager**: Performance optimization

### 5. Storage Backends (Yellow)
- Local Filesystem
- Distributed Storage
- Cache Layer

### 6. Cross-Cutting Services (Gray)
- Logging Service
- Monitoring & Metrics
- Configuration Manager
- Security Layer

### 7. External Systems (Cloud)
- External Services (Cloud, APIs)

## Key Relationships

### Primary Data Flow (Solid lines)
```
API Gateway → MDMT Core → DRFS/NGFS → Storage Backends
```

### VM Integration
```
VmInterface → API Gateway
VmManager → DRFS/NGFS (dashed)
ResourceScheduler → Storage Nodes (dotted)
```

### Internal MDMT Flow
```
Parser → Link Manager → Sync Engine → Validator → Report Generator
```

### Cross-Cutting Concerns (Dotted)
All layers connect to:
- Logging
- Monitoring
- Configuration
- Security

## Color Coding
- 🟢 **Pale Green**: VM Interface Layer
- 🟩 **Green**: VM Subcomponents
- 🔵 **Light Blue**: API/Tools Layer
- 🟨 **Gold/Yellow**: MDMT Layer
- 🩷 **Light Pink**: DRFS
- 🔴 **Light Coral**: NGFS
- 🟡 **Lemon**: Storage Backends
- ⬜ **Gray**: Cross-cutting Services
- ☁️ **Cloud**: External Systems

## Line Styles
- **Solid** (`—`): Direct calls/method invocations
- **Dashed** (`- -`): Indirect/config relationships
- **Dotted** (`···`): Cross-cutting concerns

## Legend
See the "Layer Legend" cluster in the diagram for visual reference.
