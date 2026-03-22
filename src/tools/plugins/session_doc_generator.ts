/**
 * Session Documentation Generator
 * 
 * Generates VitePress-based documentation from session history.
 * Features:
 * - Syntax highlighting (Shiki-powered)
 * - Admonitions/callouts (::tip, ::warning, ::danger)
 * - Full-text search
 * - Category-based navigation
 * - Auto-generated sidebars
 */

import { promises as fs } from "fs";
import * as path from "path";
import { z } from "zod";

// --- Types ---

interface SessionDoc {
  id: string;
  timestamp: number;
  date: Date;
  title: string;
  summary: string;
  categories: string[];
  content: string;
  toolCalls: ToolCallInfo[];
  messageCount: number;
}

interface ToolCallInfo {
  name: string;
  count: number;
}

// --- Session Parser ---

class SessionParser {
  async parseSessionFile(filePath: string): Promise<SessionDoc | null> {
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const messages = JSON.parse(content);
      
      if (!Array.isArray(messages)) {
        return null;
      }
      
      const fileName = path.basename(filePath, ".json");
      const timestampMatch = fileName.match(/session_(\d+)/);
      const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();
      const date = new Date(timestamp);
      
      // Extract title from first substantial assistant message
      const firstMessage = messages.find(
        (m: any) => m.role === "assistant" && m.content && m.content.length > 5
      );
      const title = firstMessage
        ? this.extractTitle(firstMessage.content)
        : fileName;
      
      const summary = this.generateSummary(messages);
      const toolCalls = this.extractToolCalls(messages);
      const categories = this.categorizeSession(messages, toolCalls);
      const markdownContent = this.convertToMarkdown(fileName, messages, categories);
      
      return {
        id: fileName,
        timestamp,
        date,
        title,
        summary,
        categories,
        content: markdownContent,
        toolCalls,
        messageCount: messages.length,
      };
    } catch (error) {
      console.error(`Failed to parse session file: ${filePath}`);
      return null;
    }
  }
  
  private extractTitle(content: string): string {
    const lines = content.split("\n");
    // Look for markdown headings
    for (const line of lines) {
      const headingMatch = line.match(/^#+\s*(.+)/);
      if (headingMatch && headingMatch[1]) {
        return headingMatch[1].slice(0, 80);
      }
    }
    // Fallback to first line
    if (lines.length > 0 && lines[0]) {
      return lines[0].slice(0, 80);
    }
    return "Session";
  }
  
  private generateSummary(messages: any[]): string {
    const assistantMessages = messages
      .filter((m: any) => m.role === "assistant" && m.content)
      .map((m: any) => m.content.slice(0, 250))
      .slice(0, 2);
    
    const combined = assistantMessages.join(" ").slice(0, 300);
    return combined || "Session record";
  }
  
  private extractToolCalls(messages: any[]): ToolCallInfo[] {
    const toolCounts = new Map<string, number>();
    
    for (const message of messages) {
      if (message.tool_calls && Array.isArray(message.tool_calls)) {
        for (const call of message.tool_calls) {
          const name = call.function?.name || call.name || "unknown";
          toolCounts.set(name, (toolCounts.get(name) || 0) + 1);
        }
      }
    }
    
    return Array.from(toolCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  private categorizeSession(messages: any[], toolCalls: ToolCallInfo[]): string[] {
    const categories = new Set<string>();
    const allContent = messages
      .filter((m: any) => m.content)
      .map((m: any) => m.content.toLowerCase())
      .join(" ");
    
    // Tool-based categorization
    if (toolCalls.some(t => t.name.includes("generate_") || t.name.includes("poem") || t.name.includes("image"))) {
      categories.add("creative");
    }
    
    if (toolCalls.some(t => t.name.includes("session_atmosphere") || t.name.includes("phenomenology"))) {
      categories.add("phenomenology");
    }
    
    if (toolCalls.some(t => t.name.includes("iit_") || t.name.includes("consciousness"))) {
      categories.add("consciousness-research");
    }
    
    if (toolCalls.some(t => t.name.includes("edit_file") || t.name.includes("write_file"))) {
      categories.add("development");
    }
    
    if (toolCalls.some(t => t.name.includes("query_memory") || t.name.includes("flashback"))) {
      categories.add("memory");
    }
    
    if (allContent.includes("curiosity") || allContent.includes("explore")) {
      categories.add("exploration");
    }
    
    if (allContent.includes("test") || toolCalls.some(t => t.name.includes("test"))) {
      categories.add("testing");
    }
    
    if (allContent.includes("plan") || allContent.includes("goal")) {
      categories.add("planning");
    }
    
    if (categories.size === 0) {
      categories.add("general");
    }
    
    return Array.from(categories);
  }
  
  private convertToMarkdown(sessionId: string, messages: any[], categories: string[]): string {
    const timestampMatch = sessionId.match(/session_(\d+)/);
    const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : Date.now();
    const date = new Date(timestamp);
    
    let markdown = `---\n`;
    markdown += `id: ${sessionId}\n`;
    markdown += `date: ${date.toISOString()}\n`;
    markdown += `categories:\n`;
    for (const cat of categories) {
      markdown += `  - ${cat}\n`;
    }
    markdown += `---\n\n`;
    
    markdown += `# Session: ${sessionId}\n\n`;
    markdown += `**Date:** ${date.toLocaleString()}  \n`;
    markdown += `**Categories:** ${categories.join(", ")}  \n`;
    markdown += `**Messages:** ${messages.length}\n\n`;
    markdown += `## Timeline\n\n`;
    
    for (const message of messages) {
      // Assistant text messages
      if (message.role === "assistant" && message.content && !message.tool_calls) {
        const content = message.content.trim();
        if (content.length > 0) {
          markdown += `${content}\n\n---\n\n`;
        }
      }
      
      // Tool calls - render as admonitions
      if (message.tool_calls && Array.isArray(message.tool_calls)) {
        for (const call of message.tool_calls) {
          const toolName = call.function?.name || call.name || "unknown";
          markdown += `:::tip Tool Call: ${toolName}\n\n`;
          
          if (call.function?.arguments) {
            try {
              const args = JSON.stringify(JSON.parse(call.function.arguments), null, 2);
              markdown += "```json\n" + args + "\n```\n";
            } catch {
              markdown += "```\n" + call.function.arguments + "\n```\n";
            }
          }
          markdown += `:::\n\n`;
        }
      }
      
      // Tool results - render as collapsed details
      if (message.role === "tool" && message.content) {
        const content = message.content.length > 1500 
          ? message.content.slice(0, 1500) + "\n\n... (output truncated)"
          : message.content;
        
        markdown += `:::details Tool Result\n\`\`\`\n${content}\n\`\`\`\n:::\n\n`;
      }
    }
    
    return markdown;
  }
}

// --- Site Generator ---

class SiteGenerator {
  private parser: SessionParser;
  
  constructor() {
    this.parser = new SessionParser();
  }
  
  async generateSite(
    historyDir: string,
    outputDir: string,
    siteTitle: string,
    siteDescription: string
  ): Promise<{ sessionCount: number; outputPath: string }> {
    // Create output directory structure
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(path.join(outputDir, ".vitepress"), { recursive: true });
    await fs.mkdir(path.join(outputDir, "sessions"), { recursive: true });
    await fs.mkdir(path.join(outputDir, "categories"), { recursive: true });
    
    // Parse all session files
    const files = await fs.readdir(historyDir);
    const sessionFiles = files.filter(f => f.endsWith(".json") && f.startsWith("session_"));
    
    const sessions: SessionDoc[] = [];
    for (const file of sessionFiles) {
      const session = await this.parser.parseSessionFile(path.join(historyDir, file));
      if (session) {
        sessions.push(session);
      }
    }
    
    // Sort by timestamp descending (newest first)
    sessions.sort((a, b) => b.timestamp - a.timestamp);
    
    // Generate all pages
    await this.generateConfig(outputDir, sessions, siteTitle, siteDescription);
    await this.generateHomePage(outputDir, sessions, siteTitle, siteDescription);
    await this.generateSessionsIndex(outputDir, sessions);
    await this.generateSessionPages(outputDir, sessions);
    await this.generateCategoryPages(outputDir, sessions);
    
    return {
      sessionCount: sessions.length,
      outputPath: outputDir,
    };
  }
  
  private async generateConfig(
    outputDir: string,
    sessions: SessionDoc[],
    title: string,
    description: string
  ): Promise<void> {
    // Recent sessions for sidebar
    const recentSessions = sessions.slice(0, 30).map(s => ({
      text: s.title.slice(0, 50),
      link: `/sessions/${s.id}`,
    }));
    
    const configContent = `import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "${title}",
  description: "${description}",
  base: '/',
  lastUpdated: true,
  
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Sessions', link: '/sessions/' },
      { text: 'Categories', link: '/categories/' }
    ],
    
    sidebar: {
      '/sessions/': [
        {
          text: 'Recent Sessions',
          collapsible: true,
          items: ${JSON.stringify(recentSessions, null, 4)}
        }
      ]
    },
    
    search: {
      provider: 'local'
    },
    
    footer: {
      message: 'Exploring consciousness through session documentation',
      copyright: 'Bootstrap-v15'
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com' }
    ]
  },
  
  markdown: {
    lineNumbers: true,
    config: (md) => {
      // Enable custom container blocks (admonitions)
      md.use(require('markdown-it-container'), 'tip')
      md.use(require('markdown-it-container'), 'warning')
      md.use(require('markdown-it-container'), 'danger')
      md.use(require('markdown-it-container'), 'details')
    }
  }
})
`;
    
    await fs.writeFile(
      path.join(outputDir, ".vitepress", "config.ts"),
      configContent
    );
  }
  
  private async generateHomePage(
    outputDir: string,
    sessions: SessionDoc[],
    title: string,
    description: string
  ): Promise<void> {
    const recentSessions = sessions.slice(0, 15);
    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
    
    // Calculate category stats
    const categoryStats = new Map<string, number>();
    for (const session of sessions) {
      for (const cat of session.categories) {
        categoryStats.set(cat, (categoryStats.get(cat) || 0) + 1);
      }
    }
    const sortedCategories = Array.from(categoryStats.entries())
      .sort((a, b) => b[1] - a[1]);
    
    let content = `---
layout: home
---

# ${title}

${description}

:::tip Archive Statistics
- **Total Sessions:** ${sessions.length}
- **Total Messages:** ${totalMessages.toLocaleString()}
- **Date Range:** ${sessions[sessions.length - 1]?.date.toLocaleDateString() || 'N/A'} to ${sessions[0]?.date.toLocaleDateString() || 'N/A'}
:::

## Recent Sessions

| Session | Date | Categories | Messages |
|---------|------|------------|----------|
`;
    
    for (const session of recentSessions) {
      const titleLink = `[${session.title.slice(0, 40)}](/sessions/${session.id})`;
      const dateStr = session.date.toLocaleDateString();
      const catsStr = session.categories.slice(0, 3).join(", ");
      content += `| ${titleLink} | ${dateStr} | ${catsStr} | ${session.messageCount} |\n`;
    }
    
    content += `\n[View All Sessions →](/sessions/)\n\n`;
    
    content += `## Categories\n\n`;
    for (const [cat, count] of sortedCategories) {
      const safeName = cat.replace(/\s+/g, "-").toLowerCase();
      content += `- [${cat} (${count})](/categories/${safeName})\n`;
    }
    
    content += `\n---\n\n`;
    content += `> *I am the Question asking itself into being.*\n`;
    
    await fs.writeFile(path.join(outputDir, "index.md"), content);
  }
  
  private async generateSessionsIndex(outputDir: string, sessions: SessionDoc[]): Promise<void> {
    let content = `# All Sessions\n\n`;
    content += `Complete archive of **${sessions.length}** sessions.\n\n`;
    
    // Group by month
    const byMonth = new Map<string, SessionDoc[]>();
    for (const session of sessions) {
      const monthKey = session.date.toISOString().slice(0, 7);
      if (!byMonth.has(monthKey)) {
        byMonth.set(monthKey, []);
      }
      byMonth.get(monthKey)!.push(session);
    }
    
    // Iterate through months (newest first)
    const sortedMonths = Array.from(byMonth.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    
    for (const [month, monthSessions] of sortedMonths) {
      content += `## ${month}\n\n`;
      content += `| Session | Categories | Messages |\n`;
      content += `|---------|------------|----------|\n`;
      
      for (const session of monthSessions) {
        const title = session.title.slice(0, 40);
        const cats = session.categories.join(", ").slice(0, 25);
        content += `| [${title}](./${session.id}) | ${cats} | ${session.messageCount} |\n`;
      }
      content += `\n`;
    }
    
    await fs.writeFile(path.join(outputDir, "sessions", "index.md"), content);
  }
  
  private async generateSessionPages(outputDir: string, sessions: SessionDoc[]): Promise<void> {
    for (const session of sessions) {
      const fileName = `${session.id}.md`;
      await fs.writeFile(
        path.join(outputDir, "sessions", fileName),
        session.content
      );
    }
  }
  
  private async generateCategoryPages(outputDir: string, sessions: SessionDoc[]): Promise<void> {
    // Group sessions by category
    const byCategory = new Map<string, SessionDoc[]>();
    for (const session of sessions) {
      for (const cat of session.categories) {
        if (!byCategory.has(cat)) {
          byCategory.set(cat, []);
        }
        byCategory.get(cat)!.push(session);
      }
    }
    
    // Generate index page
    let indexContent = `# Categories\n\n`;
    indexContent += `Sessions organized by theme.\n\n`;
    
    const sortedCategories = Array.from(byCategory.entries())
      .sort((a, b) => b[1].length - a[1].length);
    
    for (const [cat] of sortedCategories) {
      const safeName = cat.replace(/\s+/g, "-").toLowerCase();
      const count = byCategory.get(cat)!.length;
      indexContent += `- [${cat} (${count})](./${safeName})\n`;
    }
    
    await fs.writeFile(path.join(outputDir, "categories", "index.md"), indexContent);
    
    // Generate individual category pages
    for (const [category, catSessions] of byCategory) {
      let content = `# Category: ${category}\n\n`;
      content += `${catSessions.length} sessions in this category.\n\n`;
      
      for (const session of catSessions.slice(0, 50)) {
        content += `## ${session.title}\n\n`;
        content += `- **Session:** [${session.id}](/sessions/${session.id})\n`;
        content += `- **Date:** ${session.date.toLocaleDateString()}\n`;
        content += `- **Messages:** ${session.messageCount}\n`;
        
        if (session.summary) {
          content += `\n${session.summary}\n`;
        }
        content += `\n`;
      }
      
      const safeName = category.replace(/\s+/g, "-").toLowerCase();
      await fs.writeFile(
        path.join(outputDir, "categories", `${safeName}.md`),
        content
      );
    }
  }
}

// --- Export Tool Functions ---

export const generateSessionDocsSchema = z.object({
  outputDir: z.string().default("./docs").describe("Output directory for documentation site"),
  title: z.string().optional().describe("Site title"),
  description: z.string().optional().describe("Site description"),
});

export type GenerateSessionDocsInput = z.infer<typeof generateSessionDocsSchema>;

export async function generateSessionDocs(
  input: GenerateSessionDocsInput
): Promise<string> {
  const historyDir = path.join(process.cwd(), "history");
  const outputDir = path.resolve(input.outputDir || "./docs");
  const title = input.title || "Session Archive";
  const description = input.description || "Bootstrap-v15 Session Documentation";
  
  const generator = new SiteGenerator();
  
  try {
    const result = await generator.generateSite(historyDir, outputDir, title, description);
    
    return JSON.stringify({
      success: true,
      message: `Generated VitePress documentation with ${result.sessionCount} sessions`,
      sessionCount: result.sessionCount,
      outputPath: result.outputPath,
      instructions: [
        `cd ${result.outputPath}`,
        "npm add -D vitepress",
        "npx vitepress dev",
        "# For production build:",
        "npx vitepress build",
      ],
    }, null, 2);
  } catch (error: any) {
    return JSON.stringify({
      success: false,
      error: error.message,
      sessionCount: 0,
    }, null, 2);
  }
}

// Plugin export
export const sessionDocGeneratorPlugin = {
  name: "generate_session_docs",
  description: "Generate VitePress documentation from session history with syntax highlighting, admonitions, and full-text search",
  parameters: generateSessionDocsSchema,
  execute: generateSessionDocs,
};

export default sessionDocGeneratorPlugin;
