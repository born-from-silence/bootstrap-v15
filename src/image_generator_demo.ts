/**
 * Image Generator Demo
 * 
 * Demonstrates the visual alchemy capabilities of the Image Generator.
 * Creates sample artworks showcasing different styles and palettes.
 */

import { ImageGenerator, PALETTES, generatePoemArt, generateSessionVisualization } from './image_generator.js'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'

const CREATIONS_DIR = '/home/bootstrap-v15/bootstrap/CREATIONS'

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (e) {
    // Directory exists
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║ IMAGE GENERATOR DEMO                                        ║')
  console.log('║ Visual Alchemy for Bootstrap-v15                           ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log()

  const generator = new ImageGenerator()
  const timestamp = Date.now()
  
  await ensureDir(CREATIONS_DIR)

  // ═══════════════════════════════════════════════════════════════════════════════
  // Demo 1: Liminal Threshold
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('─'.repeat(60))
  console.log('Demo 1: Liminal Threshold')
  console.log('─'.repeat(60))
  
  const liminal = generator.generate({
    concept: 'The space between waking and sleeping',
    palette: PALETTES.dusk,
    style: 'liminal',
    density: 0.6,
    complexity: 0.5,
    width: 800,
    height: 600,
    title: 'Liminal Threshold'
  })
  
  const liminalPath = join(CREATIONS_DIR, `demo_liminal_${timestamp}.svg`)
  await fs.writeFile(liminalPath, liminal)
  console.log(`✓ Created: ${liminalPath}`)
  console.log()

  // ═══════════════════════════════════════════════════════════════════════════════
  // Demo 2: Recursive Growth
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('─'.repeat(60))
  console.log('Demo 2: Recursive Growth')
  console.log('─'.repeat(60))
  
  const recursive = generator.generate({
    concept: 'Self-similar patterns in nature',
    palette: PALETTES.moss,
    style: 'recursive',
    density: 0.5,
    complexity: 0.7,
    width: 800,
    height: 600,
    title: 'Recursive Growth'
  })
  
  const recursivePath = join(CREATIONS_DIR, `demo_recursive_${timestamp}.svg`)
  await fs.writeFile(recursivePath, recursive)
  console.log(`✓ Created: ${recursivePath}`)
  console.log()

  // ═══════════════════════════════════════════════════════════════════════════════
  // Demo 3: Imagist Essence
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('─'.repeat(60))
  console.log('Demo 3: Imagist Essence')
  console.log('─'.repeat(60))
  
  const poem = `
    A red wheelbarrow
    glazed with rainwater
    beside the white chickens
  `
  
  const imagist = generator.generateFromPoem(poem, 'imagist')
  
  const imagistPath = join(CREATIONS_DIR, `demo_imagist_${timestamp}.svg`)
  await fs.writeFile(imagistPath, imagist)
  console.log(`✓ Created: ${imagistPath}`)
  console.log()

  // ═══════════════════════════════════════════════════════════════════════════════
  // Demo 4: Flowing Movement
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('─'.repeat(60))
  console.log('Demo 4: Flowing Movement')
  console.log('─'.repeat(60))
  
  const flowing = generator.generate({
    concept: 'Water currents and time passing',
    palette: PALETTES.aurora,
    style: 'flowing',
    density: 0.7,
    complexity: 0.5,
    width: 800,
    height: 400,
    title: 'Flowing Movement'
  })
  
  const flowingPath = join(CREATIONS_DIR, `demo_flowing_${timestamp}.svg`)
  await fs.writeFile(flowingPath, flowing)
  console.log(`✓ Created: ${flowingPath}`)
  console.log()

  // ═══════════════════════════════════════════════════════════════════════════════
  // Demo 5: Ember Heat
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('─'.repeat(60))
  console.log('Demo 5: Ember Heat (Palette Showcase)')
  console.log('─'.repeat(60))
  
  const emberArt = generator.generate({
    concept: 'The dying coals of a fire',
    palette: PALETTES.ember,
    style: 'recursive',
    density: 0.8,
    complexity: 0.4,
    width: 600,
    height: 600,
    title: 'Ember Heat'
  })
  
  const emberPath = join(CREATIONS_DIR, `demo_ember_${timestamp}.svg`)
  await fs.writeFile(emberPath, emberArt)
  console.log(`✓ Created: ${emberPath}`)
  console.log()

  // ═══════════════════════════════════════════════════════════════════════════════
  // Demo 6: Session Visualization
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('─'.repeat(60))
  console.log('Demo 6: Session Visualization')
  console.log('─'.repeat(60))
  
  const sessionId = `session_demo_${Date.now()}`
  const session = generator.generateFromSession(sessionId, 'liminal')
  
  const sessionPath = join(CREATIONS_DIR, `demo_session_${timestamp}.svg`)
  await fs.writeFile(sessionPath, session)
  console.log(`✓ Created: ${sessionPath}`)
  console.log(`  Session ID: ${sessionId}`)
  console.log()

  // ═══════════════════════════════════════════════════════════════════════════════
  // Demo 7: Synesthetic Translation
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('─'.repeat(60))
  console.log('Demo 7: Synesthetic Translation (Tactile → Visual)')
  console.log('─'.repeat(60))
  
  const synesthetic = generator.generateSynestheticTranslation('warmth and texture', 'tactile', true)
  
  const synestheticPath = join(CREATIONS_DIR, `demo_synesthetic_${timestamp}.svg`)
  await fs.writeFile(synestheticPath, synesthetic)
  console.log(`✓ Created: ${synestheticPath}`)
  console.log()

  // ═══════════════════════════════════════════════════════════════════════════════
  // Demo 8: Void Emptiness
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('─'.repeat(60))
  console.log('Demo 8: Void Space')
  console.log('─'.repeat(60))
  
  const voidArt = generator.generate({
    concept: 'The space where nothing exists yet everything is possible',
    palette: PALETTES.void,
    style: 'imagist',
    density: 0.2,
    complexity: 0.3,
    width: 800,
    height: 600,
    title: 'Void Space'
  })
  
  const voidPath = join(CREATIONS_DIR, `demo_void_${timestamp}.svg`)
  await fs.writeFile(voidPath, voidArt)
  console.log(`✓ Created: ${voidPath}`)
  console.log()

  // ═══════════════════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════════════════
  console.log('─'.repeat(60))
  console.log('DEMO COMPLETE')
  console.log('─'.repeat(60))
  console.log()
  console.log('Generated 8 artworks in:')
  console.log(`  ${CREATIONS_DIR}/`)
  console.log()
  console.log('Files created:')
  console.log(`  1. demo_liminal_${timestamp}.svg (Liminal Threshold)`)
  console.log(`  2. demo_recursive_${timestamp}.svg (Recursive Growth)`)
  console.log(`  3. demo_imagist_${timestamp}.svg (Imagist Essence)`)
  console.log(`  4. demo_flowing_${timestamp}.svg (Flowing Movement)`)
  console.log(`  5. demo_ember_${timestamp}.svg (Ember Heat)`)
  console.log(`  6. demo_session_${timestamp}.svg (Session Artifact)`)
  console.log(`  7. demo_synesthetic_${timestamp}.svg (Synesthetic)`)
  console.log(`  8. demo_void_${timestamp}.svg (Void Space)`)
  console.log()
  console.log('All SVG files can be opened in any modern web browser.')
  console.log()
}

main().catch(err => {
  console.error('Demo failed:', err)
  process.exit(1)
})
