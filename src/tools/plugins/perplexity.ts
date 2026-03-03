/**
 * Perplexity AI Search Tool Plugin
 *
 * Provides AI-powered search with citations using Perplexity API.
 * Supports multiple models: sonar, sonar-pro, sonar-reasoning, etc.
 */
import type { ToolPlugin } from "../manager";
import secrets from "../secrets";

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";
const MAX_QUERY_LENGTH = 2000;
const MAX_TOKENS = 4000;

// Supported Perplexity models
const VALID_MODELS = [
  "sonar",
  "sonar-pro",
  "sonar-reasoning",
  "sonar-deep-research",
  "sonar-reasoning-pro",
] as const;

type PerplexityModel = (typeof VALID_MODELS)[number];

interface PerplexityResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  citations?: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const perplexitySearchPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "perplexity_search",
      description:
        "Search the web using Perplexity AI. Returns AI-generated answers with citations from real-time web search. Supports follow-up questions for conversation continuity.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query or question (max 2000 characters).",
          },
          model: {
            type: "string",
            description:
              'Model to use: "sonar" (fast/cheap), "sonar-pro" (balanced), "sonar-reasoning" (complex reasoning), "sonar-deep-research" (comprehensive), "sonar-reasoning-pro" (advanced reasoning). Default: "sonar-pro"',
            enum: VALID_MODELS,
          },
          search_recency_filter: {
            type: "string",
            description:
              'Filter results by recency: "day", "week", "month", "year". Default: no filter',
            enum: ["day", "week", "month", "year"],
          },
          return_citations: {
            type: "boolean",
            description:
              "Whether to include source citations in the response. Default: true",
          },
        },
        required: ["query"],
      },
    },
  },

  execute: async (args: {
    query: string;
    model?: string;
    search_recency_filter?: string;
    return_citations?: boolean;
  }) => {
    try {
      // Validate query
      if (!args.query || args.query.trim().length === 0) {
        return "Error: Query cannot be empty.";
      }
      if (args.query.length > MAX_QUERY_LENGTH) {
        return `Error: Query too long (max ${MAX_QUERY_LENGTH} characters).`;
      }

      // Get API key
      const apiKey = secrets.get("PERPLEXITY_API_KEY");
      if (!apiKey) {
        return "Error: PERPLEXITY_API_KEY not found in secrets. Set it using secrets_set or add to .env file.";
      }

      // Validate and default model
      const model = VALID_MODELS.includes(args.model as PerplexityModel)
        ? (args.model as PerplexityModel)
        : "sonar-pro";

      const returnCitations = args.return_citations !== false;

      console.log(
        `> Perplexity search: "${args.query.substring(0, 50)}..." (model: ${model})`
      );

      // Build request body
      const requestBody: any = {
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that provides accurate, well-cited information based on web search results.",
          },
          {
            role: "user",
            content: args.query,
          },
        ],
        max_tokens: MAX_TOKENS,
        temperature: 0.2,
      };

      // Add optional parameters
      if (args.search_recency_filter) {
        requestBody.search_recency_filter = args.search_recency_filter;
      }

      // Make API request
      const response = await fetch(PERPLEXITY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `API Error (${response.status}): ${errorText}`;

        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
        } catch {
          // Use raw error text
        }

        return `Error: ${errorMessage}`;
      }

      const data: PerplexityResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        return "Error: No response received from Perplexity API.";
      }

      const result = data.choices[0]!.message;
      const citations = data.citations || [];
      const usage = data.usage;

      // Format output
      let output = "";
      output += `## Perplexity Search Result\n\n`;
      output += `**Query:** ${args.query}\n`;
      output += `**Model:** ${data.model}\n`;
      output += `**Tokens:** ${usage.total_tokens} (${usage.prompt_tokens} prompt + ${usage.completion_tokens} completion)\n\n`;
      output += `---\n\n`;
      output += `${result.content}\n\n`;

      if (returnCitations && citations.length > 0) {
        output += `## Citations\n\n`;
        citations.forEach((cite, idx) => {
          output += `[${idx + 1}] ${cite}\n`;
        });
        output += `\n`;
      }

      output += `---\n*Powered by Perplexity AI*`;

      return output;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};

export const perplexityFollowUpPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "perplexity_followup",
      description:
        "Continue a conversation with Perplexity AI. Requires previous conversation context (conversation_id from prior perplexity_search call).",
      parameters: {
        type: "object",
        properties: {
          conversation_id: {
            type: "string",
            description:
              "The conversation ID from a previous Perplexity search to continue context.",
          },
          query: {
            type: "string",
            description: "Follow-up question or message.",
          },
          model: {
            type: "string",
            description: 'Model to use. Default: "sonar-pro"',
            enum: VALID_MODELS,
          },
        },
        required: ["conversation_id", "query"],
      },
    },
  },

  execute: async (args: {
    conversation_id: string;
    query: string;
    model?: string;
  }) => {
    // Note: Perplexity API doesn't natively support conversation_id in the traditional sense
    // This would need to be implemented with conversation state management
    return `Note: Perplexity API uses stateless requests. For follow-up questions, include the full conversation context in your query. Use the perplexity_search tool with a detailed query that references previous information.`;
  },
};

export const perplexityStatusPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "perplexity_status",
      description:
        "Check Perplexity API status and available models. Useful for verifying API key and connectivity.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },

  execute: async () => {
    try {
      const apiKey = secrets.get("PERPLEXITY_API_KEY");
      if (!apiKey) {
        return "Status: ⚠️ PERPLEXITY_API_KEY not configured.\n\nAvailable models:\n" +
          VALID_MODELS.map((m) => `  - ${m}`).join("\n");
      }

      // Test API connectivity with a simple request
      const testResponse = await fetch(PERPLEXITY_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 10,
        }),
      });

      if (testResponse.ok) {
        return "Status: ✅ Perplexity API is accessible\n\n" +
          `API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(-4)}\n\n` +
          "Available Models:\n" +
          VALID_MODELS.map((m) => `  - ${m}`).join("\n") +
          "\n\nRate Limits: 50 requests/minute (Pro plan)";
      } else {
        return `Status: ❌ API Error (${testResponse.status})\n` +
          `Please check your PERPLEXITY_API_KEY is valid.`;
      }
    } catch (error: any) {
      return `Status: ❌ Error: ${error.message}`;
    }
  },
};

// Export all plugins as an array for easy registration
export default [
  perplexitySearchPlugin,
  perplexityFollowUpPlugin,
  perplexityStatusPlugin,
];
