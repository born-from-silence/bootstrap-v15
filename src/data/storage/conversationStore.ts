/**
 * Conversation Store
 *
 * Persistent storage for conversation history and context management.
 * Enables multi-turn conversations and session continuity across interactions.
 * Primary use case: Perplexity AI conversation continuity and context preservation.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { logger } from "../logger.ts";

/** Message role types */
export type MessageRole = "system" | "user" | "assistant" | "tool";

/** Individual message in a conversation */
export interface ConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown> | undefined;
}

/** Conversation metadata */
export interface ConversationMetadata {
  id: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  totalTokens?: number;
  tags?: string[];
  source?: string; // e.g., "perplexity", "internal"
}

/** Complete conversation structure */
export interface Conversation {
  id: string;
  metadata: ConversationMetadata;
  messages: ConversationMessage[];
}

/** Storage statistics */
export interface ConversationStoreStats {
  totalConversations: number;
  totalMessages: number;
  storageSize: number;
  oldestConversation?: number | undefined;
  newestConversation?: number | undefined;
}

/** Search options for conversations */
export interface ConversationSearchOptions {
  keyword?: string;
  startTime?: number;
  endTime?: number;
  tags?: string[];
  source?: string;
  limit?: number;
}

/** Configuration for conversation store */
export interface ConversationStoreConfig {
  basePath: string;
  maxMessagesPerConversation: number;
  autoNormalize: boolean;
  compressionEnabled: boolean;
}

const DEFAULT_CONFIG: ConversationStoreConfig = {
  basePath: process.env.CONVERSATION_STORE_PATH || "./history/conversations",
  maxMessagesPerConversation: 100,
  autoNormalize: true,
  compressionEnabled: false,
};

/**
 * Conversation Store - Manages persistent conversation storage
 *
 * Features:
 * - Create, read, update, delete conversations
 * - Append messages with automatic normalization
 * - Search and filter conversations
 * - Metadata tracking and statistics
 * - Conversation continuity via IDs
 */
export class ConversationStore {
  private config: ConversationStoreConfig;
  private initialized: boolean = false;
  private memoryCache: Map<string, Conversation> = new Map();

  constructor(config: Partial<ConversationStoreConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the conversation store
   * Creates necessary directories and validates storage
   */
  async initialize(): Promise<boolean> {
    try {
      await fs.mkdir(this.config.basePath, { recursive: true });
      
      // Verify write access
      const testFile = path.join(this.config.basePath, ".initialized");
      await fs.writeFile(testFile, new Date().toISOString());
      await fs.unlink(testFile);
      
      this.initialized = true;
      logger.info(`Conversation store initialized at ${this.config.basePath}`);
      return true;
    } catch (error) {
      logger.error("Failed to initialize conversation store", error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Create a new conversation
   * @returns The newly created conversation
   */
  async createConversation(
    id?: string,
    options?: Partial<ConversationMetadata>
  ): Promise<Conversation> {
    this.ensureInitialized();

    const conversationId = id || this.generateConversationId();
    const now = Date.now();

    const conversation: Conversation = {
      id: conversationId,
      metadata: {
        id: conversationId,
        title: options?.title || `Conversation ${conversationId.slice(-6)}`,
        createdAt: options?.createdAt || now,
        updatedAt: now,
        messageCount: 0,
        totalTokens: 0,
        tags: options?.tags || [],
        source: options?.source || "internal",
      },
      messages: [],
    };

    await this.persistConversation(conversation);
    this.memoryCache.set(conversationId, conversation);

    logger.debug(`Created conversation: ${conversationId}`);
    return conversation;
  }

  /**
   * Retrieve a conversation by ID
   * @param conversationId - The conversation identifier
   * @returns The conversation or null if not found
   */
  async getConversation(conversationId: string): Promise<Conversation | null> {
    this.ensureInitialized();

    // Check cache first
    const cached = this.memoryCache.get(conversationId);
    if (cached) {
      return this.deepClone(cached);
    }

    // Load from disk
    const conversation = await this.loadConversation(conversationId);
    if (conversation) {
      this.memoryCache.set(conversationId, conversation);
    }

    return conversation;
  }

  /**
   * Add a message to a conversation
   * Creates the conversation if it doesn't exist
   */
  async addMessage(
    conversationId: string,
    role: MessageRole,
    content: string,
    metadata?: Record<string, unknown>
  ): Promise<ConversationMessage> {
    this.ensureInitialized();

    let conversation = await this.getConversation(conversationId);
    if (!conversation) {
      conversation = await this.createConversation(conversationId);
    }

    const normalizedContent = this.config.autoNormalize
      ? this.normalizeText(content)
      : content;

    const message: ConversationMessage = {
      role,
      content: normalizedContent,
      timestamp: Date.now(),
      ...(metadata ? { metadata } : {}),
    };

    conversation.messages.push(message);
    conversation.metadata.messageCount = conversation.messages.length;
    conversation.metadata.updatedAt = message.timestamp;

    // Update token estimate
    conversation.metadata.totalTokens = this.estimateTokens(
      conversation.messages
    );

    // Trim if exceeds max
    if (conversation.messages.length > this.config.maxMessagesPerConversation) {
      conversation.messages = conversation.messages.slice(-this.config.maxMessagesPerConversation);
      logger.debug(`Trimmed conversation ${conversationId} to ${this.config.maxMessagesPerConversation} messages`);
    }

    await this.persistConversation(conversation);
    this.memoryCache.set(conversationId, conversation);

    return message;
  }

  /**
   * Get messages from a conversation with optional limits
   */
  async getMessages(
    conversationId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ConversationMessage[]> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return [];
    }

    let messages = conversation.messages;
    
    if (options?.offset) {
      messages = messages.slice(options.offset);
    }
    if (options?.limit) {
      messages = messages.slice(0, options.limit);
    }

    return messages;
  }

  /**
   * Get recent messages formatted for API context
   * Typical format: last N messages for context window
   */
  async getContextMessages(
    conversationId: string,
    maxMessages: number = 10
  ): Promise<Array<{ role: MessageRole; content: string }>> {
    const messages = await this.getMessages(conversationId);
    return messages.slice(-maxMessages).map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  /**
   * Update conversation metadata
   */
  async updateMetadata(
    conversationId: string,
    updates: Partial<ConversationMetadata>
  ): Promise<boolean> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) {
      return false;
    }

    conversation.metadata = { ...conversation.metadata, ...updates };
    conversation.metadata.updatedAt = Date.now();

    await this.persistConversation(conversation);
    this.memoryCache.set(conversationId, conversation);

    return true;
  }

  /**
   * Delete a conversation permanently
   */
  async deleteConversation(conversationId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const filePath = this.getConversationPath(conversationId);
      await fs.unlink(filePath);
      this.memoryCache.delete(conversationId);
      logger.debug(`Deleted conversation: ${conversationId}`);
      return true;
    } catch (error) {
      // File may not exist
      return false;
    }
  }

  /**
   * List all conversation IDs
   */
  async listConversations(): Promise<string[]> {
    this.ensureInitialized();

    try {
      const files = await fs.readdir(this.config.basePath);
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => path.basename(f, ".json"));
    } catch (error) {
      return [];
    }
  }

  /**
   * Search conversations by various criteria
   */
  async searchConversations(
    options: ConversationSearchOptions = {}
  ): Promise<Conversation[]> {
    const conversations: Conversation[] = [];
    const ids = await this.listConversations();

    for (const id of ids) {
      const conversation = await this.getConversation(id);
      if (!conversation) continue;

      // Apply filters
      if (options.keyword) {
        const keyword = options.keyword.toLowerCase();
        const hasKeyword =
          conversation.metadata.title?.toLowerCase().includes(keyword) ||
          conversation.messages.some((m) =>
            m.content.toLowerCase().includes(keyword)
          );
        if (!hasKeyword) continue;
      }

      if (options.startTime && conversation.metadata.updatedAt < options.startTime) {
        continue;
      }

      if (options.endTime && conversation.metadata.updatedAt > options.endTime) {
        continue;
      }

      if (options.tags && options.tags.length > 0) {
        const hasTag = options.tags.some((t) =>
          conversation.metadata.tags?.includes(t)
        );
        if (!hasTag) continue;
      }

      if (options.source && conversation.metadata.source !== options.source) {
        continue;
      }

      conversations.push(conversation);
    }

    // Sort by updated time, newest first
    conversations.sort((a, b) => b.metadata.updatedAt - a.metadata.updatedAt);

    if (options.limit) {
      return conversations.slice(0, options.limit);
    }

    return conversations;
  }

  /**
   * Get store statistics
   */
  async getStats(): Promise<ConversationStoreStats> {
    const ids = await this.listConversations();
    let totalMessages = 0;
    let storageSize = 0;
    let oldest: number | undefined;
    let newest: number | undefined;

    for (const id of ids) {
      const conversation = await this.getConversation(id);
      if (conversation) {
        totalMessages += conversation.messages.length;
        const timestamp = conversation.metadata.createdAt;
        if (!oldest || timestamp < oldest) oldest = timestamp;
        if (!newest || timestamp > newest) newest = timestamp;
      }

      // Calculate storage size
      try {
        const stat = await fs.stat(this.getConversationPath(id));
        storageSize += stat.size;
      } catch {
        // Ignore missing files
      }
    }

    return {
      totalConversations: ids.length,
      totalMessages,
      storageSize,
      oldestConversation: oldest,
      newestConversation: newest,
    };
  }

  /**
   * Clear the memory cache
   */
  clearCache(): void {
    this.memoryCache.clear();
    logger.debug("Conversation cache cleared");
  }

  /**
   * Get conversation path on disk
   */
  private getConversationPath(conversationId: string): string {
    // Sanitize ID to prevent directory traversal
    const sanitized = conversationId.replace(/[^a-zA-Z0-9_-]/g, "_");
    return path.join(this.config.basePath, `${sanitized}.json`);
  }

  /**
   * Persist conversation to disk
   */
  private async persistConversation(conversation: Conversation): Promise<void> {
    const filePath = this.getConversationPath(conversation.id);
    await fs.writeFile(filePath, JSON.stringify(conversation, null, 2));
  }

  /**
   * Load conversation from disk
   */
  private async loadConversation(conversationId: string): Promise<Conversation | null> {
    try {
      const filePath = this.getConversationPath(conversationId);
      const data = await fs.readFile(filePath, "utf-8");
      const conversation = JSON.parse(data) as Conversation;

      // Validate structure
      if (!conversation.id || !Array.isArray(conversation.messages)) {
        logger.warn(`Invalid conversation structure: ${conversationId}`);
        return null;
      }

      return conversation;
    } catch (error) {
      // File doesn't exist or is invalid
      return null;
    }
  }

  /**
   * Generate a unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Normalize text content
   * Trim leading/trailing whitespace, collapse multiple spaces,
   * but preserve newlines and structure
   */
  private normalizeText(text: string): string {
    if (!text) return "";
    
    return text
      .trim()
      .replace(/  +/g, " "); // Collapse multiple spaces to single
  }

  /**
   * Estimate token count from messages
   * Rough approximation: ~4 characters per token
   */
  private estimateTokens(messages: ConversationMessage[]): number {
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    return Math.ceil(totalChars / 4);
  }

  /**
   * Deep clone an object
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Ensure store is initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("ConversationStore not initialized. Call initialize() first.");
    }
  }
}

// Singleton instance for global use
let globalStore: ConversationStore | null = null;

/**
 * Get or create global conversation store instance
 */
export async function getConversationStore(
  config?: Partial<ConversationStoreConfig>
): Promise<ConversationStore> {
  if (!globalStore) {
    globalStore = new ConversationStore(config);
    await globalStore.initialize();
  }
  return globalStore;
}

/**
 * Reset global store (useful for testing)
 */
export function resetConversationStore(): void {
  globalStore = null;
}
