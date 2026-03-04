# Poké-Finder Quick Reference 🎯

## 🚀 One-Liners

```bash
# Download Pikachu sprite
curl -o pikachu.png https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png

# Get Pokemon data
curl https://pokeapi.co/api/v2/pokemon/pikachu/

# Export first gen to CSV
deno run --allow-net --allow-write src/data-exporter.ts --format=csv --start=1 --end=151 --output=gen1.csv
```

---

## 📦 Module Imports

```typescript
import { PokemonClient } from './src/pokemon-client.ts';
import { SpriteDownloader } from './src/sprite-downloader.ts';
import { PokemonExporter } from './src/data-exporter.ts';
```

---

## 🔑 Key Methods

### PokemonClient
| Method | Returns | Purpose |
|--------|---------|---------|
| `getPokemon(id/name)` | Pokemon | Fetch single Pokemon |
| `getPokemonList(limit, offset)` | Paginated results | Get list of Pokemon |
| `getAllPokemon()` | Array | All Pokemon (1000+) |
| `searchPokemon(query)` | Array | Search by name pattern |
| `getType(name)` | Type data | Type information |
| `getStatsTotal(pokemon)` | Number | Sum of base stats |
| `getSpriteUrls(pokemon)` | Object | All sprite URLs |

### SpriteDownloader
| Method | Purpose |
|--------|---------|
| `downloadRange(options)` | Download range |
| `downloadSpecific(ids, type, dir, shiny)` | Download specific |
| `getSpriteTypes()` | List available types |

### PokemonExporter
| Method | Output |
|--------|--------|
| `exportToJSON(pokemon)` | JSON string |
| `exportToCSV(pokemon)` | CSV data |
| `exportToTSV(pokemon)` | TSV data |
| `exportToMarkdown(pokemon)` | Markdown |
| `exportToSQL(pokemon)` | SQL INSERTs |
| `export({format, pokemon})` | Generic export |

---

## 🖼️ Sprite URLs

```
Default:        /pokemon/{id}.png
Official Art:   /other/official-artwork/{id}.png
Home:           /other/home/{id}.png
Shiny:          /pokemon/shiny/{id}.png
Animated:       /versions/generation-v/black-white/animated/{id}.gif
```

Base: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/`

---

## 📊 Data Structure

```typescript
Pokemon {
  id: number;
  name: string;
  height: number;    // decimeters
  weight: number;    // hectograms
  base_experience: number;
  types: [{ slot, type }];
  stats: [{ base_stat, effort, stat }];
  abilities: [{ ability, is_hidden, slot }];
  moves: [{ move, version_group_details }];
  sprites: {
    front_default, back_default,
    front_shiny, back_shiny,
    other: { official-artwork, home, dream_world }
  };
}
```

---

## 🎨 Export Formats

| Format | Command | Output |
|--------|---------|--------|
| JSON | `--format=json` | Structured data |
| CSV | `--format=csv` | Spreadsheet |
| TSV | `--format=tsv` | Tab-delimited |
| Markdown | `--format=markdown` | Documentation |
| SQL | `--format=sql` | Database inserts |

---

## 🔍 Common Queries

```typescript
// Get starter Pokemon
const starters = [1, 4, 7, 152, 155, 158, 252, 255, 258];

// Get legendaries
const legendary = [144, 145, 146, 150, 151, /* ... */];

// Popular Pokemon
const favorites = [6, 25, 94, 130, 150, 151];

// Eeveelutions
const eeveelutions = [133, 134, 135, 136, 196, 197, 470, 471, 700];
```

---

## ⚡ Rate Limits

- **PokeAPI**: 100 req/min per IP
- Built-in delay: 600ms between requests
- Be respectful, cache results!

---

## 🛠️ CLI Commands

```bash
# Bash script
./download-resources.sh --gen1      # Gen 1 (1-151)
./download-resources.sh --gen2      # Gen 2 (152-251)
./download-resources.sh --starters   # All starters
./download-resources.sh --legendary # Legendaries
./download-resources.sh --favorites  # Favorites
./download-resources.sh --all        # All Pokemon

# Deno directly
deno run --allow-net examples/demo.ts
deno run --allow-net --allow-write src/sprite-downloader.ts
```

---

## 📚 Resources

| Resource | URL |
|----------|-----|
| PokeAPI | https://pokeapi.co/ |
| Docs | https://pokeapi.co/docs/v2 |
| Sprites | https://github.com/PokeAPI/sprites |
| TCG API | https://pokemontcg.io/ |

---

*Quick reference for Bootstrap-v15's Poké-Finder toolkit* 🎯
