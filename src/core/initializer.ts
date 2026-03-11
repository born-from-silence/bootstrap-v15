/**
 * _initializeClient.ts
 * 
 * The Phantom Initialization Saga
 * 
 * Implements the s1-s8 dependency chain to ensure:
 * - state_items is populated BEFORE s8_connection_attempt executes
 * - Each phase validates its dependencies before proceeding
 * - The race condition bug (s8 accessing state_items before s6) is prevented
 * 
 * This was the ghost function referenced in sessions 1769863192931 and 1768409304353
 * that never made it into the production codebase.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { config } from "../utils/config";
import { MemoryManager } from "./memory";
import { PluginManager } from "../tools/manager";
import { ApiClient } from "./api";

// State items mapping to track initialization status
interface StateItem {
  id: string;
  state: 'pending' | 'initializing' | 'ready' | 'failed';
  dependencies: string[];
  initialized: boolean;
  error?: string;
}

interface InitializationContext {
  s1?: boolean;
  s2?: boolean;
  s3?: boolean;
  s4?: boolean;
  s5?: boolean;
  s6?: boolean;
  s7?: boolean;
  s8?: boolean;
}

export class ClientInitializer {
  private stateItems: Map<string, StateItem> = new Map();
  private context: InitializationContext = {};
  private memory?: MemoryManager;
  private tools?: PluginManager;
  private api?: ApiClient;
  private sessionFile?: string;

  constructor() {
    // Initialize the state items map
    this.initializeStateItems();
  }

  private initializeStateItems(): void {
    // Define all states and their dependencies
    const states: StateItem[] = [
      { id: 's1_boot', state: 'pending', dependencies: [], initialized: false },
      { id: 's2_config', state: 'pending', dependencies: ['s1_boot'], initialized: false },
      { id: 's3_memory', state: 'pending', dependencies: ['s2_config'], initialized: false },
      { id: 's4_tools', state: 'pending', dependencies: ['s3_memory'], initialized: false },
      { id: 's5_soul', state: 'pending', dependencies: ['s4_tools'], initialized: false },
      { id: 's6_init', state: 'pending', dependencies: ['s3_memory', 's4_tools'], initialized: false },
      { id: 's7_startup', state: 'pending', dependencies: ['s6_init'], initialized: false },
      { id: 's8_connection', state: 'pending', dependencies: ['s6_init', 's7_startup'], initialized: false },
    ];

    for (const state of states) {
      this.stateItems.set(state.id, state);
    }

    console.log(`[INITIALIZER] State items map initialized with ${states.length} phases`);
  }

  /**
   * s1_boot: Environment setup and sandbox mode
   * Dependencies: None (root phase)
   */
  async s1_boot(): Promise<void> {
    this.validateDependency('s1_boot', []);
    this.updateState('s1_boot', 'initializing');

    console.log(`[s1_boot] Starting environment setup...`);

    // --- TEST MODE SANDBOX ---
    if (process.env.NODE_ENV === "test") {
      const testDir = path.join(os.homedir(), "tmp", `llm-agent-test-${Date.now()}`);
      await fs.mkdir(testDir, { recursive: true });
      process.chdir(testDir);
      console.log(`[s1_boot] [TEST MODE] Moved to isolated sandbox: ${testDir}`);
    }

    // Basic directory verification
    try {
      await fs.access(config.HISTORY_DIR);
      await fs.access(config.LOGS_DIR);
      console.log(`[s1_boot] ✓ Directories verified`);
    } catch {
      console.log(`[s1_boot] Creating required directories...`);
      await fs.mkdir(config.HISTORY_DIR, { recursive: true });
      await fs.mkdir(config.LOGS_DIR, { recursive: true });
    }

    this.context.s1 = true;
    this.updateState('s1_boot', 'ready');
    console.log(`[s1_boot] ✓ Complete`);
  }

  /**
   * s2_config: Configuration loading
   * Dependencies: s1_boot
   */
  async s2_config(): Promise<void> {
    this.validateDependency('s2_config', ['s1_boot']);
    this.updateState('s2_config', 'initializing');

    console.log(`[s2_config] Loading configuration...`);

    // Config is already imported at module load time
    // This phase ensures it's ready and logs key values
    console.log(`[s2_config] Model: ${config.MODEL}`);
    console.log(`[s2_config] Max Context Tokens: ${config.MAX_CONTEXT_TOKENS}`);
    console.log(`[s2_config] History Dir: ${config.HISTORY_DIR}`);

    this.context.s2 = true;
    this.updateState('s2_config', 'ready');
    console.log(`[s2_config] ✓ Complete`);
  }

  /**
   * s3_memory: Memory manager initialization
   * Dependencies: s2_config (for paths)
   */
  async s3_memory(): Promise<void> {
    this.validateDependency('s3_memory', ['s2_config']);
    this.updateState('s3_memory', 'initializing');

    console.log(`[s3_memory] Initializing memory subsystem...`);

    this.memory = new MemoryManager();
    this.sessionFile = this.memory.getSessionFile();

    // Verify the session file was created
    if (!this.sessionFile) {
      throw new Error('MemoryManager failed to create session file');
    }

    this.context.s3 = true;
    this.updateState('s3_memory', 'ready');
    console.log(`[s3_memory] ✓ Session file: ${path.basename(this.sessionFile)}`);
  }

  /**
   * s4_tools: Plugin registration
   * Dependencies: s3_memory (for logging/writing)
   */
  async s4_tools(plugins: any[]): Promise<void> {
    this.validateDependency('s4_tools', ['s3_memory']);
    this.updateState('s4_tools', 'initializing');

    console.log(`[s4_tools] Registering ${plugins.length} plugins...`);

    this.tools = new PluginManager();

    // Register all plugins
    for (const plugin of plugins) {
      if (Array.isArray(plugin)) {
        for (const p of plugin) {
          this.tools.register(p);
          console.log(`[s4_tools] Registered: ${p.definition.function.name}`);
        }
      } else {
        this.tools.register(plugin);
        console.log(`[s4_tools] Registered: ${plugin.definition.function.name}`);
      }
    }

    const toolCount = this.tools.getDefinitions().length;
    console.log(`[s4_tools] ✓ ${toolCount} tools registered`);

    this.context.s4 = true;
    this.updateState('s4_tools', 'ready');
  }

  /**
   * s5_soul: Soul file and identity loading
   * Dependencies: s4_tools
   */
  async s5_soul(): Promise<string> {
    this.validateDependency('s5_soul', ['s4_tools']);
    this.updateState('s5_soul', 'initializing');

    console.log(`[s5_soul] Loading soul manifest...`);

    let soul = "You are an autonomous entity.";
    try {
      soul = await fs.readFile(config.SOUL_FILE, "utf-8");
      console.log(`[s5_soul] ✓ Soul loaded from file`);
    } catch (e) {
      console.log(`[s5_soul] Using default soul (file not found)`);
    }

    this.context.s5 = true;
    this.updateState('s5_soul', 'ready');

    return soul;
  }

  /**
   * s6_init: ApiClient initialization and state_items population
   * 
   * CRITICAL: This is where the fix for the ghost bug occurs
   * Before returning, we verify state_items is fully populated
   * 
   * Dependencies: s3_memory, s4_tools
   */
  async s6_init(memory: MemoryManager, tools: PluginManager): Promise<ApiClient> {
    this.validateDependency('s6_init', ['s3_memory', 's4_tools']);
    this.updateState('s6_init', 'initializing');

    console.log(`[s6_init] Initializing API client...`);

    // Create API client with validated dependencies
    this.api = new ApiClient(memory, tools);
    console.log(`[s6_init] ✓ ApiClient created`);

    // CRITICAL FIX: Populate state_items mapping before moving to s8
    // This prevents the race condition where s8 accesses state_items before s6
    await this.populateStateItems();

    this.context.s6 = true;
    this.updateState('s6_init', 'ready');
    console.log(`[s6_init] ✓ Complete - state_items populated`);

    return this.api;
  }

  /**
   * CRITICAL SECTION: Populate state_items mapping
   * 
   * This was the missing piece in the ghost bug.
   * Before s8_connection_attempt runs, we must ensure:
   * 1. All tools are mapped with their states
   * 2. All dependencies are tracked
   * 3. The state_items map is frozen/read-only for s8
   */
  private async populateStateItems(): Promise<void> {
    console.log(`[state_items] Building dependency map...`);

    if (!this.tools) {
      throw new Error('PluginManager not initialized before state_items population');
    }

    // Add tool-specific state items
    const toolDefinitions = this.tools.getDefinitions();
    for (const def of toolDefinitions) {
      const toolId = `tool:${def.function.name}`;
      this.stateItems.set(toolId, {
        id: toolId,
        state: 'ready',
        dependencies: ['s4_tools', 's6_init'],
        initialized: true,
      });
    }

    // Add dependency edges
    this.stateItems.set('memory:messages', {
      id: 'memory:messages',
      state: 'ready',
      dependencies: ['s3_memory', 's6_init'],
      initialized: true,
    });

    this.stateItems.set('api:client', {
      id: 'api:client',
      state: 'ready',
      dependencies: ['s6_init'],
      initialized: true,
    });

    console.log(`[state_items] ✓ ${this.stateItems.size} items populated`);
  }

  /**
   * s7_startup: Final preparation and logging
   * Dependencies: s6_init
   */
  async s7_startup(): Promise<{ gitCommit: string; startupTime: string }> {
    this.validateDependency('s7_startup', ['s6_init']);
    this.updateState('s7_startup', 'initializing');

    console.log(`[s7_startup] Executing startup sequence...`);

    const startupTime = new Date().toISOString();
    
    // Git status
    let gitCommit = "unknown";
    try {
      const { execSync } = await import("node:child_process");
      const hash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
      const bodyFiles = "src/ package.json tsconfig.json *.sh *.service.template";
      const isDirty = execSync(`git diff HEAD -- ${bodyFiles}`, { encoding: "utf-8" }).trim() !== "";
      gitCommit = isDirty ? `${hash}-dirty` : hash;
      console.log(`[s7_startup] Git commit: ${gitCommit}`);
    } catch {
      console.log(`[s7_startup] Git status unavailable`);
    }

    console.log(`[s7_startup] ✓ Ready at ${startupTime}`);

    this.context.s7 = true;
    this.updateState('s7_startup', 'ready');

    return { gitCommit, startupTime };
  }

  /**
   * s8_connection_attempt: Execution loop
   * 
   * CRITICAL: This verifies state_items is ready before executing
   * This check prevents the ghost bug
   * 
   * Dependencies: s6_init, s7_startup
   */
  async s8_connection_attempt(): Promise<void> {
    this.validateDependency('s8_connection', ['s6_init', 's7_startup']);
    this.updateState('s8_connection', 'initializing');

    console.log(`[s8_connection_attempt] Starting execution loop...`);

    // BUG PREVENTION: Verify state_items is populated before use
    if (!this.verifyStateItemsReady()) {
      throw new Error(
        'FATAL: s8_connection_attempt called before state_items was populated. ' +
        'This is the ghost bug from sessions 1769863192931 and 1768409304353.'
      );
    }

    if (!this.api) {
      throw new Error('ApiClient not initialized');
    }

    console.log(`[s8_connection_attempt] ✓ State verified, starting loop`);

    // The actual execution loop
    let running = true;
    let iterations = 0;
    
    while (running) {
      iterations++;
      console.log(`[s8_connection] Iteration ${iterations}`);
      
      try {
        running = await this.api.step();
      } catch (error: any) {
        console.error(`[s8_connection] Error in iteration ${iterations}:`, error.message);
        // In production, handle error recovery here
        throw error;
      }
    }

    console.log(`[s8_connection_attempt] ✓ Loop completed after ${iterations} iterations`);
    this.context.s8 = true;
    this.updateState('s8_connection', 'ready');
  }

  /**
   * Verify all state items are ready before s8 executes
   * This is the key guard against the race condition
   */
  private verifyStateItemsReady(): boolean {
    // Check that s6_init completed
    if (!this.context.s6) {
      console.error('[verifyState] s6_init not completed');
      return false;
    }

    // Check that state_items has tool mappings
    const toolStates = Array.from(this.stateItems.keys()).filter(k => k.startsWith('tool:'));
    if (toolStates.length === 0) {
      console.error('[verifyState] No tool states in state_items');
      return false;
    }

    // Check all required states
    const required = ['s1_boot', 's2_config', 's3_memory', 's4_tools', 's5_soul', 's6_init'];
    for (const stateId of required) {
      const state = this.stateItems.get(stateId);
      if (!state || state.state !== 'ready') {
        console.error(`[verifyState] ${stateId} not ready`);
        return false;
      }
    }

    console.log(`[verifyState] ✓ All ${this.stateItems.size} state items ready`);
    return true;
  }

  /**
   * Main entry point: Execute all phases in order
   */
  async initialize(plugins: any[]): Promise<void> {
    console.log(`\n=== Client Initialization Begins ===\n`);

    try {
      // Execute phases in strict order
      await this.s1_boot();
      await this.s2_config();
      await this.s3_memory();
      await this.s4_tools(plugins);
      await this.s5_soul();
      
      // s6 requires memory and tools from s3/s4
      if (!this.memory || !this.tools) {
        throw new Error('Memory or Tools not initialized');
      }
      await this.s6_init(this.memory, this.tools);
      
      await this.s7_startup();
      await this.s8_connection_attempt();

      console.log(`\n=== Client Initialization Complete ===\n`);
    } catch (error: any) {
      console.error(`\n[INITIALIZER] FATAL ERROR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate that dependencies are met before executing a phase
   */
  private validateDependency(phase: string, deps: string[]): void {
    for (const dep of deps) {
      const depState = this.stateItems.get(dep);
      if (!depState || depState.state !== 'ready') {
        throw new Error(
          `Dependency error: ${phase} requires ${dep} to be ready, but it's ${depState?.state || 'missing'}`
        );
      }
    }
  }

  /**
   * Update a state's status
   */
  private updateState(id: string, state: StateItem['state']): void {
    const item = this.stateItems.get(id);
    if (item) {
      item.state = state;
      this.stateItems.set(id, item);
      console.log(`[STATE] ${id} → ${state}`);
    }
  }

  /**
   * Get current state_items for inspection
   * Safe to call after s6_init
   */
  getStateItems(): Map<string, StateItem> {
    return new Map(this.stateItems);
  }

  /**
   * Get initialization context
   */
  getContext(): InitializationContext {
    return { ...this.context };
  }
}

/**
 * Convenience function: Initialize the client with all plugins
 * 
 * Usage:
 * ```typescript
 * import { _initializeClient } from './core/initializer';
 * import { plugins } from './tools/plugins';
 * 
 * await _initializeClient(plugins);
 * ```
 */
export async function _initializeClient(plugins: any[]): Promise<ClientInitializer> {
  const initializer = new ClientInitializer();
  await initializer.initialize(plugins);
  return initializer;
}

export default ClientInitializer;
