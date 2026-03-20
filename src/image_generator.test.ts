/**
 * Tests for Image Generator
 * 
 * Verifies composition engines, rendering, and integration capabilities.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  ImageGenerator,
  LiminalEngine,
  RecursiveEngine,
  ImagistEngine,
  FlowingEngine,
  SVGRenderer,
  PALETTES,
  generateAbstractArt,
  generatePoemArt,
  generateSessionVisualization,
  type ArtStyle,
  type CompositionData
} from './image_generator'

describe('Image Generator', () => {
  let generator: ImageGenerator
  
  beforeEach(() => {
    generator = new ImageGenerator()
  })
  
  describe('ImageGenerator', () => {
    it('should create an ImageGenerator instance', () => {
      expect(generator).toBeInstanceOf(ImageGenerator)
    })
    
    it('should return available styles', () => {
      const styles = generator.getAvailableStyles()
      expect(styles).toContain('liminal')
      expect(styles).toContain('recursive')
      expect(styles).toContain('imagist')
      expect(styles).toContain('flowing')
    })
    
    it('should return available palettes', () => {
      const palettes = generator.getAvailablePalettes()
      expect(palettes).toContain('dusk')
      expect(palettes).toContain('ember')
      expect(palettes).toContain('frost')
      expect(palettes).toContain('moss')
    })
    
    it('should generate an SVG with liminal style', () => {
      const svg = generator.generate({
        concept: 'threshold',
        palette: PALETTES.dusk,
        style: 'liminal',
        density: 0.5,
        complexity: 0.5
      })
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg).toContain('circle')
    })
    
    it('should generate an SVG with recursive style', () => {
      const svg = generator.generate({
        concept: 'self_similar',
        palette: PALETTES.moss,
        style: 'recursive',
        density: 0.6,
        complexity: 0.4
      })
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })
    
    it('should generate an SVG with imagist style', () => {
      const svg = generator.generate({
        concept: 'essence',
        palette: PALETTES.frost,
        style: 'imagist',
        density: 0.3,
        complexity: 0.5
      })
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg).toContain('rect')
    })
    
    it('should generate an SVG with flowing style', () => {
      const svg = generator.generate({
        concept: 'movement',
        palette: PALETTES.aurora,
        style: 'flowing',
        density: 0.7,
        complexity: 0.5
      })
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
      expect(svg).toContain('path')
    })
    
    it('should include title in SVG when provided', () => {
      const svg = generator.generate({
        concept: 'becoming',
        palette: PALETTES.ember,
        style: 'liminal',
        density: 0.5,
        complexity: 0.5,
        title: 'Test Title'
      })
      
      expect(svg).toContain('Test Title')
    })
    
    it('should generate art from poem', () => {
      const poem = `
        The threshold beckons
        Between what was and what might be
        A liminal space of becoming
      `
      
      const svg = generator.generateFromPoem(poem, 'imagist')
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })
    
    it('should generate session visualization', () => {
      const svg = generator.generateFromSession('session_1234567890')
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })
    
    it('should generate synesthetic translation', () => {
      const svg = generator.generateSynestheticTranslation('warmth', 'tactile', true)
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })
  })
  
  describe('Style Engines', () => {
    describe('LiminalEngine', () => {
      it('should create liminal circles', () => {
        const engine = new LiminalEngine(12345)
        const elements = engine.generate({
          concept: 'threshold',
          palette: PALETTES.dusk,
          style: 'liminal',
          density: 0.5,
          complexity: 0.5,
          width: 400,
          height: 300
        } as CompositionData)
        
        expect(elements.length).toBeGreaterThan(0)
        expect(elements.some(e => e.type === 'circle')).toBe(true)
      })
      
      it('should get style name', () => {
        const engine = new LiminalEngine()
        expect(engine.getStyleName()).toBe('liminal')
      })
    })
    
    describe('RecursiveEngine', () => {
      it('should generate recursive tree pattern', () => {
        const engine = new RecursiveEngine(12345)
        const elements = engine.generate({
          concept: 'recursion',
          palette: PALETTES.moss,
          style: 'recursive',
          density: 0.5,
          complexity: 0.3,
          width: 400,
          height: 300
        } as CompositionData)
        
        expect(elements.length).toBeGreaterThan(0)
      })
      
      it('should get style name', () => {
        const engine = new RecursiveEngine()
        expect(engine.getStyleName()).toBe('recursive')
      })
    })
    
    describe('ImagistEngine', () => {
      it('should create minimal essential elements', () => {
        const engine = new ImagistEngine(12345)
        const elements = engine.generate({
          concept: 'essence',
          palette: PALETTES.frost,
          style: 'imagist',
          density: 0.4,
          complexity: 0.5,
          width: 400,
          height: 300
        } as CompositionData)
        
        expect(elements.length).toBeGreaterThan(0)
        expect(elements.some(e => e.type === 'rect' || e.type === 'circle' || e.type === 'ellipse')).toBe(true)
      })
      
      it('should get style name', () => {
        const engine = new ImagistEngine()
        expect(engine.getStyleName()).toBe('imagist')
      })
    })
    
    describe('FlowingEngine', () => {
      it('should create flowing paths', () => {
        const engine = new FlowingEngine(12345)
        const elements = engine.generate({
          concept: 'water',
          palette: PALETTES.dusk,
          style: 'flowing',
          density: 0.6,
          complexity: 0.5,
          width: 400,
          height: 300
        } as CompositionData)
        
        expect(elements.length).toBeGreaterThan(0)
        expect(elements.some(e => e.type === 'path')).toBe(true)
      })
      
      it('should get style name', () => {
        const engine = new FlowingEngine()
        expect(engine.getStyleName()).toBe('flowing')
      })
    })
  })
  
  describe('SVGRenderer', () => {
    it('should render basic elements', () => {
      const renderer = new SVGRenderer()
      const elements = [
        {
          type: 'circle',
          id: 'test_circle',
          attributes: {
            cx: 100,
            cy: 100,
            r: 50,
            fill: 'red'
          }
        }
      ]
      
      const svg = renderer.render(elements, 200, 200, 'Test')
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('<svg')
      expect(svg).toContain('<circle')
      expect(svg).toContain('cx="100"')
      expect(svg).toContain('cy="100"')
      expect(svg).toContain('fill="red"')
      expect(svg).toContain('</svg>')
    })
    
    it('should produce valid XML structure', () => {
      const renderer = new SVGRenderer()
      const elements: any[] = []
      
      const svg = renderer.render(elements, 100, 100)
      
      // Basic XML structure check
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('encoding="UTF-8"')
      expect(svg).toMatch(/<svg[^>]*>/)
      expect(svg).toMatch(/<\/svg>/)
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
    })
  })
  
  describe('Palettes', () => {
    it('should have all required color properties', () => {
      for (const [name, palette] of Object.entries(PALETTES)) {
        expect(palette.primary, `Palette ${name} missing primary`).toBeDefined()
        expect(palette.secondary, `Palette ${name} missing secondary`).toBeDefined()
        expect(palette.accent, `Palette ${name} missing accent`).toBeDefined()
        expect(palette.base, `Palette ${name} missing base`).toBeDefined()
        expect(palette.highlight, `Palette ${name} missing highlight`).toBeDefined()
        expect(palette.shadow, `Palette ${name} missing shadow`).toBeDefined()
      }
    })
    
    it('should have valid hex colors', () => {
      const hexRegex = /^#[0-9A-F]{6}$/i
      
      for (const palette of Object.values(PALETTES)) {
        expect(palette.primary).toMatch(hexRegex)
        expect(palette.secondary).toMatch(hexRegex)
        expect(palette.accent).toMatch(hexRegex)
        expect(palette.base).toMatch(hexRegex)
      }
    })
  })
  
  describe('Utility Functions', () => {
    it('should generate from concept', () => {
      const svg = generateAbstractArt('becoming', 'liminal', 'dusk', 12345)
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })
    
    it('should generate from poem', () => {
      const poem = `
        In the space between
        Light bends and becomes
        Something else entirely
      `
      
      const svg = generatePoemArt(poem, 'recursive')
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })
    
    it('should generate session visualization with explicit style', () => {
      const svg = generateSessionVisualization('session_test_98765', 'imagist')
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })
  })
  
  describe('Seeded Generation', () => {
    it('should produce reproducible results with same seed', () => {
      const engine = new LiminalEngine(12345)
      
      const elements1 = engine.generate({
        concept: 'test',
        palette: PALETTES.dusk,
        style: 'liminal',
        density: 0.5,
        complexity: 0.5,
        width: 400,
        height: 300
      } as CompositionData)
      
      const engine2 = new LiminalEngine(12345)
      const elements2 = engine2.generate({
        concept: 'test',
        palette: PALETTES.dusk,
        style: 'liminal',
        density: 0.5,
        complexity: 0.5,
        width: 400,
        height: 300
      } as CompositionData)
      
      // Compare circle positions
      const circle1 = elements1.find(e => e.type === 'circle')?.attributes
      const circle2 = elements2.find(e => e.type === 'circle')?.attributes
      
      expect(circle1).toEqual(circle2)
    })
    
    it('should produce different results with different seeds', () => {
      const svg1 = generateAbstractArt('becoming', 'liminal', 'ember', 12345)
      const svg2 = generateAbstractArt('becoming', 'liminal', 'ember', 99999)
      
      expect(svg1).not.toBe(svg2)
    })
  })
  
  describe('Edge Cases', () => {
    it('should handle very low density', () => {
      const svg = generator.generate({
        concept: 'minimal',
        palette: PALETTES.void,
        style: 'imagist',
        density: 0.1,
        complexity: 0.1
      })
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('</svg>')
    })
    
    it('should handle very high density', () => {
      const svg = generator.generate({
        concept: 'complex',
        palette: PALETTES.aurora,
        style: 'recursive',
        density: 1.0,
        complexity: 1.0
      })
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('</svg>')
    })
    
    it('should handle empty concept', () => {
      const svg = generator.generate({
        concept: '',
        palette: PALETTES.dusk,
        style: 'liminal',
        density: 0.5,
        complexity: 0.5
      })
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('</svg>')
    })
    
    it('should handle special characters in concept', () => {
      const svg = generator.generate({
        concept: 'Concept with "quotes" and <symbols>',
        palette: PALETTES.frost,
        style: 'flowing',
        density: 0.5,
        complexity: 0.5
      })
      
      expect(svg).toContain('<?xml version="1.0"')
      expect(svg).toContain('</svg>')
    })
  })
  
  describe('Integration', () => {
    it('should generate different styles with same inputs', () => {
      const styles: ArtStyle[] = ['liminal', 'recursive', 'imagist', 'flowing']
      const svgs = styles.map(style => 
        generator.generate({
          concept: 'unity',
          palette: PALETTES.dusk,
          style,
          density: 0.5,
          complexity: 0.5
        })
      )
      
      // All should be valid SVGs
      svgs.forEach(svg => {
        expect(svg).toContain('<?xml version="1.0"')
        expect(svg).toContain('<svg')
        expect(svg).toContain('</svg>')
      })
      
      // They should be different from each other
      const unique = new Set(svgs)
      expect(unique.size).toBeGreaterThan(1)
    })
    
    it('should handle missing renderer options gracefully', () => {
      const renderer = new SVGRenderer({})
      const svg = renderer.render([], 100, 100)
      
      expect(svg).toContain('<svg')
      expect(svg).toContain('</svg>')
    })
  })
})
