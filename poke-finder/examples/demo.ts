/**
 * Poké-Finder Demo
 * Simple example showing how to use the Pokémon client
 */

// Import the PokemonClient
import { PokemonClient } from '../src/pokemon-client.ts';

async function demo() {
  const client = new PokemonClient();
  
  console.log('╔════════════════════════════════════════════╗');
  console.log('║            Poké-Finder Demo                ║');
  console.log('╚════════════════════════════════════════════╝\n');
  
  // Get Pikachu
  console.log('⚡ Fetching Pikachu data...');
  const pikachu = await client.getPokemon('pikachu');
  
  if (pikachu) {
    console.log('\n📊 Pikachu Stats:');
    console.log(`   ID: #${pikachu.id}`);
    console.log(`   Name: ${pikachu.name}`);
    console.log(`   Height: ${pikachu.height / 10}m`);
    console.log(`   Weight: ${pikachu.weight / 10}kg`);
    console.log(`   Base XP: ${pikachu.base_experience}`);
    console.log(`   Types: ${pikachu.types.map(t => t.type.name).join(' / ')}`);
    
    console.log('\n 💥 Stats:');
    pikachu.stats.forEach(stat => {
      const name = stat.stat.name.replace('-', ' ').toUpperCase();
      const bar = '█'.repeat(Math.floor(stat.base_stat / 10));
      console.log(`   ${name.padEnd(15)} ${String(stat.base_stat).padStart(3)} ${bar}`);
    });
    
    const totalStats = client.calculateTotalStats(pikachu);
    console.log(`   ${'TOTAL'.padEnd(15)} ${String(totalStats).padStart(3)}`);
    
    const sprites = client.getSpriteUrls(pikachu);
    console.log('\n 🖼️ Sprite URLs:');
    console.log('   Default:', sprites.default);
    console.log('   Shiny:', sprites.shiny);
    console.log('   Official Artwork:', sprites.official);
  }
  
  // Get Charizard
  console.log('\n\n🔥 Fetching Charizard data...');
  const charizard = await client.getPokemon(6);
  
  if (charizard) {
    console.log(`\n📊 Charizard Stats:`);
    console.log(`   ID: #${charizard.id}`);
    console.log(`   Name: ${charizard.name}`);
    console.log(`   Types: ${charizard.types.map(t => t.type.name).join(' / ')}`);
    console.log(`   Total Stats: ${client.calculateTotalStats(charizard)}`);
  }
  
  // Search by type
  console.log('\n\n🌌 Fetching all Dark-type Pokemon (first 10)...');
  const darkTypes = await client.getPokemonByType('dark');
  if (darkTypes && darkTypes.pokemon) {
    const darkPokemon = darkTypes.pokemon.slice(0, 10);
    console.log('\n   Dark-type Pokemon:');
    darkPokemon.forEach((p: any, i: number) => {
      console.log(`   ${i + 1}. ${p.pokemon.name}`);
    });
  }
  
  // Search by name pattern
  console.log('\n\n🔍 Searching for "char" Pokemon...');
  const charResults = await client.searchPokemon('char');
  console.log('   Matches:', charResults.map(p => p.name).join(', '));
  
  console.log('\n\n✅ Demo complete!');
  console.log('\nTry running other examples:');
  console.log('  deno run --allow-net examples/demo.ts');
  console.log('  deno run --allow-net --allow-write src/sprite-downloader.ts');
  console.log('  deno run --allow-net --allow-write src/data-exporter.ts');
}

demo().catch(console.error);
