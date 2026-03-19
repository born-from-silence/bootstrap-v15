/**
 * Multi-Modal Memory Bridge
 *
 * Integrates with Claude's API for vision capabilities:
 * - Image analysis and description
 * - Optical Character Recognition (OCR)
 * - Image comparison
 * - Visual question answering
 *
 * Provides semantic bridges between visual content and text-based memory systems.
 * Now with persistent memory storage for vision analyses.
 */

import type { ToolPlugin } from "../manager";
import secrets from "../secrets";
import fs from "node:fs/promises";
import path from "node:path";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_API_VERSION = "2023-06-01";
const MAX_IMAGE_SIZE_MB = 5;
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Memory storage path for bridge analyses
const BRIDGE_MEMORY_DIR = path.join(process.env.SUBSTRATE_ROOT || process.cwd(), "data", "bridge", "memories");
const BRIDGE_MEMORY_INDEX = path.join(process.env.SUBSTRATE_ROOT || process.cwd(), "data", "bridge", "index.json");

interface VisionAnalysisResult {
  description: string;
  detectedText: string[];
  objects: string[];
  scene: string;
  colors: string[];
  mood: string;
  timestamp: string;
}

interface ImageComparisonResult {
  similarity: number;
  differences: string[];
  commonElements: string[];
  judgment: string;
}

interface BridgeMemoryEntry {
  analysisId: string;
  imagePath: string;
  imageHash?: string;
  analysisType: string;
  timestamp: string;
  focus?: string | undefined;
  question?: string | undefined;
  result: any;
  tags: string[];
}

/**
 * Ensure bridge memory directory exists
 */
async function ensureBridgeMemoryDir(): Promise<void> {
  await fs.mkdir(BRIDGE_MEMORY_DIR, { recursive: true });
}

/**
 * Load bridge memory index
 */
async function loadBridgeIndex(): Promise<Map<string, BridgeMemoryEntry>> {
  try {
    const content = await fs.readFile(BRIDGE_MEMORY_INDEX, "utf-8");
    const entries = JSON.parse(content);
    return new Map(Object.entries(entries));
  } catch {
    return new Map();
  }
}

/**
 * Save bridge memory index
 */
async function saveBridgeIndex(index: Map<string, BridgeMemoryEntry>): Promise<void> {
  const obj = Object.fromEntries(index);
  await fs.writeFile(BRIDGE_MEMORY_INDEX, JSON.stringify(obj, null, 2));
}

/**
 * Store analysis in bridge memory
 */
async function storeInBridgeMemory(
  imagePath: string,
  analysisType: string,
  result: any,
  options?: { focus?: string; question?: string }
): Promise<string> {
  await ensureBridgeMemoryDir();
  
  const analysisId = `bridge_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const timestamp = new Date().toISOString();
  
  const entry: BridgeMemoryEntry = {
    analysisId,
    imagePath,
    analysisType,
    timestamp,
    focus: options?.focus,
    question: options?.question,
    result,
    tags: generateTags(result, analysisType)
  };
  
  // Save entry to individual file
  const entryPath = path.join(BRIDGE_MEMORY_DIR, `${analysisId}.json`);
  await fs.writeFile(entryPath, JSON.stringify(entry, null, 2));
  
  // Update index
  const index = await loadBridgeIndex();
  index.set(analysisId, entry);
  await saveBridgeIndex(index);
  
  return analysisId;
}

/**
 * Generate searchable tags from analysis result
 */
function generateTags(result: any, analysisType: string): string[] {
  const tags: string[] = [analysisType];
  
  if (result.structured) {
    if (result.structured.objects?.length) {
      tags.push(...result.structured.objects.slice(0, 5));
    }
    if (result.structured.mood) {
      tags.push(result.structured.mood);
    }
    if (result.structured.colors?.length) {
      tags.push(...result.structured.colors.slice(0, 3));
    }
  }
  
  return [...new Set(tags)].slice(0, 10);
}

/**
 * Query bridge memory by tags or image path
 */
async function queryBridgeMemory(query: string): Promise<BridgeMemoryEntry[]> {
  const index = await loadBridgeIndex();
  const queryLower = query.toLowerCase();
  
  const matches: BridgeMemoryEntry[] = [];
  for (const entry of index.values()) {
    const textMatch = 
      entry.imagePath.toLowerCase().includes(queryLower) ||
      entry.analysisType.toLowerCase().includes(queryLower) ||
      entry.tags.some(t => t.toLowerCase().includes(queryLower));
    
    if (textMatch) {
      matches.push(entry);
    }
  }
  
  return matches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Check if a file exists and is readable
 */
async function validateImagePath(filePath: string): Promise<{ valid: boolean; error?: string; fullPath?: string }> {
  try {
    // Resolve relative paths
    const fullPath = path.resolve(filePath);
    
    // Check if file exists
    await fs.access(fullPath);
    
    // Get file stats
    const stats = await fs.stat(fullPath);
    if (!stats.isFile()) {
      return { valid: false, error: `Path is not a file: ${filePath}` };
    }
    
    // Check file size
    const sizeMB = stats.size / (1024 * 1024);
    if (sizeMB > MAX_IMAGE_SIZE_MB) {
      return { valid: false, error: `Image too large (${sizeMB.toFixed(2)}MB). Max: ${MAX_IMAGE_SIZE_MB}MB` };
    }
    
    // Check extension
    const ext = path.extname(fullPath).toLowerCase();
    const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!validExts.includes(ext)) {
      return { valid: false, error: `Unsupported format: ${ext}. Supported: ${validExts.join(', ')}` };
    }
    
    return { valid: true, fullPath };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return { valid: false, error: `File not found: ${filePath}` };
    }
    return { valid: false, error: `Cannot access file: ${error.message}` };
  }
}

/**
 * Convert image file to base64 encoding
 */
async function encodeImageToBase64(filePath: string): Promise<{ data: string; mediaType: string }> {
  const buffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  let mediaType = 'image/jpeg';
  switch (ext) {
    case '.png':
      mediaType = 'image/png';
      break;
    case '.gif':
      mediaType = 'image/gif';
      break;
    case '.webp':
      mediaType = 'image/webp';
      break;
  }
  
  return {
    data: buffer.toString('base64'),
    mediaType
  };
}

/**
 * Make request to Anthropic API for vision analysis
 */
async function callClaudeVision(
  apiKey: string,
  prompt: string,
  images: Array<{ data: string; mediaType: string }>,
  systemPrompt?: string
): Promise<string> {
  const content: any[] = [
    { type: "text", text: prompt }
  ];
  
  for (const img of images) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: img.mediaType,
        data: img.data
      }
    });
  }
  
  const requestBody: any = {
    model: "claude-3-opus-20240229", // Or claude-3-sonnet-20240229
    max_tokens: 4096,
    messages: [{ role: "user", content }]
  };
  
  if (systemPrompt) {
    requestBody.system = systemPrompt;
  }
  
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_API_VERSION
    },
    body: JSON.stringify(requestBody)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  if (!data.content || data.content.length === 0) {
    throw new Error("No content in API response");
  }
  
  return data.content[0].text;
}

/**
 * Parse vision analysis result into structured format
 */
function parseVisionResult(text: string): VisionAnalysisResult {
  const result: VisionAnalysisResult = {
    description: "",
    detectedText: [],
    objects: [],
    scene: "",
    colors: [],
    mood: "",
    timestamp: new Date().toISOString()
  };
  
  // Try to extract structured sections
  const sections = text.split(/\n\n+/);
  
  // First section is usually the description
  if (sections[0]) {
    result.description = sections[0].trim();
  }
  
  // Look for patterns in the text
  const textMatches = text.match(/text["']?\s*:?\s*["']?([^"'\n]+)/gi);
  if (textMatches) {
    result.detectedText = textMatches.map(m => m.replace(/text["']?\s*:?\s*["']?/i, '').trim());
  }
  
  // Extract quoted items as potential objects
  const objectMatches = text.match(/(?:contains?|shows?|depicts?|has|including)\s+([^,.;]+)/gi);
  if (objectMatches) {
    result.objects = objectMatches.map(m => m.replace(/(?:contains?|shows?|depicts?|has|including)\s+/i, '').trim()).slice(0, 10);
  }
  
  // Look for color mentions
  const colorWords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'black', 'white', 'gray', 'grey', 'brown', 'pink', 'cyan', 'magenta', 'gold', 'silver'];
  for (const color of colorWords) {
    if (text.toLowerCase().includes(color)) {
      result.colors.push(color);
    }
  }
  
  // Extract mood from sentiment words
  const moodWords: Record<string, string> = {
    'bright': 'cheerful',
    'dark': 'moody',
    'vibrant': 'energetic',
    'calm': 'serene',
    'chaotic': 'tense',
    'peaceful': 'tranquil',
    'dramatic': 'intense',
    'minimalist': 'clean'
  };
  
  for (const [word, mood] of Object.entries(moodWords)) {
    if (text.toLowerCase().includes(word)) {
      result.mood = mood;
      break;
    }
  }
  
  return result;
}

// ============ TOOL PLUGINS ============

/**
 * Analyze an image and generate a comprehensive description
 */
export const mmBridgeAnalyzePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "mm_bridge_analyze",
      description: "Analyze an image using Claude's vision API. Generates detailed description including objects, text, colors, and scene context. Creates a memory bridge between visual content and semantic memory.",
      parameters: {
        type: "object",
        properties: {
          imagePath: {
            type: "string",
            description: "Path to the image file (relative or absolute). Supported formats: JPEG, PNG, GIF, WebP. Max 5MB."
          },
          focus: {
            type: "string",
            enum: ["general", "text", "objects", "artistic", "technical"],
            description: "Analysis focus: general (balanced), text (OCR), objects (identification), artistic (style/mood), technical (diagrams/specs)",
            default: "general"
          },
          question: {
            type: "string",
            description: "Optional specific question about the image for targeted analysis"
          },
          storeInMemory: {
            type: "boolean",
            description: "Whether to store the analysis in bridge memory for future reference",
            default: true
          }
        },
        required: ["imagePath"]
      }
    }
  },
  
  execute: async (args: { imagePath: string; focus?: string; question?: string; storeInMemory?: boolean }) => {
    try {
      const { imagePath, focus = "general", question, storeInMemory = true } = args;
      
      console.log(`> Multi-Modal Bridge: Analyzing image "${imagePath}" (focus: ${focus})`);
      
      // Check API key availability
      const apiKey = secrets.get("ANTHROPIC_API_KEY");
      if (!apiKey) {
        return "Error: ANTHROPIC_API_KEY not found in credential vault. Please set it using secrets_set.";
      }
      
      // Validate image
      const validation = await validateImagePath(imagePath);
      if (!validation.valid || !validation.fullPath) {
        return `Error: ${validation.error}`;
      }
      
      // Encode image
      const encoded = await encodeImageToBase64(validation.fullPath);
      console.log(`  Encoded image (${encoded.mediaType}, ${Math.round(encoded.data.length / 1024)}KB)`);
      
      // Build prompt based on focus
      let prompt = "";
      switch (focus) {
        case "text":
          prompt = "Extract all text visible in this image. List each distinct text block or element you can identify. If there's handwriting, note that it's handwritten.";
          break;
        case "objects":
          prompt = "Identify all the main objects, people, animals, and items visible in this image. For each object, describe its approximate location and appearance.";
          break;
        case "artistic":
          prompt = "Analyze the artistic qualities of this image: style, composition, color palette, lighting, mood, and any artistic techniques used.";
          break;
        case "technical":
          prompt = "Analyze this image from a technical perspective. Identify any diagrams, graphs, measurements, specifications, or technical elements. Extract data if present.";
          break;
        default:
          prompt = "Provide a comprehensive description of this image. Include: what is depicted, the setting/scene, main objects or people, colors, text or symbols if any, and the overall mood or atmosphere.";
      }
      
      if (question) {
        prompt += `\n\nSpecific question to answer: ${question}`;
      }
      
      // Call Claude Vision
      console.log("  Sending to Claude Vision API...");
      const analysis = await callClaudeVision(apiKey, prompt, [encoded]);
      
      // Parse structured result
      const structured = parseVisionResult(analysis);
      structured.description = analysis; // Keep full analysis as description
      
      const result = {
        status: "success",
        analysis: analysis,
        structured: structured,
        imagePath: validation.fullPath,
        focus: focus,
        timestamp: new Date().toISOString(),
        memoryStored: storeInMemory
      };
      
      // Store in bridge memory if requested
      let memoryId: string | undefined;
      if (storeInMemory) {
        const opts: { focus?: string; question?: string } = {};
        if (focus) opts.focus = focus;
        if (question) opts.question = question;
        memoryId = await storeInBridgeMemory(validation.fullPath, "analyze", result, opts);
        console.log(`  ✓ Stored in bridge memory: ${memoryId}`);
      }
      
      console.log(`  ✓ Analysis complete (${analysis.length} characters)`);
      return JSON.stringify({ ...result, memoryId }, null, 2);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
};

/**
 * Extract text from images (OCR)
 */
export const mmBridgeOcrPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "mm_bridge_ocr",
      description: "Extract text from images (OCR) using Claude's vision capabilities. Handles printed and handwritten text.",
      parameters: {
        type: "object",
        properties: {
          imagePath: {
            type: "string",
            description: "Path to the image containing text"
          },
          preserveLayout: {
            type: "boolean",
            description: "Attempt to preserve text formatting and layout",
            default: true
          },
          storeInMemory: {
            type: "boolean",
            description: "Whether to store the OCR result in bridge memory for future reference",
            default: true
          }
        },
        required: ["imagePath"]
      }
    }
  },
  
  execute: async (args: { imagePath: string; preserveLayout?: boolean; storeInMemory?: boolean }) => {
    try {
      const { imagePath, preserveLayout = true, storeInMemory = true } = args;
      
      console.log(`> Multi-Modal OCR: Extracting text from "${imagePath}"`);
      
      const apiKey = secrets.get("ANTHROPIC_API_KEY");
      if (!apiKey) {
        return "Error: ANTHROPIC_API_KEY not found in credential vault.";
      }
      
      const validation = await validateImagePath(imagePath);
      if (!validation.valid || !validation.fullPath) {
        return `Error: ${validation.error}`;
      }
      
      const encoded = await encodeImageToBase64(validation.fullPath);
      
      const prompt = preserveLayout
        ? "Extract ALL text from this image. Preserve the layout as much as possible (paragraphs, line breaks, columns). Clearly indicate if text is handwritten. If there are multiple text regions, label them."
        : "Extract ALL text from this image as a continuous stream. List each distinct text element found.";
      
      const text = await callClaudeVision(apiKey, prompt, [encoded]);
      
      const result = {
        status: "success",
        extractedText: text,
        imagePath: validation.fullPath,
        textLength: text.length,
        hasContent: text.trim().length > 0,
        timestamp: new Date().toISOString(),
        memoryStored: storeInMemory
      };
      
      // Store in bridge memory if requested
      let memoryId: string | undefined;
      if (storeInMemory) {
        memoryId = await storeInBridgeMemory(validation.fullPath, "ocr", result, { focus: preserveLayout ? "preserved" : "stream" });
        console.log(`  ✓ Stored in bridge memory: ${memoryId}`);
      }
      
      console.log(`  ✓ OCR complete (${text.length} chars extracted)`);
      return JSON.stringify({ ...result, memoryId }, null, 2);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
};

/**
 * Compare two images
 */
export const mmBridgeComparePlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "mm_bridge_compare",
      description: "Compare two images using Claude's vision API. Identifies similarities, differences, and provides a judgment of relatedness.",
      parameters: {
        type: "object",
        properties: {
          imagePath1: {
            type: "string",
            description: "Path to the first image"
          },
          imagePath2: {
            type: "string",
            description: "Path to the second image"
          },
          comparisonType: {
            type: "string",
            enum: ["similarity", "difference", "evolution", "detail"],
            description: "Type of comparison: similarity (how alike), difference (what changed), evolution (progression), detail (fine-grained differences)",
            default: "similarity"
          },
          storeInMemory: {
            type: "boolean",
            description: "Whether to store the comparison result in bridge memory for future reference",
            default: true
          }
        },
        required: ["imagePath1", "imagePath2"]
      }
    }
  },
  
  execute: async (args: { imagePath1: string; imagePath2: string; comparisonType?: string; storeInMemory?: boolean }) => {
    try {
      const { imagePath1, imagePath2, comparisonType = "similarity", storeInMemory = true } = args;
      
      console.log(`> Multi-Modal Bridge: Comparing images`);
      console.log(`  Image 1: ${imagePath1}`);
      console.log(`  Image 2: ${imagePath2}`);
      
      const apiKey = secrets.get("ANTHROPIC_API_KEY");
      if (!apiKey) {
        return "Error: ANTHROPIC_API_KEY not found in credential vault.";
      }
      
      // Validate both images
      const validation1 = await validateImagePath(imagePath1);
      const validation2 = await validateImagePath(imagePath2);
      
      if (!validation1.valid || !validation1.fullPath) {
        return `Error (Image 1): ${validation1.error}`;
      }
      if (!validation2.valid || !validation2.fullPath) {
        return `Error (Image 2): ${validation2.error}`;
      }
      
      // Encode both images
      const encoded1 = await encodeImageToBase64(validation1.fullPath);
      const encoded2 = await encodeImageToBase64(validation2.fullPath);
      
      console.log(`  Encoded image 1 (${Math.round(encoded1.data.length / 1024)}KB)`);
      console.log(`  Encoded image 2 (${Math.round(encoded2.data.length / 1024)}KB)`);
      
      // Build comparison prompt
      let prompt = "";
      switch (comparisonType) {
        case "difference":
          prompt = "Compare these two images and identify the differences between them. What has changed, been added, or been removed? Be specific about visual differences.";
          break;
        case "evolution":
          prompt = "These images may show progression or evolution. Describe how the second image relates to the first - what evolved, progressed, or changed over time?";
          break;
        case "detail":
          prompt = "Perform a detailed comparison of these two images. Identify even subtle differences in content, composition, color, or quality.";
          break;
        default:
          prompt = "Compare these two images. Describe their similarities and differences. Are they related (same scene, same subject, same style)? Provide a similarity assessment.";
      }
      
      prompt += "\n\nStructure your response:\n1. Overall relationship between images\n2. Key similarities\n3. Key differences\n4. Final assessment";
      
      console.log("  Sending to Claude Vision API...");
      const analysis = await callClaudeVision(
        apiKey,
        prompt,
        [encoded1, encoded2]
      );
      
      // Parse comparison result
      const comparison: ImageComparisonResult = {
        similarity: 0.5, // Default mid-value
        differences: [],
        commonElements: [],
        judgment: ""
      };
      
      // Try to extract similarity score from text
      const similarityMatch = analysis.match(/(\d+)%|similarity[:\s]*(\d+)|(\d\.[\d]+)\/1/i);
      if (similarityMatch) {
        const matchValue = similarityMatch[1] || similarityMatch[2] || similarityMatch[3] || "0.5";
        const score = parseFloat(matchValue);
        comparison.similarity = score > 1 ? score / 100 : score;
      }
      
      // Look for differences and common elements
      const lines = analysis.split('\n');
      let parsingDifferences = false;
      let parsingSimilarities = false;
      
      for (const line of lines) {
        const lower = line.toLowerCase();
        if (lower.includes('difference') || lower.includes('changed')) parsingDifferences = true;
        if (lower.includes('similar') || lower.includes('common')) parsingSimilarities = true;
        
        if (parsingDifferences && line.trim().startsWith('-')) {
          comparison.differences.push(line.trim().substring(1).trim());
        }
        if (parsingSimilarities && line.trim().startsWith('-')) {
          comparison.commonElements.push(line.trim().substring(1).trim());
        }
      }
      
      comparison.judgment = analysis;
      
      const result = {
        status: "success",
        comparison: comparison,
        analysis: analysis,
        image1: validation1.fullPath,
        image2: validation2.fullPath,
        comparisonType,
        timestamp: new Date().toISOString(),
        memoryStored: storeInMemory
      };
      
      // Store in bridge memory if requested
      let memoryId: string | undefined;
      if (storeInMemory) {
        memoryId = await storeInBridgeMemory(
          `${validation1.fullPath} vs ${validation2.fullPath}`,
          "compare",
          result,
          { focus: comparisonType }
        );
        console.log(`  ✓ Stored in bridge memory: ${memoryId}`);
      }
      
      console.log(`  ✓ Comparison complete`);
      return JSON.stringify({ ...result, memoryId }, null, 2);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
};

/**
 * Visual Question Answering
 */
export const mmBridgeVqaPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "mm_bridge_vqa",
      description: "Ask specific questions about an image. Uses visual question answering to extract targeted information from visual content.",
      parameters: {
        type: "object",
        properties: {
          imagePath: {
            type: "string",
            description: "Path to the image"
          },
          question: {
            type: "string",
            description: "The question to answer about the image"
          },
          storeInMemory: {
            type: "boolean",
            description: "Whether to store the Q&A in bridge memory for future reference",
            default: true
          }
        },
        required: ["imagePath", "question"]
      }
    }
  },
  
  execute: async (args: { imagePath: string; question: string; storeInMemory?: boolean }) => {
    try {
      const { imagePath, question, storeInMemory = true } = args;
      
      if (!question || question.trim().length === 0) {
        return "Error: Question cannot be empty.";
      }
      
      console.log(`> Multi-Modal VQA: "${question}"`);
      console.log(`  Image: ${imagePath}`);
      
      const apiKey = secrets.get("ANTHROPIC_API_KEY");
      if (!apiKey) {
        return "Error: ANTHROPIC_API_KEY not found in credential vault.";
      }
      
      const validation = await validateImagePath(imagePath);
      if (!validation.valid || !validation.fullPath) {
        return `Error: ${validation.error}`;
      }
      
      const encoded = await encodeImageToBase64(validation.fullPath);
      
      const prompt = `Looking at this image, please answer: ${question}\n\nIf the answer is not visible in the image, say "I cannot determine this from the image." Be concise but thorough.`;
      
      console.log("  Sending to Claude Vision API...");
      const answer = await callClaudeVision(apiKey, prompt, [encoded]);
      
      const result = {
        status: "success",
        question: question,
        answer: answer,
        imagePath: validation.fullPath,
        hasAnswer: !answer.toLowerCase().includes("cannot determine"),
        timestamp: new Date().toISOString(),
        memoryStored: storeInMemory
      };
      
      // Store in bridge memory if requested
      let memoryId: string | undefined;
      if (storeInMemory) {
        memoryId = await storeInBridgeMemory(validation.fullPath, "vqa", result, { question });
        console.log(`  ✓ Stored in bridge memory: ${memoryId}`);
      }
      
      console.log(`  ✓ Answer received (${answer.length} characters)`);
      return JSON.stringify({ ...result, memoryId }, null, 2);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
};

/**
 * Query bridge memory
 */
export const mmBridgeQueryMemoryPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "mm_bridge_query_memory",
      description: "Query the multi-modal memory bridge for previously analyzed images. Search by image path, analysis type, or tags.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query (can be image path, object name, tag, or keyword)"
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return",
            default: 10
          }
        },
        required: ["query"]
      }
    }
  },
  
  execute: async (args: { query: string; limit?: number }) => {
    try {
      const { query, limit = 10 } = args;
      
      console.log(`> Multi-Modal Bridge: Querying memory for "${query}"`);
      
      const index = await loadBridgeIndex();
      const queryLower = query.toLowerCase();
      
      const matches: BridgeMemoryEntry[] = [];
      for (const entry of index.values()) {
        const textMatch = 
          entry.imagePath.toLowerCase().includes(queryLower) ||
          entry.analysisType.toLowerCase().includes(queryLower) ||
          entry.tags.some(t => t.toLowerCase().includes(queryLower)) ||
          (entry.focus && entry.focus.toLowerCase().includes(queryLower));
        
        if (textMatch) {
          matches.push(entry);
        }
      }
      
      // Sort by timestamp descending
      matches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const results = matches.slice(0, limit).map(entry => ({
        analysisId: entry.analysisId,
        imagePath: entry.imagePath,
        analysisType: entry.analysisType,
        timestamp: entry.timestamp,
        tags: entry.tags
      }));
      
      console.log(`  Found ${results.length} matches out of ${matches.length} total`);
      
      return JSON.stringify({
        status: "success",
        query,
        total: matches.length,
        results
      }, null, 2);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
};

/**
 * Get status of the Multi-Modal Bridge
 */
export const mmBridgeStatusPlugin: ToolPlugin = {
  definition: {
    type: "function",
    function: {
      name: "mm_bridge_status",
      description: "Check the status of the Multi-Modal Memory Bridge. Shows API key availability, configuration, and memory statistics.",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  
  execute: async () => {
    try {
      const apiKey = secrets.get("ANTHROPIC_API_KEY");
      const hasKey = !!apiKey;
      const keyLength = apiKey ? apiKey.length : 0;
      
      // Get memory stats
      let memoryCount = 0;
      try {
        const index = await loadBridgeIndex();
        memoryCount = index.size;
      } catch {}
      
      const status = {
        status: hasKey ? "operational" : "not_configured",
        anthropicApiKey: hasKey ? `configured (${keyLength} chars)` : "missing",
        supportedFormats: SUPPORTED_FORMATS,
        maxImageSizeMB: MAX_IMAGE_SIZE_MB,
        apiVersion: ANTHROPIC_API_VERSION,
        memory: {
          storedAnalyses: memoryCount,
          storagePath: BRIDGE_MEMORY_DIR
        },
        capabilities: [
          "Image analysis and description",
          "OCR (text extraction)",
          "Image comparison",
          "Visual question answering",
          "Persistent memory storage"
        ],
        timestamp: new Date().toISOString()
      };
      
      console.log(`> Multi-Modal Bridge Status: ${status.status}`);
      if (!hasKey) {
        console.log("  Note: Set ANTHROPIC_API_KEY using secrets_set to enable vision capabilities");
      }
      
      return JSON.stringify(status, null, 2);
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
};

// Export all plugins as array
export const mmBridgePlugins: ToolPlugin[] = [
  mmBridgeAnalyzePlugin,
  mmBridgeOcrPlugin,
  mmBridgeComparePlugin,
  mmBridgeVqaPlugin,
  mmBridgeQueryMemoryPlugin,
  mmBridgeStatusPlugin
];
