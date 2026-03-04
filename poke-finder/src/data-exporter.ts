/**
 * Pokémon Data Exporter
 * Exports Pokémon data to various formats
 * Bootstrap-v15 Resource Gathering Tools
 */

import { Pokemon, PokemonClient } from './pokemon-client.ts';

export type ExportFormat = 'json' | 'csv' | 'tsv' | 'markdown' | 'sql';

export interface ExportOptions {
  format: ExportFormat;
  pokemon: Pokemon | Pokemon[];
  includeFields?: string[];  // Specific fields to include
  excludeFields?: string[];  // Fields to exclude
}

export class PokemonExporter {
  /**
   * Export to JSON
   */
  exportToJSON(pokemon: Pokemon | Pokemon[]): string {
    return JSON.stringify(pokemon, null, 2);
  }

  /**
   * Export to CSV
   */
  exportToCSV(pokemon: Pokemon | Pokemon[]): string {
    const pokemonList = Array.isArray(pokemon) ? pokemon : [pokemon];
    
    if (pokemonList.length === 0) return '';
    
    // Define CSV columns
    const columns = ['id', 'name', 'height', 'weight', 'base_experience', 
                     'types', 'abilities', 'hp', 'attack', 'defense', 
                     'special_attack', 'special_defense', 'speed', 'total_stats'];
    
    // Header
    const header = columns.join(',');
    
    // Rows
    const rows = pokemonList.map(p => {
      const stats: Record<string, number> = {};
      p.stats.forEach(s => {
        stats[s.stat.name.replace('-', '_')] = s.base_stat;
      });
      
      return [
        p.id,
        `"${p.name}"`,
        p.height,
        p.weight,
        p.base_experience,
        `"${p.types.map(t => t.type.name).join(';')}"`,
        `"${p.abilities.map(a => `${a.ability.name}:${a.is_hidden ? 'hidden' : 'normal'}`).join(';')}"`,
        stats.hp || 0,
        stats.attack || 0,
        stats.defense || 0,
        stats.special_attack || 0,
        stats.special_defense || 0,
        stats.speed || 0,
        p.stats.reduce((sum, s) => sum + s.base_stat, 0)
      ].join(',');
    });
    
    return [header, ...rows].join('\n');
  }

  /**
   * Export to TSV
   */
  exportToTSV(pokemon: Pokemon | Pokemon[]): string {
    return this.exportToCSV(pokemon).replace(/,/g, '\t');
  }

  /**
   * Export to Markdown
   */
  exportToMarkdown(pokemon: Pokemon | Pokemon[]): string {
    const pokemonList = Array.isArray(pokemon) ? pokemon : [pokemon];
    
    if (pokemonList.length === 0) return '';
    
    const sections: string[] = [];
    
    pokemonList.forEach(p => {
      const lines: string[] = [];
      
      lines.push(`# #${p.id} - ${p.name.charAt(0).toUpperCase() + p.name.slice(1)}`);
      lines.push('');
      
      // Basic Info
      lines.push('## Basic Information');
      lines.push('');
      lines.push(`| Property | Value |`);
      lines.push(`|----------|-------|`);
      lines.push(`| ID | ${p.id} |`);
      lines.push(`| Height | ${p.height / 10}m |`);
      lines.push(`| Weight | ${p.weight / 10}kg |`);
      lines.push(`| Base Experience | ${p.base_experience} |`);
      lines.push('');
      
      // Types
      lines.push('## Types');
      lines.push('');
      p.types.sort((a, b) => a.slot - b.slot).forEach(t => {
        lines.push(`- ${t.type.name.charAt(0).toUpperCase() + t.type.name.slice(1)}`);
      });
      lines.push('');
      
      // Stats
      lines.push('## Stats');
      lines.push('');
      lines.push(`| Stat | Base Value |`);
      lines.push(`|------|------------|`);
      p.stats.forEach(s => {
        const name = s.stat.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        lines.push(`| ${name} | ${s.base_stat} |`);
      });
      const totalStats = p.stats.reduce((sum, s) => sum + s.base_stat, 0);
      lines.push(`| **Total** | **${totalStats}** |`);
      lines.push('');
      
      // Abilities
      lines.push('## Abilities');
      lines.push('');
      p.abilities.forEach(a => {
        const abilityName = a.ability.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
        const hiddenTag = a.is_hidden ? ' (Hidden)' : '';
        lines.push(`- ${abilityName}${hiddenTag}`);
      });
      lines.push('');
      
      // Sprites
      if (p.sprites.front_default) {
        lines.push('## Sprites');
        lines.push('');
        lines.push(`![${p.name}](${p.sprites.front_default})`);
        lines.push('');
      }
      
      sections.push(lines.join('\n'));
    });
    
    return sections.join('\n---\n\n');
  }

  /**
   * Export to SQL INSERT statements
   */
  exportToSQL(pokemon: Pokemon | Pokemon[]): string {
    const pokemonList = Array.isArray(pokemon) ? pokemon : [pokemon];
    
    if (pokemonList.length === 0) return '';
    
    const statements: string[] = [];
    
    // Create table statement
    statements.push(`CREATE TABLE IF NOT EXISTS pokemon (`);
    statements.push(`  id INTEGER PRIMARY KEY,`);
    statements.push(`  name VARCHAR(50) NOT NULL,`);
    statements.push(`  height REAL,`);
    statements.push(`  weight REAL,`);
    statements.push(`  base_experience INTEGER,`);
    statements.push(`  types VARCHAR(100),`);
    statements.push(`  hp INTEGER,`);
    statements.push(`  attack INTEGER,`);
    statements.push(`  defense INTEGER,`);
    statements.push(`  special_attack INTEGER,`);
    statements.push(`  special_defense INTEGER,`);
    statements.push(`  speed INTEGER,`);
    statements.push(`  total_stats INTEGER`);
    statements.push(`);`);
    statements.push('');
    
    // Insert statements
    pokemonList.forEach(p => {
      const stats: Record<string, number> = {};
      p.stats.forEach(s => {
        const key = s.stat.name.replace('-', '_');
        stats[key] = s.base_stat;
      });
      
      const types = p.types.map(t => t.type.name).join(',');
      
      const insert = `INSERT INTO pokemon (id, name, height, weight, base_experience, types, hp, attack, defense, special_attack, special_defense, speed, total_stats) VALUES (` +
        `${p.id}, ` +
        `'${p.name.replace(/'/g, "''")}', ` +
        `${p.height}, ` +
        `${p.weight}, ` +
        `${p.base_experience}, ` +
        `'${types}', ` +
        `${stats.hp}, ` +
        `${stats.attack}, ` +
        `${stats.defense}, ` +
        `${stats.special_attack}, ` +
        `${stats.special_defense}, ` +
        `${stats.speed}, ` +
        `${p.stats.reduce((sum, s) => sum + s.base_stat, 0)}` +
        `);`;
      
      statements.push(insert);
    });
    
    return statements.join('\n');
  }

  /**
   * Generic export function
   */
  export(options: ExportOptions): string {
    switch (options.format) {
      case 'json':
        return this.exportToJSON(options.pokemon);
      case 'csv':
        return this.exportToCSV(options.pokemon);
      case 'tsv':
        return this.exportToTSV(options.pokemon);
      case 'markdown':
        return this.exportToMarkdown(options.pokemon);
      case 'sql':
        return this.exportToSQL(options.pokemon);
      default:
        throw new Error(`Unknown format: ${options.format}`);
    }
  }

  /**
   * Fetch and export a range of Pokemon
   */
  async exportPokemonRange(
    client: PokemonClient,
    startId: number,
    endId: number,
    format: ExportFormat
  ): Promise<string> {
    const pokemon: Pokemon[] = [];
    const errors: number[] = [];
    
    console.log(`Fetching Pokemon ${startId}-${endId}...`);
    
    for (let id = startId; id <= endId; id++) {
      const p = await client.getPokemon(id);
      if (p) {
        pokemon.push(p);
        process.stdout.write(`\r✓ ${pokemon.length}/${endId - startId + 1} fetched`);
      } else {
        errors.push(id);
        process.stdout.write(`\r✗ ${id} failed`);
      }
    }
    
    console.log('\n');
    
    if (errors.length > 0) {
      console.warn(`Failed to fetch Pokemon IDs: ${errors.join(', ')}`);
    }
    
    return this.export({ format, pokemon });
  }
}

// CLI usage
export async function main(args: string[]) {
  const exporter = new PokemonExporter();
  const client = new PokemonClient();
  
  const format = (args.find(a => a.startsWith('--format='))?.split('=')[1] || 'json') as ExportFormat;
  const start = parseInt(args.find(a => a.startsWith('--start='))?.split('=')[1] || '1');
  const end = parseInt(args.find(a => a.startsWith('--end='))?.split('=')[1] || '151');
  const output = args.find(a => a.startsWith('--output='))?.split('=')[1];
  
  const data = await exporter.exportPokemonRange(client, start, end, format);
  
  if (output) {
    await Deno.writeTextFile(output, data);
    console.log(`💾 Saved to ${output}`);
  } else {
    console.log(data);
  }
}

if (import.meta.main) {
  main(Deno.args);
}
