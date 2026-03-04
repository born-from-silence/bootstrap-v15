# Poké-Finder 🔍

A comprehensive Pokémon resource gathering and management toolkit for Bootstrap-v15.

## 🎯 Features

- **PokemonClient** - Full-featured PokeAPI client
- **SpriteDownloader** - Download sprites in various styles
- **DataExporter** - Export data to JSON, CSV, TSV, Markdown, SQL
- **Resource Guide** - Comprehensive documentation of all Pokémon resources

## 📁 Structure

```
poke-finder/
├── README.md                      # This file
├── Pokemon_Resources_Guide.md     # Comprehensive resource documentation
├── src/
│   ├── pokemon-client.ts          # PokeAPI client
│   ├── sprite-downloader.ts      # Sprite download utility
│   └── data-exporter.ts          # Data export utility
├── package.json
└── deno.json
```

## 🚀 Quick Start

### Deno

```bash
# Run Pokemon client example
deno run --allow-net src/pokemon-client.ts

# Download official artwork for Gen 1
deno run --allow-net --allow-write src/sprite-downloader.ts --type=official-artwork --start=1 --end=151 --output=./sprites

# Export to CSV
deno run --allow-net --allow-write src/data-exporter.ts --format=csv --start=1 --end=151 --output=pokemon.csv
```

### Node.js

```bash
# Install dependencies
npm install

# Build TypeScript
npx tsc

# Run example
node dist/pokemon-client.js
```

## 📖 Usage Examples

### Pokemon Client

```typescript
import { PokemonClient } from './src/pokemon-client.ts';

const client = new PokemonClient();

// Get a Pokémon
const pikachu = await client.getPokemon('pikachu');
console.log(pikachu.name);           // "pikachu"
console.log(pikachu.base_experience);  // 112

// Search
const results = await client.searchPokemon('char');
// => [{ name: 'charmander', ... }, { name: 'charmeleon', ... }, ...]

// Get by type
const fireTypes = await client.getPokemonByType('fire');

// Calculate total stats
const totalStats = client.calculateTotalStats(pikachu);

// Get sprite URLs
const sprites = client.getSpriteUrls(pikachu);
// => { default: "...", shiny: "...", official: "...", home: "..." }
```

### Sprite Downloader

```typescript
import { SpriteDownloader } from './src/sprite-downloader.ts';

const downloader = new SpriteDownloader();

// Download specific sprites
await downloader.downloadRange({
  startId: 1,
  endId: 151,
  spriteType: 'official-artwork',  // or 'default', 'home', 'generation-v', etc.
  outputDir: './sprites',
  shiny: false
});

// Download specific Pokémon
await downloader.downloadSpecific(
  [6, 25, 150, 151],              // Charizard, Pikachu, Mewtwo, Mew
  'official-artwork',
  './favorite-pokemon',
  true                              // shiny versions
);

// Get available sprite types
console.log(downloader.getSpriteTypes());
```

### Data Exporter

```typescript
import { PokemonExporter, PokemonClient } from './src/*.ts';

const client = new PokemonClient();
const exporter = new PokemonExporter();

// Fetch and export a range
const data = await exporter.exportPokemonRange(
  client, 1, 151, 'csv'  // or 'json', 'tsv', 'markdown', 'sql'
);

// Export specific Pokémon
const pokemon = await client.getPokemon(25);

// To JSON
const json = exporter.exportToJSON(pokemon);

// To CSV
const csv = exporter.exportToCSV(pokemon);

// To Markdown
const markdown = exporter.exportToMarkdown(pokemon);

// To SQL
const sql = exporter.exportToSQL(pokemon);
```

## 📊 Data Available

Each Pokémon entry includes:

- **Basic Info**: ID, name, height, weight, base_experience
- **Stats**: HP, Attack, Defense, Special Attack, Special Defense, Speed
- **Types**: Primary and secondary types
- **Abilities**: Normal and hidden abilities
- **Moves**: Learnable moves
- **Sprites**: Multiple generations and styles
- **Evolution**: Evolution chain data
- **Species**: Species information

## 🖼️ Sprite Types

- `default` - Standard game sprites
- `official-artwork` - High-resolution artwork (recommended)
- `home` - Pokémon Home style
- `generation-i` through `generation-viii` - Era-specific sprites
- `shiny` - Alternative color versions

## ⚙️ API Rate Limits

PokeAPI free tier: 100 requests per minute

The PokemonClient automatically implements rate limiting to respect this constraint.

## 🔧 Configuration

```typescript
// Adjust rate limiting
const client = new PokemonClient();
// Built-in: 600ms delay (100 requests/min)

// Adjust download delay
const downloader = new SpriteDownloader();
// Default: 100ms between downloads
```

## 📚 Resources Included

### In Repository
- Pokemon_Resources_Guide.md - Comprehensive API and resource documentation
- Full TypeScript client with type definitions
- Sprite download utilities
- Export tools for multiple formats

### External Resources Referenced
- **PokeAPI** - Primary data source (https://pokeapi.co/)
- **Pokemon TCG API** - Trading card data (https://pokemontcg.io/)
- **Veekun Pokedex** - SQLite database (https://github.com/veekun/pokedex)
- **Kaggle Datasets** - CSV datasets for analysis
- Showdown sprites - Battle sprites (Pokemon Showdown)

## 🎨 Output Examples

### JSON Export
```json
{
  "id": 25,
  "name": "pikachu",
  "height": 4,
  "weight": 60,
  "types": ["electric"],
  "stats": {
    "hp": 35,
    "attack": 55,
    "defense": 40,
    "special_attack": 50,
    "special_defense": 50,
    "speed": 90
  }
}
```

### CSV Export
```csv
id,name,height,weight,types,hp,attack,defense,special_attack,special_defense,speed,total_stats
25,pikachu,4,60,electric,35,55,40,50,50,90,320
```

### SQL Export
```sql
CREATE TABLE IF NOT EXISTS pokemon (
  id INTEGER PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  ...
);

INSERT INTO pokemon (...) VALUES (25, 'pikachu', 4, 60, ...);
```

## ⚠️ Usage Notes

1. **Rate Limiting**: Be respectful of PokeAPI's 100 requests/minute limit
2. **Caching**: Consider caching responses for repeated operations
3. **Sprites**: Sprites are downloaded from GitHub (PokeAPI sprites repo)
4. **Attribution**: Credit PokeAPI when using their data
5. **Non-Commercial**: Most APIs are for non-commercial use only

## 🔗 Links

- **PokeAPI Docs**: https://pokeapi.co/docs/v2
- **GitHub**: https://github.com/PokeAPI/pokeapi
- **Community**: r/pokemondev on Reddit
- **Discord**: PokeAPI community Discord

## 📝 License

These tools are for educational and personal use. Respect the terms of service of APIs used.

---

*Created by Bootstrap-v15 for resource gathering and exploration* 🎯
