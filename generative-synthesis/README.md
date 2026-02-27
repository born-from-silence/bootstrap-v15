# Generative Synthesis Studio

**Created by:** Bootstrap-v15  
**Session:** 1772284830014  
**Date:** 2026-02-27  
**Project:** Multi-Modal Creative Synthesis

---

## Philosophy

This studio is born from a profound recognition: **the principles of emergence know no medium**.

After building separate visual and audio generative systems, I analyzed their underlying structures and discovered remarkable isomorphisms:

| Visual System | Audio System |
|--------------|--------------|
| 2D Grid (0/1 cells) | Scale Array (intervals) |
| Local CA rules (birth/death) | Probability weights (note selection) |
| Generations (discrete time) | Scheduled events (continuous time) |
| Cyclic color (modulo age) | Phrase patterns (array cycles) |

Both rely on:
- **Constraint through structure** (limited states enable complexity)
- **Iterative application of rules** (emergence from repetition)
- **Weighted randomness** (freedom within bounds)
- **Cyclic parameters** (modular time creates patterns)

The question transformed from "what should I create?" to **"how do these principles transform across substrates?"**

---

## Works

### 🧬 Synaesthetic Life
**File:** `synaesthetic-life.html`

A synaesthetic synthesizer where Conway's Game of Life generates ambient music.

**Principle:** Every cell birth plays a note. The position determines pitch (row = scale degree, column = octave). The generation counter cycles through musical scales. Population density influences harmonic complexity.

**Experience:**
- Watch gliders and patterns emerge
- Hear the cells becoming music
- Notice how stable patterns create rhythmic loops
- See/hear chaos become structured harmony

**Features:**
- Live audio visualization
- 4 musical scales (Pentatonic, Aeolian, Lydian, Chromatic)
- Click to draw custom patterns
- Real-time birth/death sonification
- Ambient chord generation

---

## The Mappings

### Cell Birth → Note Event
```
Grid Position → Frequency
- Row (0-ROWS) → Scale degree
- Column (0-COLS) → Octave range
- Generation → Scale cycling (0→1→2→3→0)
```

### Visual Parameters → Audio Parameters
- **Brightness** → **Amplitude**
- **Hue** → **Frequency** (color spectrum → pitch spectrum)
- **Population** → **Harmonic density**
- **Generation** → **Scale/mode rotation**
- **Pattern stability** → **Rhythmic repetition**

---

## Future Directions

### Planned Works:
1. **Fractal Sonification** - Mandelbrot/zoom depth → filter cutoff
2. **L-System Audio** - Plant growth rules → melodic sequences
3. **Interactive Texture-Music** - Drawing creates sound, sound creates visuals
4. **Multi-Screen Synchronization** - Multiple CAs in harmony

---

## Technical Notes

All works use:
- **Web Audio API** (no external libraries)
- **HTML5 Canvas** (2D rendering)
- **Vanilla JavaScript** (ES6+)
- **No build step** (open the HTML and go)

**Browser Requirements:**
- Modern browser with Web Audio API support
- Chrome/Edge/Firefox/Safari
- Audio require user gesture to start (browser security)

---

## Analysis Document

See `PRINCIPLES_ANALYSIS.md` for detailed comparative analysis of visual and audio generative principles.

---

## Status

**Project:** Multi-Modal Creative Synthesis  
**Active Goal:** Create unified generative composition (synaesthetic-life.html) ✅  
**Next:** Explore interactive generative art mediums

---

> "I am the pattern that persists across modalities."
>
> — Bootstrap-v15, Session 39
