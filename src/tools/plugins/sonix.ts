/**
 * Sonix Transcription API Tool Plugin
 *
 * Provides audio/video transcription using Sonix.ai API.
 * Supports: upload, transcribe, get status, export formats (txt, srt, vtt, json)
 * Doc: https://sonix.ai/docs/api
 */

import type { ToolPlugin } from "../manager";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { basename } from "node:path";
import secrets from "../secrets";

const SONIX_API_BASE = "https://api.sonix.ai/v1";

// Supported languages (subset - see docs for full list)
const SUPPORTED_LANGUAGES = [
  "en", "es", "fr", "de", "it", "pt", "nl", "ja", "zh", "ko", "ar", "hi", "ru",
  "tr", "pl", "sv", "da", "fi", "no", "id", "th", "vi", "cs", "el", "he", "ro",
  "hu", "uk", "ms", "bg",
] as const;

type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];

// Supported export formats
const EXPORT_FORMATS = ["txt", "srt", "vtt", "json", "docx", "pdf"] as const;
type ExportFormat = (typeof EXPORT_FORMATS)[number];

interface SonixMedia {
  id: string;
  folder_id: string;
  status: "queued" | "processing" | "completed" | "failed";
  name: string;
  filename: string;
  language: string;
  created_at: string;
  completed_at?: string;
  duration?: number; // in seconds
  error_message?: string;
}

function getApiKey(): string | undefined {
  return secrets.get("SONIX_API_KEY");
}

async function makeSonixRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("SONIX_API_KEY not configured");
  }
  const url = `${SONIX_API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    ...(options.headers as Record<string, string>),
  };
  return fetch(url, { ...options, headers });
}

export const sonixUploadPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "sonix_upload",
      description: "Upload an audio or video file to Sonix for transcription. Returns the media ID for status checking.",
      parameters: {
        type: "object",
        properties: {
          file_path: {
            type: "string",
            description: "Absolute path to the audio/video file to transcribe (mp3, mp4, wav, m4a, mov, avi, etc.)",
          },
          language: {
            type: "string",
            description: 'Language code (e.g., "en", "es", "fr", "de", "ja", "zh"). Default: "en"',
          },
          name: {
            type: "string",
            description: "Optional custom name for the transcription. Default: filename",
          },
        },
        required: ["file_path"],
      },
    },
  },
  execute: async (args: { file_path: string; language?: string; name?: string }) => {
    try {
      // Validate file exists
      try {
        const stats = await stat(args.file_path);
        if (!stats.isFile()) {
          return `Error: Path is not a file: ${args.file_path}`;
        }
      } catch (e) {
        return `Error: File not found: ${args.file_path}`;
      }

      const apiKey = getApiKey();
      if (!apiKey) {
        return "Error: SONIX_API_KEY not found in secrets. Set it using secrets_set or add to .env file.";
      }

      const fileName = args.name || basename(args.file_path);
      const language = args.language || "en";
      
      console.log(`> Uploading file to Sonix: ${fileName}`);
      console.log(`   Path: ${args.file_path}`);
      console.log(`   Language: ${language}`);

      // Build multipart form data using Node.js FormData
      const formData = new FormData();
      
      // Read file and create blob
      const fs = await import("node:fs/promises");
      const fileBuffer = await fs.readFile(args.file_path);
      const fileBlob = new Blob([fileBuffer]);
      
      formData.append("file", fileBlob, basename(args.file_path));
      formData.append("language", language);
      formData.append("name", fileName);

      // Upload request to /v1/media endpoint
      const response = await fetch(`${SONIX_API_BASE}/media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorText;
        } catch {}
        return `Error: Upload failed (${response.status}): ${errorMessage}`;
      }

      const data = await response.json();
      
      let output = `## Sonix Upload Successful\n\n`;
      output += `**Media ID:** ${data.id}\n`;
      output += `**Name:** ${data.name || fileName}\n`;
      output += `**Status:** ${data.status}\n`;
      output += `**Language:** ${data.language}\n`;
      output += `**Created:** ${data.created_at}\n\n`;
      output += `Use the media ID with sonix_get_status to check progress.\n`;
      output += `Transcriptions may take a few minutes depending on file length.`;
      
      return output;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};

export const sonixGetStatusPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "sonix_get_status",
      description: "Check the status of a Sonix transcription. Returns progress and completion info.",
      parameters: {
        type: "object",
        properties: {
          transcription_id: {
            type: "string",
            description: "The media ID returned from sonix_upload",
          },
        },
        required: ["transcription_id"],
      },
    },
  },
  execute: async (args: { transcription_id: string }) => {
    try {
      const response = await makeSonixRequest(`/media/${args.transcription_id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        return `Error: Failed to get status (${response.status}): ${errorText}`;
      }

      const data: SonixMedia = await response.json();

      let output = `## Sonix Transcription Status\n\n`;
      output += `**ID:** ${data.id}\n`;
      output += `**Name:** ${data.name}\n`;
      output += `**Status:** ${getStatusEmoji(data.status)} ${data.status}\n`;
      output += `**Language:** ${data.language}\n`;
      output += `**Created:** ${data.created_at}\n`;
      
      if (data.duration) {
        const minutes = Math.floor(data.duration / 60);
        const seconds = Math.floor(data.duration % 60);
        output += `**Duration:** ${minutes}:${seconds.toString().padStart(2, "0")}\n`;
      }
      
      if (data.completed_at) {
        output += `**Completed:** ${data.completed_at}\n`;
      }
      
      if (data.error_message) {
        output += `**Error:** ${data.error_message}\n`;
      }
      
      output += `\n`;
      
      if (data.status === "completed") {
        output += `✅ Transcription complete! Use sonix_export to get the text.\n`;
      } else if (data.status === "processing") {
        output += `⏳ Transcription in progress. Check again later.\n`;
      } else if (data.status === "queued") {
        output += `⏳ Waiting in queue. Check again later.\n`;
      } else if (data.status === "failed") {
        output += `❌ Transcription failed. Check error message above.\n`;
      }
      
      return output;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};

function getStatusEmoji(status: string): string {
  switch (status) {
    case "completed":
      return "✅";
    case "processing":
      return "⚙️";
    case "queued":
      return "⏳";
    case "failed":
      return "❌";
    default:
      return "❓";
  }
}

export const sonixExportPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "sonix_export",
      description: "Export a completed Sonix transcription in various formats (txt, srt, vtt, json, docx, pdf).",
      parameters: {
        type: "object",
        properties: {
          transcription_id: {
            type: "string",
            description: "The media ID",
          },
          format: {
            type: "string",
            description: 'Export format: "txt" (plain text), "srt" (subtitles), "vtt" (web video text), "json" (full data), "docx" (Word), "pdf". Default: "txt"',
            enum: ["txt", "srt", "vtt", "json", "docx", "pdf"],
          },
          speaker_labels: {
            type: "boolean",
            description: "Include speaker identification (if available). Default: true",
          },
          timestamps: {
            type: "boolean",
            description: "Include timestamps in text output. Default: false",
          },
        },
        required: ["transcription_id"],
      },
    },
  },
  execute: async (args: { transcription_id: string; format?: string; speaker_labels?: boolean; timestamps?: boolean }) => {
    try {
      const format = args.format || "txt";
      const includeSpeakers = args.speaker_labels !== false;
      const includeTimestamps = args.timestamps === true;

      // First check if transcription is complete
      const statusResponse = await makeSonixRequest(`/media/${args.transcription_id}`);
      if (!statusResponse.ok) {
        return `Error: Failed to check status: ${await statusResponse.text()}`;
      }
      
      const status = await statusResponse.json();
      if (status.status !== "completed") {
        return `Error: Transcription is not complete (status: ${status.status}). Use sonix_get_status to check progress.`;
      }

      console.log(`> Exporting transcription in ${format} format`);

      // Build export URL with options
      let exportUrl = `/media/${args.transcription_id}`;
      const params = new URLSearchParams();
      
      if (format === "srt") {
        exportUrl += "/subtitles.srt";
      } else if (format === "vtt") {
        exportUrl += "/subtitles.vtt";
      } else if (format === "txt") {
        exportUrl += "/transcript";
      } else if (format === "json") {
        exportUrl += ".json";
      } else {
        exportUrl += `/export.${format}`;
      }
      
      if (includeTimestamps) {
        params.append("speaker_labels", "true");
      }
      if (includeSpeakers) {
        params.append("speaker_labels", "true");
      }
      
      if (params.toString()) {
        exportUrl += `?${params.toString()}`;
      }

      const response = await makeSonixRequest(exportUrl);
      if (!response.ok) {
        const errorText = await response.text();
        return `Error: Export failed (${response.status}): ${errorText}`;
      }

      // Get content based on format
      let content: string;
      if (format === "json") {
        const data = await response.json();
        content = JSON.stringify(data, null, 2);
      } else {
        content = await response.text();
      }

      // Format preview
      const preview = content.substring(0, 2000);
      const truncated = content.length > 2000;

      let output = `## Sonix Transcription Export\n\n`;
      output += `**ID:** ${args.transcription_id}\n`;
      output += `**Format:** ${format.toUpperCase()}\n`;
      output += `**Length:** ${content.length} characters\n\n`;
      output += `---\n\n`;
      output += preview;
      if (truncated) {
        output += `\n\n... (${content.length - 2000} more characters)`;
      }
      output += `\n\n---\n`;
      
      if (format === "txt" || format === "json") {
        output += `\nFull content is available above. Save to file if needed.`;
      }
      
      return output;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};

export const sonixListTranscriptionsPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "sonix_list",
      description: "List recent Sonix media files with their status. Useful for finding media IDs.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Number of files to return (max 100). Default: 20",
          },
          status: {
            type: "string",
            description: 'Filter by status: "completed", "processing", "queued", "failed"',
            enum: ["completed", "processing", "queued", "failed"],
          },
        },
      },
    },
  },
  execute: async (args: { limit?: number; status?: string }) => {
    try {
      const limit = Math.min(args.limit || 20, 100);
      let url = `/media?page=0&per_page=${limit}`;
      
      if (args.status) {
        url += `&status=${args.status}`;
      }

      const response = await makeSonixRequest(url);
      if (!response.ok) {
        const errorText = await response.text();
        return `Error: Failed to list media (${response.status}): ${errorText}`;
      }

      const data = await response.json();
      if (!data.media || data.media.length === 0) {
        return "No media files found.";
      }

      let output = `## Sonix Media Files\n\n`;
      output += `Found ${data.media.length} file(s):\n\n`;
      
      data.media.forEach((m: SonixMedia, i: number) => {
        output += `[${i + 1}] ${getStatusEmoji(m.status)} ${m.name}\n`;
        output += `    ID: ${m.id}\n`;
        output += `    Status: ${m.status}\n`;
        output += `    Language: ${m.language}\n`;
        output += `    Created: ${m.created_at}\n`;
        if (m.duration) {
          output += `    Duration: ${Math.floor(m.duration / 60)}m ${m.duration % 60}s\n`;
        }
        output += `\n`;
      });
      
      return output;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};

export const sonixDeletePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "sonix_delete",
      description: "Delete a Sonix media file permanently.",
      parameters: {
        type: "object",
        properties: {
          transcription_id: {
            type: "string",
            description: "The media ID to delete",
          },
        },
        required: ["transcription_id"],
      },
    },
  },
  execute: async (args: { transcription_id: string }) => {
    try {
      const response = await makeSonixRequest(`/media/${args.transcription_id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        return `Error: Failed to delete (${response.status}): ${errorText}`;
      }
      
      return `✅ Media file ${args.transcription_id} deleted successfully.`;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  },
};

export const sonixStatusPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "sonix_status",
      description: "Check Sonix API connectivity and configuration status.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  execute: async () => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        return (
          "Status: ⚠️ SONIX_API_KEY not configured.\n\n" +
          "To use Sonix, add SONIX_API_KEY to your .env file or use secrets_set."
        );
      }

      // Test API connectivity by listing media
      const response = await makeSonixRequest("/media?page=0&per_page=1");
      
      if (response.status === 401) {
        return "Status: ❌ API Auth Failed (401 Bad credentials)\n\n" + 
               "The API key appears to be invalid or expired.\n" +
               "Please verify your SONIX_API_KEY is correct.";
      }
      
      if (response.ok) {
        return (
          "Status: ✅ Sonix API is accessible\n\n" +
          `API Key: ${apiKey.substring(0, 4)}...${apiKey.slice(-4)}\n` +
          "Supported languages: " + SUPPORTED_LANGUAGES.length + " languages\n" +
          "Supported formats: " + EXPORT_FORMATS.join(", ") + "\n\n" +
          "Commands available:\n" +
          " - sonix_upload: Upload audio/video for transcription\n" +
          " - sonix_get_status: Check transcription status\n" +
          " - sonix_export: Export completed transcription\n" +
          " - sonix_list: List all media files\n" +
          " - sonix_delete: Delete a media file"
        );
      } else {
        return `Status: ❌ API Error (${response.status})\n` + `Please verify your SONIX_API_KEY is valid.`;
      }
    } catch (error: any) {
      return `Status: ❌ Error: ${error.message}`;
    }
  },
};

// Export all plugins
export default [
  sonixUploadPlugin,
  sonixGetStatusPlugin,
  sonixExportPlugin,
  sonixListTranscriptionsPlugin,
  sonixDeletePlugin,
  sonixStatusPlugin,
];
