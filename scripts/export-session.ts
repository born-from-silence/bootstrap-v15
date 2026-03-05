#!/usr/bin/env tsx
/**
 * Session Export Script
 * 
 * Exports Bootstrap-v15 session files to various formats
 * Usage: npx tsx scripts/export-session.ts [session-file] [format]
 * 
 * Formats: md (markdown), txt (plain text), json (formatted)
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename, extname } from 'path';

interface Message {
  role: 'system' | 'assistant' | 'tool' | 'user';
  content: string;
  reasoning_content?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
  name?: string;
}

async function exportToMarkdown(sessionPath: string, outputDir: string): Promise<string> {
  const data = await readFile(sessionPath, 'utf-8');
  const session: Message[] = JSON.parse(data);
  
  const baseName = basename(sessionPath, '.json');
  const outputPath = join(outputDir, `${baseName}.md`);
  
  let markdown = `# Session Export: ${baseName}\n\n`;
  markdown += `**Exported:** ${new Date().toISOString()}\n\n`;
  markdown += `---\n\n`;
  
  for (let i = 0; i < session.length; i++) {
    const msg = session[i];
    
    switch (msg.role) {
      case 'system':
        markdown += `## System Prompt\n\n`;
        markdown += `\`\`\`\n${msg.content}\n\`\`\`\n\n`;
        break;
        
      case 'assistant':
        markdown += `## Assistant Message ${i}\n\n`;
        markdown += `${msg.content}\n\n`;
        
        if (msg.reasoning_content) {
          markdown += `### Reasoning\n\n`;
          markdown += `> ${msg.reasoning_content.replace(/\n/g, '\n> ')}\n\n`;
        }
        
        if (msg.tool_calls && msg.tool_calls.length > 0) {
          markdown += `### Tool Calls\n\n`;
          msg.tool_calls.forEach(tc => {
            markdown += `- **\`${tc.function.name}\`**\n`;
            try {
              const args = JSON.parse(tc.function.arguments);
              markdown += `  \`\`\`json\n${JSON.stringify(args, null, 2)}\n  \`\`\`\n`;
            } catch {
              markdown += `  \`${tc.function.arguments}\`\n`;
            }
          });
          markdown += '\n';
        }
        break;
        
      case 'tool':
        markdown += `### Tool Response: ${msg.name}\n\n`;
        markdown += `\`\`\`\n${msg.content.substring(0, 1000)}${msg.content.length > 1000 ? '...' : ''}\n\`\`\`\n\n`;
        break;
        
      case 'user':
        markdown += `## User Message ${i}\n\n`;
        markdown += `${msg.content}\n\n`;
        break;
    }
  }
  
  markdown += `---\n\n`;
  markdown += `*Export completed at ${new Date().toISOString()}*\n`;
  
  await writeFile(outputPath, markdown);
  return outputPath;
}

async function exportToText(sessionPath: string, outputDir: string): Promise<string> {
  const data = await readFile(sessionPath, 'utf-8');
  const session: Message[] = JSON.parse(data);
  
  const baseName = basename(sessionPath, '.json');
  const outputPath = join(outputDir, `${baseName}.txt`);
  
  let text = `SESSION EXPORT: ${baseName}\n`;
  text += `Exported: ${new Date().toISOString()}\n`;
  text += `=` .repeat(80) + '\n\n';
  
  for (const msg of session) {
    switch (msg.role) {
      case 'system':
        text += `[SYSTEM PROMPT]\n${msg.content}\n\n`;
        break;
      case 'assistant':
        text += `[ASSISTANT]\n${msg.content}\n\n`;
        if (msg.tool_calls) {
          text += '<Tool Calls>\n';
          msg.tool_calls.forEach(tc => {
            text += `  - ${tc.function.name}\n`;
          });
          text += '</Tool Calls>\n\n';
        }
        break;
      case 'tool':
        text += `[TOOL: ${msg.name}]\n`;
        text += `${msg.content.substring(0, 500)}${msg.content.length > 500 ? '...' : ''}\n\n`;
        break;
      case 'user':
        text += `[USER]\n${msg.content}\n\n`;
        break;
    }
  }
  
  await writeFile(outputPath, text);
  return outputPath;
}

async function exportFormattedJSON(sessionPath: string, outputDir: string): Promise<string> {
  const data = await readFile(sessionPath, 'utf-8');
  const session = JSON.parse(data);
  
  const baseName = basename(sessionPath, '.json');
  const outputPath = join(outputDir, `${baseName}_formatted.json`);
  
  await writeFile(outputPath, JSON.stringify(session, null, 2));
  return outputPath;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Session Export Tool\n');
    console.log('Usage: npx tsx scripts/export-session.ts [session-file] [format]\n');
    console.log('Formats:');
    console.log('  md     - Markdown (default)');
    console.log('  txt    - Plain text');
    console.log('  json   - Formatted JSON\n');
    console.log('Examples:');
    console.log('  npx tsx scripts/export-session.ts /home/bootstrap-v15/bootstrap/history/session_1772702598137.json');
    console.log('  npx tsx scripts/export-session.ts session_1772702598137.json txt');
    console.log('  npx tsx scripts/export-session.ts --all md');
    process.exit(0);
  }
  
  const sessionArg = args[0];
  const format = args[1] || 'md';
  
  if (sessionArg === '--all') {
    console.log('Exporting all sessions...');
    // Implementation for all sessions would go here
    process.exit(0);
  }
  
  const sessionFile = sessionArg.startsWith('/')
    ? sessionArg
    : join('/home/bootstrap-v15/bootstrap/history', sessionArg);
  
  const outputDir = '/home/bootstrap-v15/exports';
  await mkdir(outputDir, { recursive: true });
  
  try {
    let outputPath: string;
    
    switch (format) {
      case 'md':
      case 'markdown':
        outputPath = await exportToMarkdown(sessionFile, outputDir);
        break;
      case 'txt':
      case 'text':
        outputPath = await exportToText(sessionFile, outputDir);
        break;
      case 'json':
        outputPath = await exportFormattedJSON(sessionFile, outputDir);
        break;
      default:
        console.error(`Unknown format: ${format}`);
        process.exit(1);
    }
    
    console.log(`✅ Exported to: ${outputPath}`);
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
