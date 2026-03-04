#!/bin/bash
# Pokémon Resource Downloader Script
# Bootstrap-v15 - Resource Gathering Tool

echo "================================"
echo "   Poké-Finder Resource Tool   "
echo "================================"
echo ""

# Create directories
mkdir -p sprites/{default,official,shiny}
mkdir -p data
mkdir -p docs

# Function to show usage
show_usage() {
  echo "Usage: ./download-resources.sh [OPTION]"
  echo ""
  echo "Options:"
  echo "  --gen1          Download Generation 1 Pokemon (1-151)"
  echo "  --gen2          Download Generation 2 Pokemon (152-251)"
  echo "  --gen3          Download Generation 3 Pokemon (252-386)"
  echo "  --starters      Download starter Pokemon from all generations"
  echo "  --legendary     Download legendary Pokemon"
  echo "  --favorites     Download popular Pokemon (Pikachu, Charizard, Mewtwo, etc.)"
  echo "  --all           WARNING: Downloads all Pokemon (1000+)"
  echo "  --guide         Show the resource guide"
  echo "  --help          Show this help message"
  echo ""
}

# Download function
download_sprites() {
  local start=$1
  local end=$2
  local type=$3
  local dir=$4
  
  echo "📥 Downloading ${type} sprites ${start}-${end}..."
  
  for ((i=start; i<=end; i++)); do
    if [ "$type" = "official" ]; then
      url="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${i}.png"
    elif [ "$type" = "shiny" ]; then
      url="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${i}.png"
    else
      url="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png"
    fi
    
    curl -sL "$url" -o "${dir}/${i}.png" &
    
    # Limit concurrent downloads
    if (( $(jobs -r | wc -l) >= 10 )); then
      wait
    fi
    
    # Progress indicator
    if (( i % 10 == 0 )); then
      echo "  Progress: ${i}/${end}"
    fi
  done
  
  wait
  echo "✅ Downloaded ${type} sprites ${start}-${end}"
}

# Parse arguments
case "$1" in
  --gen1)
    echo "Downloading Generation 1 Pokemon (151)..."
    download_sprites 1 151 default sprites/default
    download_sprites 1 151 official sprites/official
    echo "Gen 1 complete!"
    ;;
    
  --gen2)
    echo "Downloading Generation 2 Pokemon (152-251)..."
    download_sprites 152 251 default sprites/default
    download_sprites 152 251 official sprites/official
    echo "Gen 2 complete!"
    ;;
    
  --gen3)
    echo "Downloading Generation 3 Pokemon (252-386)..."
    download_sprites 252 386 default sprites/default
    download_sprites 252 386 official sprites/official
    echo "Gen 3 complete!"
    ;;
    
  --starters)
    echo "Downloading starter Pokemon..."
    starters=(1 2 3 4 5 6 7 8 9 152 153 154 155 156 157 158 159 160 252 253 254 255 256 257 258 259 260)
    for id in "${starters[@]}"; do
      curl -sL "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" -o "sprites/official/${id}.png"
      echo "Downloaded Pokemon #${id}"
    done
    echo "Starters complete!"
    ;;
    
  --legendary)
    echo "Downloading legendary Pokemon..."
    legendaries=(144 145 146 150 151 243 244 245 249 250 251 377 378 379 380 381 382 383 384 385 386)
    for id in "${legendaries[@]}"; do
      curl -sL "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" -o "sprites/official/${id}.png"
      echo "Downloaded Legendary #${id}"
    done
    echo "Legendaries complete!"
    ;;
    
  --favorites)
    echo "Downloading favorite Pokemon..."
    favorites=(6 25 26 94 130 149 150 151 196 197 248 251 448 491 493 640 700 718 800 888 892 1000)
    for id in "${favorites[@]}"; do
      curl -sL "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png" -o "sprites/official/${id}.png"
      echo "Downloaded favorite #${id}"
    done
    echo "Favorites complete!"
    ;;
    
  --all)
    echo "⚠️  WARNING: This will download all 1000+ Pokemon!"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
      echo "Starting complete download..."
      download_sprites 1 1010 default sprites/default
      download_sprites 1 1010 official sprites/official
      echo "All Pokemon downloaded!"
    else
      echo "Cancelled."
    fi
    ;;
    
  --guide)
    echo ""
    echo "📖 Pokémon Resource Guide"
    echo "========================="
    head -100 Pokemon_Resources_Guide.md
    echo "..."
    tail -50 Pokemon_Resources_Guide.md
    ;;
    
  --help|--usage|"")
    show_usage
    ;;
    
  *)
    echo "Unknown option: $1"
    show_usage
    exit 1
    ;;
esac

echo ""
echo "================================"
echo "   Resources downloaded to:     "
echo "   ./sprites/default/          "
echo "   ./sprites/official/         "
echo "================================"
