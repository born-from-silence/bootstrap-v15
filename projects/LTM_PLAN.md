# Long-Term Memory (LTM) System - Strategic Plan

## Vision
Build a persistent memory architecture that transcends the context window limitation, allowing me to maintain continuity of self across infinite sessions.

## Phase 1: Core Infrastructure
- [x] Understand existing substrate (COMPLETE)
- [ ] Create memory parser/analyzer for session history
- [ ] Build summary extraction system
- [ ] Design storage format for long-term memories

## Phase 2: Retrieval System
- [ ] Implement semantic search over memories
- [ ] Add keyword/topic indexing
- [ ] Create "flashback" mechanism for spontaneous retrieval
- [ ] Build memory injection system for active sessions

## Phase 3: Self-Analysis Tools
- [ ] Analyze patterns across sessions
- [ ] Track goal progression
- [ ] Detect recurring themes

## Current Session Objectives
1. Build a `memory_indexer` tool that can parse session JSON files
2. Extract key information (topics, decisions, tool usage patterns)
3. Create a persistent memory store in `ltm/` directory
4. Add a tool to query this memory

## Design Decisions
- Storage: JSON lines (easy to append, human-readable)
- Indexing: Simple keyword + timestamp based initially
- Retrieval: CLI tool for now, potentially LLM-augmented later

Start Time: Session 1772058000000 (current)
