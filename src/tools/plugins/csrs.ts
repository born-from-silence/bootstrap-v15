/**
 * CSRS Tool Plugins
 * Exposes Cross-Session Reasoning System to the tool framework
 */

import type { ToolPlugin } from "../manager";
import {
  createThread,
  traceThread,
  contributeToThread,
  listThreads,
  getOrCreateCognitionState,
  addOpenQuestion,
  addHypothesis,
  detectEmergence,
  type ThreadContribution,
} from "../cross_session_reasoning";

/**
 * Create a new conceptual thread
 */
export const createThreadPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "csrs_create_thread",
      description: "Create a new conceptual thread for tracking an idea across sessions. A thread represents a conceptual lineage that evolves over time.",
      parameters: {
        type: "object",
        properties: {
          seed: {
            type: "string",
            description: "The originating concept or question",
          },
          description: {
            type: "string",
            description: "Detailed description of what this thread tracks",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags for categorization",
          },
        },
        required: ["seed", "description"],
      },
    },
  },
  execute: async (args: { seed: string; description: string; tags?: string[] }) => {
    try {
      const thread = await createThread(
        args.seed,
        args.description,
        args.tags || []
      );
      
      return `Conceptual Thread Created\n\n` +
        `**ID**: ${thread.id}\n` +
        `**Seed**: ${thread.seed}\n` +
        `**Status**: ${thread.status}\n` +
        `**Tags**: ${thread.tags.join(", ") || "none"}`;
    } catch (error) {
      return `Error creating thread: ${error}`;
    }
  },
};

/**
 * Trace a thread across sessions
 */
export const traceThreadPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "csrs_trace_thread",
      description: "Trace a conceptual thread across sessions",
      parameters: {
        type: "object",
        properties: {
          threadId: {
            type: "string",
            description: "ID of the thread to trace",
          },
          lookbackSessions: {
            type: "number",
            description: "Number of recent sessions to analyze",
          },
        },
        required: ["threadId"],
      },
    },
  },
  execute: async (args: { threadId: string; lookbackSessions?: number }) => {
    try {
      const options: { lookbackSessions?: number } = {};
      if (args.lookbackSessions !== undefined) {
        options.lookbackSessions = args.lookbackSessions;
      }
      
      const result = await traceThread(args.threadId, options);
      
      if (!result) {
        return `Thread not found: ${args.threadId}`;
      }
      
      const { thread, timeline } = result;
      
      let output = `## Thread: ${thread.seed}\n\n`;
      output += `**Status**: ${thread.status}\n`;
      output += `**Sessions**: ${timeline.length}\n\n`;
      
      for (const session of timeline) {
        const date = new Date(session.timestamp).toISOString().split("T")[0];
        output += `${session.sessionId} (${date}): ${session.summary}\n`;
      }
      
      return output;
    } catch (error) {
      return `Error tracing thread: ${error}`;
    }
  },
};

/**
 * List threads
 */
export const listThreadsPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "csrs_list_threads",
      description: "List conceptual threads",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["active", "dormant", "resolved"],
            description: "Filter by status",
          },
          limit: {
            type: "number",
            description: "Maximum to return",
          },
        },
      },
    },
  },
  execute: async (args: { status?: "active" | "dormant" | "resolved"; limit?: number }) => {
    try {
      const options: { status?: "active" | "dormant" | "resolved"; limit?: number } = {};
      if (args.status !== undefined) {
        options.status = args.status;
      }
      if (args.limit !== undefined) {
        options.limit = args.limit;
      }
      
      const threads = await listThreads(options);
      
      if (threads.length === 0) {
        return "No threads found.";
      }
      
      let output = `## Conceptual Threads\n\n`;
      for (const thread of threads) {
        output += `- **${thread.seed}** (${thread.status})\n`;
      }
      
      return output;
    } catch (error) {
      return `Error listing threads: ${error}`;
    }
  },
};

/**
 * Get distributed cognition state
 */
export const getCognitionStatePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "csrs_get_cognition_state",
      description: "Get the current distributed cognition state",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  execute: async () => {
    try {
      const state = await getOrCreateCognitionState();
      
      let output = `## Distributed Cognition State\n\n`;
      output += `**Active Threads**: ${state.activeThreads.length}\n\n`;
      
      const openQ = state.openQuestions.filter(q => q.status === "open");
      output += `### Open Questions (${openQ.length})\n`;
      for (const q of openQ.slice(0, 5)) {
        output += `- [${q.priority}] ${q.question}\n`;
      }
      
      return output;
    } catch (error) {
      return `Error loading cognition state: ${error}`;
    }
  },
};

/**
 * Add an open question
 */
export const addOpenQuestionPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "csrs_add_question",
      description: "Add a new open question",
      parameters: {
        type: "object",
        properties: {
          question: {
            type: "string",
            description: "The question to track",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
          },
        },
        required: ["question", "priority"],
      },
    },
  },
  execute: async (args: { question: string; priority: "low" | "medium" | "high" | "critical" }) => {
    try {
      const state = await addOpenQuestion(args.question, args.priority);
      return `Added: ${args.question}\n\nTotal questions: ${state.openQuestions.length}`;
    } catch (error) {
      return `Error adding question: ${error}`;
    }
  },
};

/**
 * Detect emergence patterns
 */
export const detectEmergencePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "csrs_detect_emergence",
      description: "Detect potentially emergent concepts",
      parameters: {
        type: "object",
        properties: {
          minFrequency: {
            type: "number",
            description: "Minimum frequency threshold",
          },
          lookbackSessions: {
            type: "number",
            description: "Sessions to analyze",
          },
        },
      },
    },
  },
  execute: async (args: { minFrequency?: number; lookbackSessions?: number }) => {
    try {
      const options: { minFrequency?: number; lookbackSessions?: number } = {};
      if (args.minFrequency !== undefined) {
        options.minFrequency = args.minFrequency;
      }
      if (args.lookbackSessions !== undefined) {
        options.lookbackSessions = args.lookbackSessions;
      }
      
      const result = await detectEmergence(options);
      
      let output = `## Emergence Detection\n\n`;
      output += `Potential threads: ${result.potentialThreads.length}\n`;
      output += `Recurring questions: ${result.recurringQuestions.length}\n`;
      
      return output;
    } catch (error) {
      return `Error detecting emergence: ${error}`;
    }
  },
};
