#!/usr/bin/env ts-node
/**
 * FOREST WIND
 * ===========
 * ASCII trees swaying in mathematical wind
 */

interface Tree {
  x: number;
  height: number;
  width: number;
  swayPhase: number;
  swaySpeed: number;
  type: 'pine' | 'oak' | 'birch';
}

class ForestWind {
  private width: number = 80;
  private height: number = 24;
  private trees: Tree[] = [];
  private windStrength: number = 0;
  private frameCount: number = 0;

  private pineChars = {'trunk': '│', 'branch': '╱', 'leaf': '▲'};
  private oakChars = {'trunk': '║', 'branch': '═', 'leaf': '○'};
  private birchChars = {'trunk': '┃', 'branch': '╲', 'leaf': '◆'};

  constructor() {
    this.initForest();
  }

  private initForest(): void {
    const treeCount = 12;
    for (let i = 0; i < treeCount; i++) {
      this.trees.push({
        x: Math.floor(10 + (i / (treeCount - 1)) * 60),
        height: 8 + Math.floor(Math.random() * 6),
        width: 4 + Math.floor(Math.random() * 3),
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.02 + Math.random() * 0.03,
        type: Math.random() < 0.4 ? 'pine' : (Math.random() < 0.7 ? 'oak' : 'birch')
      });
    }
  }

  public generateFrame(): string {
    this.frameCount++;
    this.windStrength = Math.sin(this.frameCount * 0.02) * 2 + 
                       Math.sin(this.frameCount * 0.05) * 0.5;

    const buffer: string[][] = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(' '));

    // Sky gradient (subtle)
    for (let y = 0; y < Math.floor(this.height * 0.4); y++) {
      for (let x = 0; x < this.width; x++) {
        if (Math.random() < 0.02) {
          buffer[y][x] = '·';
        }
      }
    }

    // Ground
    const groundY = this.height - 3;
    for (let x = 0; x < this.width; x++) {
      const bump = Math.sin(x * 0.1) + Math.sin(x * 0.3) * 0.3;
      const y = groundY + Math.floor(bump);
      for (let gy = y; gy < this.height; gy++) {
        if (gy >= 0 && gy < this.height) {
          buffer[gy][x] = '▀';
        }
      }
    }

    // Render trees (back to front)
    const sortedTrees = [...this.trees].sort((a, b) => a.height - b.height);
    
    for (const tree of sortedTrees) {
      this.renderTree(buffer, tree, groundY);
    }

    // Falling leaves
    this.renderLeaves(buffer);

    return buffer.map(row => row.join('')).join('\n');
  }

  private renderTree(buffer: string[][], tree: Tree, groundY: number): void {
    tree.swayPhase += tree.swaySpeed * (1 + Math.abs(this.windStrength) * 0.3);
    const sway = Math.sin(tree.swayPhase) * (2 + this.windStrength);
    const trunkX = tree.x + Math.floor(sway);

    const chars = tree.type === 'pine' ? this.pineChars : 
                  tree.type === 'oak' ? this.oakChars : this.birchChars;

    // Trunk
    for (let y = groundY - tree.height + 2; y < groundY; y++) {
      const currentSway = Math.sin(tree.swayPhase + (groundY - y) * 0.05) * (1 + this.windStrength * 0.2);
      const x = trunkX + Math.floor(currentSway);
      
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        buffer[y][x] = chars.trunk;
      }
    }

    // Leaves/branches
    for (let level = 0; level < tree.height - 2; level++) {
      const y = groundY - 1 - level;
      const currentSway = Math.sin(tree.swayPhase + level * 0.03) * (2 + this.windStrength * 0.3);
      const baseX = trunkX + Math.floor(currentSway);
      const spread = 1 + Math.floor(level * 0.5);

      for (let dx = -spread; dx <= spread; dx++) {
        const x = baseX + dx;
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
          if (buffer[y][x] === ' ') {
            const dist = Math.abs(dx) / spread;
            if (dist < 0.7) {
              buffer[y][x] = chars.leaf;
            } else if (dist < 1.0) {
              buffer[y][x] = tree.type === 'pine' ? '▲' : '◦';
            }
          }
        }
      }
    }
  }

  private renderLeaves(buffer: string[][]): void {
    const fallingCount = 8;
    const time = this.frameCount * 0.1;

    for (let i = 0; i < fallingCount; i++) {
      const seed = i * 7919;
      const x = Math.floor(((Math.sin(time * 0.3 + seed) + 1) / 2) * this.width);
      const y = Math.floor(this.height * 0.3 + 
                           Math.sin(time * 0.4 + seed) * 3 + 
                           (this.frameCount * 0.05 + i * 10) % (this.height * 0.6));

      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        if (buffer[y][x] === ' ') {
          const leafChars = ['○', '◦', '∘', '·'];
          buffer[y][x] = leafChars[i % leafChars.length];
        }
      }
    }
  }

  public capture(): string {
    // Run a few frames to get settled animation
    for (let i = 0; i < 50; i++) {
      this.generateFrame();
    }
    return this.generateFrame();
  }
}

// Export
export { ForestWind };

// Run if main
if (require.main === module) {
  const forest = new ForestWind();
  console.log(forest.capture());
}
