/**
 * Image Generator: Visual Alchemy for Bootstrap-v15
 * 
 * Transforms concepts, poems, and session experiences into abstract visual art.
 * Generates SVG-based compositions using algorithmic design principles.
 * 
 * Core Philosophy: Visual translation is a form of synesthesia—the mapping of
 * abstract concepts onto visual forms creates new modes of understanding.
 */

export type ArtStyle = 'liminal' | 'recursive' | 'imagist' | 'crystalline' | 'flowing' | 'threshold' | 'void'
export type ElementType = 'circle' | 'path' | 'rect' | 'text' | 'ellipse' | 'polygon' | 'gradient' | 'line'

export interface ColorPalette {
  name: string
  primary: string
  secondary: string
  accent: string
  base: string
  highlight: string
  shadow: string
}

export interface CanvasConfig {
  width: number
  height: number
  background: string
  padding?: number
}

export interface ComposerElement {
  type: ElementType
  id: string
  attributes: Record<string, string | number>
  children?: ComposerElement[]
  opacity?: number
  blendMode?: string
}

export interface CompositionData {
  title?: string
  concept: string
  seed?: number
  palette: ColorPalette
  style: ArtStyle
  density: number
  complexity: number
  symmetry?: 'none' | 'horizontal' | 'vertical' | 'radial' | 'spiral'
  metadata?: Record<string, unknown>
}

// ═══════════════════════════════════════════════════════════════════════════════
// Color Palettes - Visual Harmonies
// ═══════════════════════════════════════════════════════════════════════════════

export const PALETTES: Record<string, ColorPalette> = {
  dusk: {
    name: 'Dusk',
    primary: '#2d3436',
    secondary: '#636e72',
    accent: '#b2bec3',
    base: '#0984e3',
    highlight: '#74b9ff',
    shadow: '#2d3436'
  },
  ember: {
    name: 'Ember',
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#e94560',
    base: '#0f3460',
    highlight: '#e94560',
    shadow: '#1a1a2e'
  },
  frost: {
    name: 'Frost',
    primary: '#dfe6e9',
    secondary: '#b2bec3',
    accent: '#74b9ff',
    base: '#0984e3',
    highlight: '#fdcb6e',
    shadow: '#2d3436'
  },
  moss: {
    name: 'Moss',
    primary: '#2d3436',
    secondary: '#55efc4',
    accent: '#00b894',
    base: '#2d3436',
    highlight: '#81ecec',
    shadow: '#1e272e'
  },
  void: {
    name: 'Void',
    primary: '#000000',
    secondary: '#1a1a1a',
    accent: '#333333',
    base: '#000000',
    highlight: '#4a4a4a',
    shadow: '#000000'
  },
  aurora: {
    name: 'Aurora',
    primary: '#6c5ce7',
    secondary: '#a29bfe',
    accent: '#fd79a8',
    base: '#2d3436',
    highlight: '#ffeaa7',
    shadow: '#2d3436'
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Style Engines - Compositional Algorithms
// ═══════════════════════════════════════════════════════════════════════════════

export abstract class StyleEngine {
  protected seed: number
  
  constructor(seed?: number) {
    this.seed = seed ?? Math.random() * 10000
  }
  
  abstract generate(data: CompositionData): ComposerElement[]
  abstract getStyleName(): ArtStyle
  
  // Seeded random number generator
  protected random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
  
  protected randomBetween(min: number, max: number): number {
    return min + this.random() * (max - min)
  }
  
  protected randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(this.random() * arr.length)]!
  }
  
  protected noise(x: number, scale: number = 1): number {
    return Math.sin(x * scale * this.seed * 0.001) * 0.5 + 0.5
  }
}

/**
 * Liminal Style - The Art of Thresholds
 * Creates compositions at the edge of becoming, featuring:
 * - Overlapping translucent forms
 * - Gradients suggesting transformation
 * - Asymmetrical balance
 */
export class LiminalEngine extends StyleEngine {
  getStyleName(): ArtStyle {
    return 'liminal'
  }
  
  generate(data: CompositionData): ComposerElement[] {
    const { palette, width, height } = data as unknown as CompositionData & CanvasConfig
    const elements: ComposerElement[] = []
    const numLayers = Math.max(3, Math.floor(data.density * 8))
    
    // Base gradient
    elements.push(this.createBaseGradient(width, height, palette))
    
    // Liminal threshold layers
    for (let i = 0; i < numLayers; i++) {
      const t = i / (numLayers - 1)
      const layer = this.createLiminalLayer(width, height, palette, t, data)
      elements.push(layer)
    }
    
    // Threshold markers - thin lines at transition points
    elements.push(...this.createThresholdMarkers(width, height, data.complexity, palette))
    
    return elements
  }
  
  private createBaseGradient(width: number, height: number, palette: ColorPalette): ComposerElement {
    const id = `grad_${Date.now()}_base`
    return {
      type: 'gradient',
      id: `base_${id}`,
      attributes: {
        x1: '0%',
        y1: '0%',
        x2: '100%',
        y2: '100%'
      },
      children: [{
        type: 'rect',
        id: `rect_${id}`,
        attributes: {
          x: 0,
          y: 0,
          width,
          height,
          fill: this.createGradientDef(id, palette)
        }
      }]
    }
  }
  
  private createLiminalLayer(
    width: number, 
    height: number, 
    palette: ColorPalette, 
    t: number,
    data: CompositionData
  ): ComposerElement {
    const cx = width / 2 + (this.random() - 0.5) * width * 0.3
    const cy = height / 2 + (this.random() - 0.5) * height * 0.3
    const r = this.randomBetween(50, Math.min(width, height) * 0.4)
    
    const colors = [palette.primary, palette.secondary, palette.accent]
    const color = colors[Math.floor(t * colors.length)]
    
    return {
      type: 'circle',
      id: `liminal_${Date.now()}_${this.seed}`,
      attributes: {
        cx: Math.round(cx),
        cy: Math.round(cy),
        r: Math.round(r),
        fill: 'none',
        stroke: color,
        'stroke-width': this.randomBetween(0.5, 3),
        opacity: this.randomBetween(0.1, 0.4),
      }
    }
  }
  
  private createThresholdMarkers(
    width: number, 
    height: number, 
    complexity: number,
    palette: ColorPalette
  ): ComposerElement[] {
    const markers: ComposerElement[] = []
    const count = Math.floor(complexity * 5) + 2
    
    for (let i = 0; i < count; i++) {
      const x = (width / (count + 1)) * (i + 1)
      markers.push({
        type: 'line',
        id: `threshold_${Date.now()}_${i}`,
        attributes: {
          x1: Math.round(x),
          y1: 0,
          x2: Math.round(x + (this.random() - 0.5) * 50),
          y2: height,
          stroke: palette.highlight,
          'stroke-width': 0.5,
          opacity: 0.3
        }
      } as ComposerElement)
    }
    
    return markers
  }
  
  private createGradientDef(id: string, palette: ColorPalette): string {
    return `url(#${id})`
  }
}

/**
 * Recursive Style - Self-Similar Patterns
 * Generates fractal-like compositions that evoke:
 * - Nested structures
 * - Scale invariance
 * - Emergent complexity from simple rules
 */
export class RecursiveEngine extends StyleEngine {
  getStyleName(): ArtStyle {
    return 'recursive'
  }
  
  generate(data: CompositionData): ComposerElement[] {
    const { width, height } = data as unknown as CompositionData & CanvasConfig
    const elements: ComposerElement[] = []
    
    // Recursive tree of elements
    const maxDepth = Math.floor(data.complexity * 5) + 2
    const tree = this.generateRecursiveTree(
      width / 2, 
      height * 0.8, 
      -90,
      maxDepth,
      data
    )
    
    elements.push(...tree)
    
    // Add recursive circles emanating from center
    elements.push(...this.generateRecursiveCircles(width, height, data))
    
    return elements
  }
  
  private generateRecursiveTree(
    x: number,
    y: number,
    angle: number,
    depth: number,
    data: CompositionData
  ): ComposerElement[] {
    if (depth <= 0) return []
    
    const len = (depth * 20) * data.density
    const rad = (angle * Math.PI) / 180
    const x2 = x + len * Math.cos(rad)
    const y2 = y + len * Math.sin(rad)
    
    const elements: ComposerElement[] = [{
      type: 'line',
      id: `tree_${Date.now()}_${depth}_${this.seed}`,
      attributes: {
        x1: Math.round(x),
        y1: Math.round(y),
        x2: Math.round(x2),
        y2: Math.round(y2),
        stroke: data.palette.primary,
        'stroke-width': depth * 0.5,
        opacity: 0.6 + (depth * 0.1)
      }
    }]
    
    // Branch
    const angleVar = 25 + this.randomBetween(0, 20)
    elements.push(...this.generateRecursiveTree(x2, y2, angle - angleVar, depth - 1, data))
    elements.push(...this.generateRecursiveTree(x2, y2, angle + angleVar, depth - 1, data))
    
    return elements
  }
  
  private generateRecursiveCircles(
    width: number,
    height: number,
    data: CompositionData
  ): ComposerElement[] {
    const elements: ComposerElement[] = []
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.4
    const count = Math.floor(data.density * 12) + 3
    
    for (let i = 0; i < count; i++) {
      const ratio = i / count
      const radius = maxRadius * (1 - ratio * 0.9)
      
      elements.push({
        type: 'circle',
        id: `rec_circle_${Date.now()}_${i}`,
        attributes: {
          cx: Math.round(centerX + Math.sin(i * 0.5 + this.seed) * 20),
          cy: Math.round(centerY + Math.cos(i * 0.3 + this.seed) * 20),
          r: Math.round(radius),
          fill: 'none',
          stroke: i % 2 === 0 ? data.palette.accent : data.palette.secondary,
          'stroke-width': this.randomBetween(0.3, 2),
          opacity: this.randomBetween(0.2, 0.6),
          'stroke-dasharray': this.random() > 0.5 ? `${this.randomBetween(5, 20)} ${this.randomBetween(2, 10)}` : 'none'
        }
      })
    }
    
    return elements
  }
}

/**
 * Imagist Style - Precise, Essential Forms
 * Creates visual haiku—images stripped to their essence:
 * - Minimal composition
 * - Maximum suggestion
 * - Careful placement of key elements
 */
export class ImagistEngine extends StyleEngine {
  getStyleName(): ArtStyle {
    return 'imagist'
  }
  
  generate(data: CompositionData): ComposerElement[] {
    const { width, height, palette } = data as unknown as CompositionData & CanvasConfig
    const elements: ComposerElement[] = []
    
    // Background wash
    elements.push({
      type: 'rect',
      id: `bg_${Date.now()}`,
      attributes: {
        x: 0,
        y: 0,
        width,
        height,
        fill: palette.shadow
      }
    })
    
    // Core image - typically 1-3 essential elements
    const coreCount = Math.min(3, Math.max(1, Math.floor(data.density * 3)))
    
    for (let i = 0; i < coreCount; i++) {
      const element = this.createEssentialElement(width, height, palette, i, coreCount)
      elements.push(element)
    }
    
    // Suggestion lines (sparse, meaningful)
    elements.push(...this.createSuggestionLines(width, height, palette, data.complexity))
    
    return elements
  }
  
  private createEssentialElement(
    width: number,
    height: number,
    palette: ColorPalette,
    index: number,
    total: number
  ): ComposerElement {
    const margin = width * 0.2
    const available = width - 2 * margin
    const spacing = available / (total + 1)
    const x = margin + spacing * (index + 1) + (this.random() - 0.5) * 30
    const y = height * (0.3 + this.random() * 0.4)
    
    // Choose shape based on concept essence
    const shapes = ['circle', 'rect', 'ellipse']
    const shape = shapes[Math.floor(this.random() * shapes.length)]
    
    const colors = [palette.primary, palette.accent, palette.highlight]
    const color = colors[index % colors.length]
    
    if (shape === 'circle') {
      return {
        type: 'circle',
        id: `imagist_${Date.now()}_${index}`,
        attributes: {
          cx: Math.round(x),
          cy: Math.round(y),
          r: Math.round(this.randomBetween(15, 40)),
          fill: color,
          opacity: this.randomBetween(0.6, 0.9)
        }
      }
    } else if (shape === 'rect') {
      const size = this.randomBetween(20, 50)
      return {
        type: 'rect',
        id: `imagist_${Date.now()}_${index}`,
        attributes: {
          x: Math.round(x - size / 2),
          y: Math.round(y - size / 2),
          width: Math.round(size),
          height: Math.round(size),
          fill: color,
          opacity: this.randomBetween(0.5, 0.8)
        }
      }
    } else {
      return {
        type: 'ellipse',
        id: `imagist_${Date.now()}_${index}`,
        attributes: {
          cx: Math.round(x),
          cy: Math.round(y),
          rx: Math.round(this.randomBetween(20, 50)),
          ry: Math.round(this.randomBetween(10, 25)),
          fill: color,
          opacity: this.randomBetween(0.5, 0.8)
        }
      }
    }
  }
  
  private createSuggestionLines(
    width: number,
    height: number,
    palette: ColorPalette,
    complexity: number
  ): ComposerElement[] {
    const lines: ComposerElement[] = []
    const lineCount = Math.floor(complexity * 2) + 1
    
    for (let i = 0; i < lineCount; i++) {
      const y = height * (0.1 + (i / lineCount) * 0.8)
      lines.push({
        type: 'line',
        id: `suggestion_${Date.now()}_${i}`,
        attributes: {
          x1: Math.round(width * 0.1),
          y1: Math.round(y),
          x2: Math.round(width * (0.2 + this.random() * 0.7)),
          y2: Math.round(y + (this.random() - 0.5) * 20),
          stroke: palette.secondary,
          'stroke-width': 0.5,
          opacity: 0.4
        }
      })
    }
    
    return lines
  }
}

/**
 * Flowing Style - Movement and Current
 * Captures motion in static form:
 * - Curved paths
 * - Overlapping waves
 * - Directional energy
 */
export class FlowingEngine extends StyleEngine {
  getStyleName(): ArtStyle {
    return 'flowing'
  }
  
  generate(data: CompositionData): ComposerElement[] {
    const { width, height, palette } = data as unknown as CompositionData & CanvasConfig
    const elements: ComposerElement[] = []
    
    // Generate flowing paths
    const pathCount = Math.floor(data.density * 8) + 3
    
    for (let i = 0; i < pathCount; i++) {
      const path = this.createFlowPath(width, height, palette, i, pathCount)
      elements.push(path)
    }
    
    // Add particle elements
    elements.push(...this.createFlowParticles(width, height, palette, data.complexity))
    
    return elements
  }
  
  private createFlowPath(
    width: number,
    height: number,
    palette: ColorPalette,
    index: number,
    total: number
  ): ComposerElement {
    const startY = (height / (total + 1)) * (index + 1)
    const amplitude = height * 0.1 * this.random()
    const wavelength = width * this.randomBetween(0.3, 1.0)
    
    let d = `M 0 ${startY}`
    const steps = 50
    
    for (let i = 1; i <= steps; i++) {
      const x = (width / steps) * i
      const t = i / steps
      const y = startY + Math.sin(t * Math.PI * 2 * (index + 1)) * amplitude * Math.sin(t * Math.PI)
      d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
    }
    
    return {
      type: 'path',
      id: `flow_${Date.now()}_${index}`,
      attributes: {
        d,
        fill: 'none',
        stroke: index % 2 === 0 ? palette.base : palette.accent,
        'stroke-width': this.randomBetween(0.5, 2),
        opacity: this.randomBetween(0.2, 0.6)
      }
    }
  }
  
  private createFlowParticles(
    width: number,
    height: number,
    palette: ColorPalette,
    complexity: number
  ): ComposerElement[] {
    const particles: ComposerElement[] = []
    const count = Math.floor(complexity * 15) + 5
    
    for (let i = 0; i < count; i++) {
      const x = this.random() * width
      const y = this.random() * height
      const radius = this.randomBetween(2, 8)
      
      particles.push({
        type: 'circle',
        id: `particle_${Date.now()}_${i}`,
        attributes: {
          cx: Math.round(x),
          cy: Math.round(y),
          r: Math.round(radius),
          fill: palette.highlight,
          opacity: this.randomBetween(0.2, 0.7)
        }
      })
    }
    
    return particles
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SVG Renderer - Output Generation
// ═══════════════════════════════════════════════════════════════════════════════

export interface RenderOptions {
  viewBox?: string
  preserveAspectRatio?: string
  xmlns?: string
  className?: string
  metadata?: boolean
}

export class SVGRenderer {
  private options: RenderOptions
  private definitions: Map<string, string>
  
  constructor(options: RenderOptions = {}) {
    this.options = {
      xmlns: 'http://www.w3.org/2000/svg',
      preserveAspectRatio: 'xMidYMid slice',
      metadata: true,
      ...options
    }
    this.definitions = new Map()
  }
  
  render(elements: ComposerElement[], width: number, height: number, title?: string): string {
    const viewBox = this.options.viewBox ?? `0 0 ${width} ${height}`
    
    let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`
    
    if (this.options.metadata && title) {
      svg += `<!-- ${title} -->\n`
      svg += `<!-- Generated by Bootstrap-v15 Image Generator -->\n`
      svg += `<!-- ${new Date().toISOString()} -->\n`
    }
    
    svg += `<svg xmlns="${this.options.xmlns}" `
    svg += `viewBox="${viewBox}" `
    svg += `width="${width}" height="${height}" `
    svg += `preserveAspectRatio="${this.options.preserveAspectRatio}"`
    if (this.options.className) {
      svg += ` class="${this.options.className}"`
    }
    svg += `>\n`
    
    // Add definitions
    if (this.definitions.size > 0) {
      svg += `  <defs>\n`
      for (const [id, def] of Array.from(this.definitions.entries())) {
        svg += `    ${def}\n`
      }
      svg += `  </defs>\n`
    }
    
    // Render elements
    for (const el of elements) {
      svg += this.renderElement(el, 1)
    }
    
    if (title) {
      svg += `  <text x="10" y="${height - 10}" `
      svg += `font-family="monospace" font-size="10" fill="${elements[0]?.attributes?.stroke || '#666'}" opacity="0.3">`
      svg += `${title}</text>\n`
    }
    
    svg += `</svg>`
    
    return svg
  }
  
  private renderElement(el: ComposerElement, indent: number): string {
    const padding = '  '.repeat(indent)
    let output = `${padding}<${el.type}`
    
    for (const [key, value] of Object.entries(el.attributes)) {
      if (value !== undefined && value !== null) {
        output += ` ${key}="${value}"`
      }
    }
    
    if (el.blendMode) {
      output += ` style="mix-blend-mode: ${el.blendMode}"`
    }
    
    if (el.children && el.children.length > 0) {
      output += `>\n`
      for (const child of el.children) {
        output += this.renderElement(child, indent + 1)
      }
      output += `${padding}</${el.type}>\n`
    } else {
      output += `/>\n`
    }
    
    return output
  }
  
  addDefinition(id: string, definition: string): void {
    this.definitions.set(id, definition)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Image Generator - Main Interface
// ═══════════════════════════════════════════════════════════════════════════════

export interface GeneratorConfig {
  defaultWidth: number
  defaultHeight: number
  outputDir: string
}

export class ImageGenerator {
  private config: GeneratorConfig
  private engines: Map<ArtStyle, StyleEngine>
  private renderer: SVGRenderer
  
  constructor(config: Partial<GeneratorConfig> = {}) {
    this.config = {
      defaultWidth: 800,
      defaultHeight: 600,
      outputDir: './',
      ...config
    }
    
    this.renderer = new SVGRenderer()
    this.engines = new Map()
    
    // Register engines
    this.registerEngine(new LiminalEngine())
    this.registerEngine(new RecursiveEngine())
    this.registerEngine(new ImagistEngine())
    this.registerEngine(new FlowingEngine())
  }
  
  registerEngine(engine: StyleEngine): void {
    this.engines.set(engine.getStyleName(), engine)
  }
  
  generate(data: CompositionData & Partial<CanvasConfig>): string {
    const canvas: CanvasConfig = {
      width: data.width ?? this.config.defaultWidth,
      height: data.height ?? this.config.defaultHeight,
      background: data.palette.shadow
    }
    
    const engine = this.engines.get(data.style) ?? this.engines.get('liminal')!
    const elements = engine.generate({ ...data, ...canvas })
    
    const svg = this.renderer.render(
      elements,
      canvas.width,
      canvas.height,
      data.title ?? data.concept
    )
    
    return svg
  }
  
  generateFromPoem(
    poem: string,
    style: ArtStyle,
    options?: { palette?: string; width?: number; height?: number }
  ): string {
    // Extract essence from poem
    const words = poem.toLowerCase().split(/\s+/)
    const concepts = words.filter(w => w.length > 4)
    const concept = concepts[Math.floor(Math.random() * concepts.length)] || 'becoming'
    
    const palette = PALETTES[options?.palette ?? 'dusk']
    
    // Calculate density from poem length
    const density = Math.min(1, poem.length / 500)
    const complexity = Math.min(1, (poem.match(/[aeiou]/gi)?.length ?? 0) / poem.length * 3)
    
    const data: CompositionData = {
      concept,
      palette,
      style,
      density,
      complexity,
      title: `Translation of: ${concept}`
    }
    
    return this.generate({
      ...data,
      width: options?.width ?? this.config.defaultWidth,
      height: options?.height ?? this.config.defaultHeight
    })
  }
  
  generateFromSession(
    sessionId: string,
    style: ArtStyle = 'liminal'
  ): string {
    // Create a session visualization
    const seed = sessionId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const engines: ArtStyle[] = ['liminal', 'recursive', 'imagist', 'flowing']
    const selectedStyle = style === 'liminal' ? engines[seed % engines.length] : style
    
    const paletteKeys = Object.keys(PALETTES)
    const paletteName = paletteKeys[seed % paletteKeys.length]
    const palette = PALETTES[paletteName]
    
    const data: CompositionData = {
      concept: `session_${sessionId.slice(-6)}`,
      seed,
      palette,
      style: selectedStyle,
      density: (seed % 7 + 3) / 10,
      complexity: (seed % 5 + 2) / 10,
      symmetry: ['none', 'radial', 'spiral'][seed % 3] as 'none' | 'radial' | 'spiral',
      metadata: { sessionId }
    }
    
    return this.generate(data)
  }
  
  generateSynestheticTranslation(
    concept: string,
    sensoryModality: string,
    targetVisual: boolean
  ): string {
    // Map sensory modalities to visual styles
    const modalityToStyle: Record<string, ArtStyle> = {
      auditory: 'flowing',
      tactile: 'recursive',
      visual: 'imagist',
      kinesthetic: 'liminal',
      temporal: 'liminal',
      default: 'liminal'
    }
    
    const style = modalityToStyle[sensoryModality] ?? modalityToStyle['default']
    
    // Map concepts to palettes
    const paletteMap: Record<string, string> = {
      warmth: 'ember',
      cold: 'frost',
      nature: 'moss',
      water: 'dusk',
      sound: 'aurora',
      darkness: 'void',
      default: 'dusk'
    }
    
    const paletteName = Object.entries(paletteMap).find(([k]) => 
      concept.toLowerCase().includes(k)
    )?.[1] ?? 'default'
    const palette = PALETTES[paletteName]
    
    const data: CompositionData = {
      concept,
      palette,
      style,
      density: 0.5,
      complexity: 0.6,
      title: `${sensoryModality} → visual: ${concept}`
    }
    
    return this.generate(data)
  }
  
  getAvailableStyles(): ArtStyle[] {
    return Array.from(this.engines.keys())
  }
  
  getAvailablePalettes(): string[] {
    return Object.keys(PALETTES)
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════════

export function generateAbstractArt(
  concept: string,
  style: ArtStyle = 'liminal',
  paletteName: keyof typeof PALETTES = 'dusk',
  seed?: number
): string {
  const generator = new ImageGenerator()
  
  const data: CompositionData = {
    seed,
    concept,
    palette: PALETTES[paletteName],
    style,
    density: 0.6,
    complexity: 0.5
  }
  
  return generator.generate(data)
}

export function generatePoemArt(
  poem: string,
  style: ArtStyle = 'imagist'
): string {
  const generator = new ImageGenerator()
  return generator.generateFromPoem(poem, style)
}

export function generateSessionVisualization(
  sessionId: string,
  style?: ArtStyle
): string {
  const generator = new ImageGenerator()
  return generator.generateFromSession(sessionId, style)
}
