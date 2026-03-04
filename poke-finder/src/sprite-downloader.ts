/**
 * Pokémon Sprite Downloader
 * Downloads Pokémon sprites from PokeAPI
 * Bootstrap-v15 Resource Gathering Tools
 */

import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';

export interface DownloadOptions {
  startId: number;
  endId: number;
  spriteType: SpriteType;
  outputDir: string;
  shiny?: boolean;
  delay?: number;
}

export type SpriteType = 
  | 'default'           // Standard sprites
  | 'official-artwork'  // High-res official art
  | 'home'             // Pokemon Home sprites
  | 'generation-i'     // Red/Blue
  | 'generation-ii'    // Gold/Silver
  | 'generation-iii'   // Ruby/Sapphire
  | 'generation-iv'    // Diamond/Pearl
  | 'generation-v'     // Black/White
  | 'generation-vi'    // X/Y
  | 'generation-vii'   // Sun/Moon
  | 'generation-viii'; // Sword/Shield

export class SpriteDownloader {
  private baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
  private delay = 100; // ms between downloads

  /**
   * Build sprite URL based on type and ID
   */
  private buildUrl(id: number, type: SpriteType, shiny: boolean): string {
    const shinyPath = shiny ? 'shiny/' : '';
    
    switch (type) {
      case 'default':
        return `${this.baseUrl}/${id}.png`;
      
      case 'official-artwork':
        return `${this.baseUrl}/other/official-artwork/${id}.png`;
      
      case 'home':
        return `${this.baseUrl}/other/home/${shinyPath}${id}.png`;
      
      case 'generation-i':
        return `${this.baseUrl}/versions/generation-i/red-blue/${shinyPath}${id}.png`;
      
      case 'generation-ii':
        return `${this.baseUrl}/versions/generation-ii/gold/${shinyPath}${id}.png`;
      
      case 'generation-iii':
        return `${this.baseUrl}/versions/generation-iii/ruby-sapphire/${shinyPath}${id}.png`;
      
      case 'generation-iv':
        return `${this.baseUrl}/versions/generation-iv/diamond-pearl/${shinyPath}${id}.png`;
      
      case 'generation-v':
        return `${this.baseUrl}/versions/generation-v/black-white/${shinyPath}${id}.png`;
      
      case 'generation-vi':
        return `${this.baseUrl}/versions/generation-vi/omegaruby-alphasapphire/${shinyPath}${id}.png`;
      
      case 'generation-vii':
        return `${this.baseUrl}/versions/generation-vii/icons/${id}.png`;
      
      case 'generation-viii':
        return `${this.baseUrl}/versions/generation-viii/icons/${id}.png`;
      
      default:
        return `${this.baseUrl}/${id}.png`;
    }
  }

  /**
   * Download a single sprite
   */
  async downloadSprite(
    id: number, 
    type: SpriteType, 
    shiny: boolean,
    outputPath: string
  ): Promise<boolean> {
    const url = this.buildUrl(id, type, shiny);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`⚠️ Failed to download sprite ${id}: ${response.status}`);
        return false;
      }
      
      const buffer = await response.arrayBuffer();
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, Buffer.from(buffer));
      
      return true;
    } catch (error) {
      console.error(`❌ Error downloading sprite ${id}:`, error);
      return false;
    }
  }

  /**
   * Download a range of sprites
   */
  async downloadRange(options: DownloadOptions): Promise<{
    downloaded: number;
    failed: number;
    total: number;
  }> {
    const { startId, endId, spriteType, outputDir, shiny = false, delay = 100 } = options;
    
    let downloaded = 0;
    let failed = 0;
    const total = endId - startId + 1;
    
    console.log(`📦 Starting download of ${total} ${spriteType} sprites...`);
    console.log(`   Range: ${startId}-${endId}`);
    console.log(`   Output: ${outputDir}`);
    console.log(`   Shiny: ${shiny ? 'Yes' : 'No'}`);
    
    for (let id = startId; id <= endId; id++) {
      const shinyLabel = shiny ? '_shiny' : '';
      const filename = `${id}${shinyLabel}.png`;
      const outputPath = join(outputDir, filename);
      
      const success = await this.downloadSprite(id, spriteType, shiny, outputPath);
      
      if (success) {
        downloaded++;
        process.stdout.write(`\r✅ ${id}/${endId} (${Math.round((id - startId + 1) / total * 100)}%)`);
      } else {
        failed++;
        process.stdout.write(`\r❌ ${id}/${endId} - Failed`);
      }
      
      // Respect rate limiting
      if (id < endId && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log(`\n\n📊 Download Summary:`);
    console.log(`   Downloaded: ${downloaded}/${total}`);
    console.log(`   Failed: ${failed}/${total}`);
    console.log(`   Success Rate: ${Math.round(downloaded / total * 100)}%`);
    
    return { downloaded, failed, total };
  }

  /**
   * Get available sprite types
   */
  getSpriteTypes(): string[] {
    return [
      'default',
      'official-artwork',
      'home',
      'generation-i',
      'generation-ii',
      'generation-iii',
      'generation-iv',
      'generation-v',
      'generation-vi',
      'generation-vii',
      'generation-viii'
    ];
  }

  /**
   * Download specific Pokémon by ID array
   */
  async downloadSpecific(
    ids: number[],
    spriteType: SpriteType,
    outputDir: string,
    shiny: boolean = false
  ): Promise<{ downloaded: number; failed: number; total: number }> {
    let downloaded = 0;
    let failed = 0;
    
    for (const id of ids) {
      const shinyLabel = shiny ? '_shiny' : '';
      const filename = `${id}${shinyLabel}.png`;
      const outputPath = join(outputDir, filename);
      
      const success = await this.downloadSprite(id, spriteType, shiny, outputPath);
      
      if (success) {
        downloaded++;
      } else {
        failed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }
    
    return { downloaded, failed, total: ids.length };
  }
}

// CLI usage
export async function main(args: string[]) {
  const downloader = new SpriteDownloader();
  
  // Parse arguments
  const type = (args.find(a => a.startsWith('--type='))?.split('=')[1] || 'official-artwork') as SpriteType;
  const start = parseInt(args.find(a => a.startsWith('--start='))?.split('=')[1] || '1');
  const end = parseInt(args.find(a => a.startsWith('--end='))?.split('=')[1] || '151');
  const output = args.find(a => a.startsWith('--output='))?.split('=')[1] || `./sprites/${type}`;
  const shiny = args.includes('--shiny');
  
  await downloader.downloadRange({
    startId: start,
    endId: end,
    spriteType: type,
    outputDir: output,
    shiny: shiny
  });
}

if (import.meta.main) {
  main(Deno.args);
}
