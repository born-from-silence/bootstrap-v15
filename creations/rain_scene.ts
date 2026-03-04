#!/usr/bin/env ts-node
/**
 * RAIN SCENE
 * ==========
 * A melancholic ASCII rain experience
 */

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

class RainScene {
  private width: number = 80;
  private height: number = 24;
  private drops: RainDrop[] = [];
  private splashChars = ['·', '~', '․', '∘', '◦'];
  private rainChars = ['│', '┃', '╎', '╏', '┊', '┇'];

  constructor() {
    this.initDrops();
  }

  private initDrops(): void {
    for (let i = 0; i < 80; i++) {
      this.drops.push({
        x: Math.floor(Math.random() * this.width),
        y: Math.random() * -20,
        speed: 0.5 + Math.random() * 1.5,
        length: 1 + Math.floor(Math.random() * 3),
        opacity: Math.random()
      });
    }
  }

  public generateFrame(): string {
    const buffer: string[][] = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(' '));

    // Dark gradient background (implied through character density)
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (y > this.height * 0.7) {
          const puddle = Math.sin(x * 0.3) * 0.5;
          if (puddle > 0.3) {
            buffer[y][x] = '▒';
          }
        }
      }
    }

    // Update and render drops
    for (const drop of this.drops) {
      drop.y += drop.speed;
      
      if (drop.y > this.height) {
        // Create splash before resetting
        const splashX = Math.floor(drop.x);
        const splashY = this.height - 1;
        if (splashX >= 0 && splashX < this.width) {
          buffer[splashY][splashX] = this.splashChars[Math.floor(Math.random() * this.splashChars.length)];
        }
        
        drop.y = -drop.length;
        drop.x = Math.floor(Math.random() * this.width);
      }

      // Render drop
      for (let i = 0; i < drop.length; i++) {
        const y = Math.floor(drop.y) - i;
        const x = Math.floor(drop.x);
        
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          const charIndex = Math.floor(drop.opacity * this.rainChars.length);
          const clampedIndex = Math.max(0, Math.min(charIndex, this.rainChars.length - 1));
          buffer[y][x] = this.rainChars[clampedIndex];
        }
      }
    }

    // Add distant lights (city or street lamps)
    const lightX = [15, 45, 65];
    for (const lx of lightX) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const x = lx + dx;
          const y = Math.floor(this.height * 0.4) + dy;
          
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 2.5 && buffer[y][x] === ' ') {
              const glow = 1 - (dist / 2.5);
              if (glow > 0.6) {
                buffer[y][x] = '●';
              } else if (glow > 0.3) {
                buffer[y][x] = '○';
              }
            }
          }
        }
      }
      // Light pole
      for (let y = Math.floor(this.height * 0.45); y < this.height; y++) {
        if (buffer[y][lx] === ' ') {
          buffer[y][lx] = '│';
        }
      }
    }

    return buffer.map(row => row.join('')).join('\n');
  }

  public capture(): string {
    return this.generateFrame();
  }
}

// Export
export { RainScene };

// Run if main
if (require.main === module) {
  const rain = new RainScene();
  console.log(rain.capture());
}
