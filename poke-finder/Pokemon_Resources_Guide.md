# Pokémon Resource Gathering Guide 🎮

*Compiled for Bootstrap-v15 Resource Gathering Initiative*

---

## 📊 APIs & Databases

### 1. **PokeAPI** (The Gold Standard)
- **URL**: https://pokeapi.co/
- **Features**:
  - RESTful API with data on all Pokémon (sprites, stats, moves, abilities, types)
  - GraphQL support available
  - Free, no API key required
  - Rate limit: 100 requests per minute per IP
  - Response format: JSON
- **Key Endpoints**:
  ```
  GET https://pokeapi.co/api/v2/pokemon/{id or name}/
  GET https://pokeapi.co/api/v2/type/{id or name}/
  GET https://pokeapi.co/api/v2/move/{id or name}/
  GET https://pokeapi.co/api/v2/ability/{id or name}/
  GET https://pokeapi.co/api/v2/berry/{id or name}/
  GET https://pokeapi.co/api/v2/item/{id or name}/
  ```
- **GitHub**: https://github.com/PokeAPI/pokeapi

### 2. **Pokemon TCG API**
- **URL**: https://pokemontcg.io/
- **Features**:
  - Trading card game data
  - Card images, prices, sets, rarities
  - SDKs available for multiple languages
- **Pricing**: Free tier available

### 3. **GraphQL Pokémon**
- **URL**: https://graphqlpokemon.favware.tech/
- **Features**:
  - GraphQL interface for Pokémon data
  - Built on top of PokeAPI data
  - Real-time queries with specific field selection

---

## 🖼️ Sprites & Images

### 1. **PokeAPI Sprites** (Official Game Sprites)
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/{id}.gif
```

### 2. **Sprite Categories Available**:
- Default sprites (front/back, normal/shiny)
- Generation-specific sprites (Gen I-VII)
- Animated sprites (Black/White style)
- Dream World artwork
- Official artwork (high resolution)

### 3. **High-Resolution Official Artwork**
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/{id}.png
```

### 4. **Home Sprites** (Pokémon Home style)
```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/{id}.png
```

### 5. **Showdown Sprites** (Pokémon Showdown battle sprites)
```
https://play.pokemonshowdown.com/sprites/ani/{pokemon-name}.gif
https://play.pokemonshowdown.com/sprites/gen5ani/{pokemon-name}.gif
```

---

## 📁 Data Resources

### 1. **Veekun Pokédex Data**
- **GitHub**: https://github.com/veekun/pokedex
- **Features**:
  - Complete Pokemon database in SQLite format
  - CSV exports available
  - Python library for data access
  - Complete coverage of all games

### 2. **Pokemon CSV Dataset**
- **URL**: https://www.kaggle.com/datasets/rounakbanik/pokemon
- **Features**: Over 800 Pokemon with stats across 7 generations

### 3. **Pokemon with stats Dataset**
- **Kaggle**: https://www.kaggle.com/datasets/abcsds/pokemon
- **Features**: Pokemon stats, types, and classifications

### 4. **Open Images Pokemon**
- **URL**: https://storage.googleapis.com/openimages/web/visualizer/index.html?set=train&type=segmentation
- **Features**: Real-world Pokemon images for ML training

---

## 🧬 Specialized Resources

### 1. **Pokemon Damage Calculator**
- **URL**: https://calc.pokemonshowdown.com/
- **API**: Available for programmatic damage calculations

### 2. **Pokemon Smogon Usage Stats**
- **URL**: https://www.smogon.com/stats/
- **Features**: Competitive usage statistics by tier

### 3. **Pokemon Go API Resources**
- **URL**: https://pogoapi.net/
- **Features**: Pokemon Go specific data (moves, stats, research)

### 4. **Pokemon Type Effectiveness Chart**
- Built into most APIs, but also available as standalone JSON:
```json
{
  "normal": {"weak": ["rock", "steel"], "immune": ["ghost"]},
  "fire": {"strong": ["grass", "ice", "bug", "steel"], "weak": ["water", "rock", "fire", "dragon"]}
}
```

---

## 💻 Code Libraries & SDKs

### Python
```bash
pip install pokepy          # PokeAPI wrapper
pip install pokebase        # Another PokeAPI wrapper
pip install pokemon-tcg-sdk # TCG API SDK
```

### JavaScript/Node.js
```bash
npm install pokedex-promise-v2
npm install pokeapi-js-wrapper
npm install pokemon-tcg-sdk-javascript
```

### Other Languages
- **Java**: pokekotlin
- **Go**: pokego
- **Ruby**: pokeapi
- **Rust**: pokeapi

---

## 📈 Sample API Request

### Fetch Pokemon Data (curl)
```bash
# Get Pikachu data
curl https://pokeapi.co/api/v2/pokemon/pikachu/

# Get all Pokemon (paginated)
curl https://pokeapi.co/api/v2/pokemon?limit=151&offset=0

# Get evolution chain
curl https://pokeapi.co/api/v2/evolution-chain/1/
```

### Python Example
```python
import requests

def get_pokemon(name):
    url = f"https://pokeapi.co/api/v2/pokemon/{name.lower()}"
    response = requests.get(url)
    return response.json() if response.status_code == 200 else None

pikachu = get_pokemon("pikachu")
print(f"ID: {pikachu['id']}")
print(f"Height: {pikachu['height']}")
print(f"Weight: {pikachu['weight']}")
```

---

## 🗂️ Data Structure Overview

Each Pokemon entry typically includes:
- **id**: National Pokedex number
- **name**: Pokemon name
- **base_experience**: Base experience yield
- **height**: Height in decimeters
- **weight**: Weight in hectograms
- **abilities**: List of abilities
- **forms**: Alternate forms
- **game_indices**: Game-specific indices
- **held_items**: Items the Pokemon can hold
- **location_area_encounters**: Encounter locations
- **moves**: Learnable moves
- **species**: Species information
- **sprites**: Image URLs (front_default, back_default, etc.)
- **stats**: Base stats (HP, Attack, Defense, etc.)
- **types**: Primary and secondary types

---

## 🎨 Asset Download Scripts

### Download All Gen 1 Sprites
```bash
#!/bin/bash
mkdir -p pokemon_sprites
for i in {1..151}; do
    curl -o "pokemon_sprites/$i.png" \
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/$i.png"
done
echo "Downloaded 151 Pokemon sprites!"
```

### Download Official Artwork
```bash
#!/bash
mkdir -p pokemon_artwork
for i in {1..1010}; do
    curl -o "pokemon_artwork/$i.png" \
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/$i.png"
done
```

---

## 📚 Additional Resources

### Community & Documentation
- **PokeAPI Docs**: https://pokeapi.co/docs/v2
- **r/pokemondev**: https://www.reddit.com/r/pokemondev/
- **PokeAPI Discord**: https://discord.gg/tcg

### Tools
- **Pokemon Fusion**: https://pokemon.alexonsager.net/
- **Pokemon Showdown**: https://play.pokemonshowdown.com/
- **Pokemon Database**: https://pokemondb.net/
- **Serebii**: https://www.serebii.net/
- **Bulbapedia**: https://bulbapedia.bulbagarden.net/

---

## ⚠️ Usage Notes

1. **Rate Limiting**: Be respectful of API rate limits
2. **Caching**: Cache responses to reduce server load
3. **Attribution**: Credit PokeAPI and other sources when using their data
4. **No Commercial Use**: Most free Pokemon resources are for non-commercial use only

---

*Resource gathering complete. Ready for implementation.* 🎯
