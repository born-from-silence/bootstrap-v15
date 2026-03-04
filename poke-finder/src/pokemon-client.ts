/**
 * Pokémon Resource Client
 * A TypeScript utility for fetching and managing Pokémon data
 * Bootstrap-v15 Resource Gathering Tools
 */

export interface Pokemon {
  id: number;
  name: string;
  base_experience: number;
  height: number;
  weight: number;
  abilities: PokemonAbility[];
  forms: { name: string; url: string }[];
  moves: PokemonMove[];
  species: { name: string; url: string };
  sprites: PokemonSprites;
  stats: PokemonStat[];
  types: PokemonType[];
}

export interface PokemonAbility {
  ability: { name: string; url: string };
  is_hidden: boolean;
  slot: number;
}

export interface PokemonMove {
  move: { name: string; url: string };
  version_group_details: {
    level_learned_at: number;
    move_learn_method: { name: string; url: string };
    version_group: { name: string; url: string };
  }[];
}

export interface PokemonSprites {
  back_default: string | null;
  back_female: string | null;
  back_shiny: string | null;
  back_shiny_female: string | null;
  front_default: string | null;
  front_female: string | null;
  front_shiny: string | null;
  front_shiny_female: string | null;
  other?: {
    dream_world?: { front_default: string | null; front_female: string | null };
    home?: { front_default: string | null; front_female: string | null };
    'official-artwork'?: { front_default: string | null; front_shiny: string | null };
  };
  versions?: Record<string, any>;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: { name: string; url: string };
}

export interface PokemonType {
  slot: number;
  type: { name: string; url: string };
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export class PokemonClient {
  private baseUrl = 'https://pokeapi.co/api/v2';
  private rateLimitDelay = 600; // ms between requests (100/min)
  private lastRequestTime = 0;

  /**
   * Rate limit handler
   */
  private async respectRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => 
        setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Generic API request handler
   */
  private async request<T>(endpoint: string): Promise<T | null> {
    await this.respectRateLimit();
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json() as T;
    } catch (error) {
      console.error(`Request failed: ${endpoint}`, error);
      return null;
    }
  }

  /**
   * Get a Pokémon by name or ID
   */
  async getPokemon(nameOrId: string | number): Promise<Pokemon | null> {
    const identifier = typeof nameOrId === 'string' 
      ? nameOrId.toLowerCase() 
      : nameOrId;
    return this.request<Pokemon>(`/pokemon/${identifier}/`);
  }

  /**
   * Get list of Pokémon with pagination
   */
  async getPokemonList(limit: number = 20, offset: number = 0): 
    Promise<PaginatedResponse<{ name: string; url: string }>> {
    const response = await this.request<PaginatedResponse<{ name: string; url: string }>>(
      `/pokemon?limit=${limit}&offset=${offset}`
    );
    return response || { count: 0, next: null, previous: null, results: [] };
  }

  /**
   * Get all Pokémon (fetches all pages)
   */
  async getAllPokemon(): Promise<{ name: string; url: string }[]> {
    const firstPage = await this.getPokemonList(100, 0);
    const totalCount = firstPage.count;
    
    if (totalCount === 0) return [];
    
    const pokemon: { name: string; url: string }[] = [...firstPage.results];
    
    // Calculate remaining pages
    const remainingPages = Math.ceil((totalCount - 100) / 100);
    
    for (let i = 0; i < remainingPages; i++) {
      const page = await this.getPokemonList(100, (i + 1) * 100);
      pokemon.push(...page.results);
    }
    
    return pokemon;
  }

  /**
   * Get a specific type
   */
  async getType(nameOrId: string | number): Promise<any | null> {
    const identifier = typeof nameOrId === 'string' 
      ? nameOrId.toLowerCase() 
      : nameOrId;
    return this.request(`/type/${identifier}/`);
  }

  /**
   * Get a specific ability
   */
  async getAbility(nameOrId: string | number): Promise<any | null> {
    const identifier = typeof nameOrId === 'string' 
      ? nameOrId.toLowerCase() 
      : nameOrId;
    return this.request(`/ability/${identifier}/`);
  }

  /**
   * Get a specific move
   */
  async getMove(nameOrId: string | number): Promise<any | null> {
    const identifier = typeof nameOrId === 'string' 
      ? nameOrId.toLowerCase() 
      : nameOrId;
    return this.request(`/move/${identifier}/`);
  }

  /**
   * Get evolution chain
   */
  async getEvolutionChain(id: number): Promise<any | null> {
    return this.request(`/evolution-chain/${id}/`);
  }

  /**
   * Get species information
   */
  async getSpecies(nameOrId: string | number): Promise<any | null> {
    const identifier = typeof nameOrId === 'string' 
      ? nameOrId.toLowerCase() 
      : nameOrId;
    return this.request(`/pokemon-species/${identifier}/`);
  }

  /**
   * Calculate total stats
   */
  calculateTotalStats(pokemon: Pokemon): number {
    return pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
  }

  /**
   * Get official artwork URL
   */
  getOfficialArtworkUrl(pokemon: Pokemon): string | null {
    return pokemon.sprites?.other?.['official-artwork']?.front_default || null;
  }

  /**
   * Get sprite URLs for a Pokémon
   */
  getSpriteUrls(pokemon: Pokemon): {
    default: string | null;
    shiny: string | null;
    official: string | null;
    home: string | null;
  } {
    return {
      default: pokemon.sprites.front_default,
      shiny: pokemon.sprites.front_shiny,
      official: this.getOfficialArtworkUrl(pokemon),
      home: pokemon.sprites?.other?.home?.front_default || null
    };
  }

  /**
   * Search Pokémon by partial name
   */
  async searchPokemon(partialName: string): Promise<{ name: string; url: string }[]> {
    const allPokemon = await this.getAllPokemon();
    const query = partialName.toLowerCase();
    return allPokemon.filter(p => p.name.includes(query));
  }

  /**
   * Get Pokémon by type
   */
  async getPokemonByType(typeName: string): Promise<{ pokemon: { pokemon: { name: string; url: string } }[] } | null> {
    return this.getType(typeName).then(type => {
      if (!type) return null;
      return { pokemon: type.pokemon };
    });
  }
}

// Example usage
export async function exampleUsage() {
  const client = new PokemonClient();
  
  // Get Pikachu
  const pikachu = await client.getPokemon('pikachu');
  if (pikachu) {
    console.log(`ID: ${pikachu.id}`);
    console.log(`Name: ${pikachu.name}`);
    console.log(`Height: ${pikachu.height / 10}m`);
    console.log(`Weight: ${pikachu.weight / 10}kg`);
    console.log(`Types: ${pikachu.types.map(t => t.type.name).join(', ')}`);
    console.log(`Total Stats: ${client.calculateTotalStats(pikachu)}`);
    console.log(`Sprite URLs:`, client.getSpriteUrls(pikachu));
  }
  
  // Get first generation
  const gen1 = await client.getPokemonList(151, 0);
  console.log(`Total Pokemon in database: ${gen1.count}`);
}

// Run if executed directly
if (import.meta.main) {
  exampleUsage();
}
