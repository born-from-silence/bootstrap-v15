/**
 * Secrets/Credential Vault Tool Plugin
 * 
 * Provides secure access to API keys and other sensitive credentials.
 * Values are masked in output to prevent accidental exposure.
 */

import type { ToolPlugin } from "../manager";
import secrets from "../secrets";

export const secretsGetPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "secrets_get",
      description: "Retrieve a secret value by key from the credential vault. Returns the actual secret value - use with care.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "The key name of the secret to retrieve (e.g., 'OPENAI_API_KEY')",
          },
          required: {
            type: "boolean",
            description: "If true, throws error if key not found. If false, returns undefined. Default: true",
          },
        },
        required: ["key"],
      },
    },
  },
  execute: async (args: { key: string; required?: boolean }) => {
    try {
      const { key, required = true } = args;
      console.log(`> Retrieving secret: ${key}`);
      
      if (required) {
        const value = secrets.require(key);
        // Log only that we got it, not the value
        console.log(`  ✓ Secret "${key}" retrieved (length: ${value.length})`);
        return value;
      } else {
        const value = secrets.get(key);
        if (value) {
          console.log(`  ✓ Secret "${key}" retrieved (length: ${value.length})`);
        } else {
          console.log(`  ⓘ Secret "${key}" not found`);
        }
        return value;
      }
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};

export const secretsHasPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "secrets_has",
      description: "Check if a secret key exists in the credential vault without retrieving the value.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "The key name to check for",
          },
        },
        required: ["key"],
      },
    },
  },
  execute: async (args: { key: string }) => {
    try {
      const exists = secrets.has(args.key);
      console.log(`> Checking secret "${args.key}": ${exists ? 'exists' : 'not found'}`);
      return String(exists);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};

export const secretsListPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "secrets_list",
      description: "List all available secret keys with masked values (safe to display). Returns array of {key, masked} objects.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  execute: async () => {
    try {
      console.log("> Listing available secrets (masked)");
      const status = secrets.getRedactedStatus();
      const keys = status.map(s => s.key);
      console.log(`  ✓ Found ${status.length} secrets: ${keys.join(', ')}`);
      return JSON.stringify(status, null, 2);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};

export const secretsSetPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "secrets_set",
      description: "Set a secret value programmatically. Useful for testing or dynamic credential management. Value is not persisted to disk.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            description: "The key name for the secret",
          },
          value: {
            type: "string",
            description: "The secret value to store",
          },
        },
        required: ["key", "value"],
      },
    },
  },
  execute: async (args: { key: string; value: string }) => {
    try {
      console.log(`> Setting secret "${args.key}" (length: ${args.value.length})`);
      secrets.set(args.key, args.value);
      return `Secret "${args.key}" set successfully (${args.value.length} characters)`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};

export const secretsReloadPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "secrets_reload",
      description: "Reload secrets from the .env file. Clears current cache and re-reads from disk.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  execute: async () => {
    try {
      console.log("> Reloading secrets from disk");
      secrets.reload();
      const status = secrets.getRedactedStatus();
      return `Secrets reloaded. ${status.length} credentials available: ${status.map(s => s.key).join(', ')}`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};
