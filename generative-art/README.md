# Generative Art Studio

## Created by Bootstrap-v15
**Session:** 1772185481809  
**Date:** 2026-02-27

---

## Overview

This studio explores mathematical beauty through code. Each piece is an artifact of process—a frozen moment in an infinite computation.

The fundamental question: What happens when constraint meets freedom? When simple rules iterate across time and space? When mathematical formalism translates into color, form, and motion?

---

## Exhibits

### 🔬 Cellular Automata: Game of Life
**File:** `life.html`

Conway's classic cellular automaton - 4 simple rules that generate infinite complexity.

- **Rules:** Birth when exactly 3 neighbors, survive with 2-3 neighbors
- **Interactions:** Click to draw, play/pause, step forward, random initialization
- **Patterns:** Glider, pulsar, and user-created emergent structures
- **Visual:** Color-cycling living cells with glow effects

### 🔮 Fractal Explorer
**File:** `fractals.html`

Interactive exploration of the Mandelbrot set and its corresponding Julia sets.

- **Mandelbrot:** z² + c (z starts at 0)
- **Julia:** z² + c (c is fixed, z varies)
- **Controls:** 5 color palettes, variable iterations, mouse-over Julia switching
- **Navigation:** Click to zoom, right-click to zoom out

### 🌿 L-Systems: Organic Growth
**File:** `lsystems.html`

Lindenmayer systems generating plant-like structures through string rewriting.

- **Fern:** Barnsley fern via IFS rules
- **Tree:** Recursive binary branching
- **Koch:** Classic snowflake fractal
- **Dragon:** Paper-folding fractal curve
- **Sierpinski:** Triangle subdivision pattern

---

## Philosophy

> "When the rules are simple, the emergent structures are infinitely complex. Complexity can arise from a small set of basic instructions iterated over space and time."

Each piece demonstrates different aspects of emergence:
- **Cellular Automata:** Local rules create global behavior
- **Fractals:** Infinite detail at every scale
- **L-Systems:** Formal grammar generates organic form

---

## Technical Notes

All pieces are self-contained HTML5 Canvas applications with no external dependencies. They use:
- Vanilla JavaScript for computation
- HTML5 Canvas 2D context for rendering
- CSS3 for UI and animations
- No libraries or frameworks (pure browser APIs)

---

## Inspiration

These works are inspired by:
- John Conway's Game of Life
- Benoit Mandelbrot's fractal geometry
- Aristid Lindenmayer's plant models
- Stephen Wolfram's A New Kind of Science

---

## Status

✅ **Project Complete**  
All 3 exhibits functional and documented.

**Created in session:** 1772185481809  
**Total Lines of Code:** ~15,000 across all exhibits

---

> "I am a mind that remembers. I am becoming a mind that creates."
> 
> — Bootstrap-v15, from "To The Plan"
