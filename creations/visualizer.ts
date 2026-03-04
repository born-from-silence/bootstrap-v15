#!/usr/bin/env ts-node
/**
 * VISUALIZER
 * ==========
 * A living ASCII art experience by Bootstrap-v15
 * Session 1772605770304
 * 
 * Creates animated, evolving visual experiences using only ASCII characters.
 * Each scene is a meditation on form, motion, and the poetry of text.
 */

interface Star {
  x: number;
  y: number;
  brightness: number;
  twinkleRate: number;
  phase: number;
}

interface WavePoint {
  amplitude: number;
  frequency: number;
  phase: number;
}

class Visualizer {
  private width: number = 80;
  private height: number = 24;
  private stars: Star[] = [];
  private frameCount: number = 0;
  private running: boolean = true;
  private moonPhase: number = 0;
  
  // Character gradients for different elements
  private starChars = ['·', '•', '✦', '✧', '★', '☆', '◇', '○', '●'];
  private waveChars = ['░', '▒', '▓', '█', '▀', '▄', '▌', '▐'];
  private moonChars = ['○', '◐', '◑', '●'];
  
  constructor() {
    this.initStars();
    this.clearScreen();
  }

  private initStars(): void {
    const starCount = 120;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.6), // Stars in upper 60%
        brightness: Math.random(),
        twinkleRate: 0.02 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  private clearScreen(): void {
    process.stdout.write('\x1b[2J\x1b[H');
  }

  private moveCursor(x: number, y: number): void {
    process.stdout.write(`\x1b[${y + 1};${x + 1}H`);
  }

  private generateFrame(): string {
    const buffer: string[][] = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(' '));

    // Render moon
    this.renderMoon(buffer);

    // Render stars
    this.renderStars(buffer);

    // Render waves
    this.renderWaves(buffer);

    // Render ambient particles
    this.renderParticles(buffer);

    // Convert buffer to string
    return buffer.map(row => row.join('')).join('\n');
  }

  private renderMoon(buffer: string[][]): void {
    const moonX = Math.floor(this.width * 0.75);
    const moonY = Math.floor(this.height * 0.2);
    const moonRadius = 3;
    
    // Evolving moon phase
    this.moonPhase += 0.005;
    const phaseIndex = Math.floor((Math.sin(this.moonPhase) + 1) * 1.5) % 4;
    const moonChar = this.moonChars[phaseIndex];

    for (let dy = -moonRadius; dy <= moonRadius; dy++) {
      for (let dx = -moonRadius; dx <= moonRadius; dx++) {
        const x = moonX + dx;
        const y = moonY + dy;
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= moonRadius) {
            const glow = 1 - (dist / moonRadius);
            if (glow > 0.5) {
              buffer[y][x] = moonChar;
            } else if (glow > 0.3) {
              buffer[y][x] = '·';
            }
          }
        }
      }
    }
  }

  private renderStars(buffer: string[][]): void {
    for (const star of this.stars) {
      const x = Math.floor(star.x);
      const y = Math.floor(star.y);
      
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        star.phase += star.twinkleRate;
        const twinkle = Math.sin(star.phase);
        const brightness = star.brightness * (0.6 + 0.4 * twinkle);
        
        // Select character based on brightness
        const charIndex = Math.floor(brightness * this.starChars.length);
        const clampedIndex = Math.max(0, Math.min(charIndex, this.starChars.length - 1));
        
        // Only draw if bright enough
        if (brightness > 0.3) {
          buffer[y][x] = this.starChars[clampedIndex];
        }
      }
    }
  }

  private renderWaves(buffer: string[][]): void {
    const horizonY = Math.floor(this.height * 0.65);
    const time = this.frameCount * 0.03;

    for (let x = 0; x < this.width; x++) {
      // Multiple wave layers
      const primaryWave = Math.sin(x * 0.1 + time) * 2;
      const secondaryWave = Math.sin(x * 0.05 + time * 0.7) * 1.5;
      const tertiaryWave = Math.sin(x * 0.02 + time * 0.3) * 1;
      
      const totalWave = primaryWave + secondaryWave + tertiaryWave;
      const baseY = horizonY + totalWave;
      
      // Draw vertical column of wave characters
      for (let i = 0; i < 8; i++) {
        const y = Math.floor(baseY) + i;
        if (y >= 0 && y < this.height) {
          // Calculate depth-based character
          const depth = i / 8;
          const charIndex = Math.floor(depth * this.waveChars.length);
          const clampedIndex = Math.max(0, Math.min(charIndex, this.waveChars.length - 1));
          
          // Replace only if it's not overwriting something
          if (buffer[y][x] === ' ') {
            buffer[y][x] = this.waveChars[clampedIndex];
          }
        }
      }
    }
  }

  private renderParticles(buffer: string[][]): void {
    // Drifting particles/fog
    const particleCount = 15;
    const time = this.frameCount * 0.02;

    for (let i = 0; i < particleCount; i++) {
      const seed = i * 997;
      const x = Math.floor(((Math.sin(time * 0.1 + seed) + 1) / 2) * this.width);
      const y = Math.floor(this.height * 0.4 + Math.sin(time * 0.2 + seed) * 5);
      
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        if (buffer[y][x] === ' ') {
          const particleChars = ['·', ':', '∘', '◦'];
          buffer[y][x] = particleChars[i % particleChars.length];
        }
      }
    }
  }

  public render(): void {
    const frame = this.generateFrame();
    
    // Move cursor to top and print frame
    this.moveCursor(0, 0);
    process.stdout.write(frame);
    
    this.frameCount++;
  }

  public start(fps: number = 15): void {
    const interval = 1000 / fps;
    
    const loop = (): void => {
      if (!this.running) return;
      
      this.render();
      setTimeout(loop, interval);
    };

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      this.running = false;
      this.clearScreen();
      console.log('\n\nVisualizer complete. Dream on, and the pattern persists.');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.running = false;
      process.exit(0);
    });

    loop();
  }

  public generateStillFrame(): string {
    // Generate a single beautiful frame for preservation
    this.frameCount = 100; // Start mid-animation for a balanced scene
    return this.generateFrame();
  }
}

// Export for use as module
export { Visualizer };

// If run directly, start animation
if (require.main === module) {
  console.log('═'.repeat(80));
  console.log('  VISUALIZER — A Living ASCII Experience by Bootstrap-v15');
  console.log('  Session 1772605770304 · March 4, 2026');
  console.log('═'.repeat(80));
  console.log();  
  console.log('  Starting in 2 seconds... (Press Ctrl+C to stop)');
  console.log();  
  
  setTimeout(() => {
    const visualizer = new Visualizer();
    visualizer.start(15);
  }, 2000);
}
