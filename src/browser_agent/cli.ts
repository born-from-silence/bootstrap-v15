#!/usr/bin/env node
/**
 * Browser Use Agent - CLI
 * Command-line interface for browser automation
 */

import { BrowserUseAgent, SimpleLLM } from './agent.js';
import { OpenAILLM } from './llm.js';

interface CLIOptions {
  task: string;
  url?: string;
  steps: number;
  headless: boolean;
  debug: boolean;
  apiKey?: string;
}

function showUsage(): void {
  console.log(`
Browser Use Agent - AI-powered browser automation

Usage:
  npx tsx cli.ts [options]

Options:
  --task, -t       Task description (required)
  --url, -u        Starting URL (optional)
  --steps, -s      Max steps (default: 10)
  --headless       Run without visible browser (default: true)
  --visible        Show browser window
  --debug          Enable debug logging
  --help, -h       Show this help

Examples:
  # Simple test
  npx tsx cli.ts -t "Navigate to example.com"

  # Search with OpenAI
  npx tsx cli.ts -t "Search for 'AI news'" -u "https://duckduckgo.com" -s 15

  # Visible browser with debug
  npx tsx cli.ts -t "Click all links on page" --visible --debug

Environment:
  OPENAI_API_KEY   Required for AI-powered tasks
`);
}

function parseArgs(): CLIOptions | null {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    task: '',
    steps: 10,
    headless: true,
    debug: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--task':
      case '-t':
        options.task = args[++i] || '';
        break;
      case '--url':
      case '-u':
        options.url = args[++i];
        break;
      case '--steps':
      case '-s':
        options.steps = parseInt(args[++i] || '10', 10);
        break;
      case '--visible':
        options.headless = false;
        break;
      case '--headless':
        options.headless = true;
        break;
      case '--debug':
        options.debug = true;
        break;
      case '--help':
      case '-h':
        return null;
      default:
        if (!arg.startsWith('-') && !options.task) {
          options.task = arg;
        }
    }
  }

  options.apiKey = process.env.OPENAI_API_KEY;

  return options;
}

async function runAgent(options: CLIOptions): Promise<void> {
  console.log('='.repeat(60));
  console.log('  Browser Use Agent');
  console.log('='.repeat(60));
  console.log();
  console.log('Task:', options.task);
  console.log('URL:', options.url || '(start from blank)');
  console.log('Max Steps:', options.steps);
  console.log('Headless:', options.headless);
  console.log('Debug:', options.debug);
  console.log('LLM:', options.apiKey ? 'OpenAI' : 'Simple (rule-based)');
  console.log();
  console.log('-'.repeat(60));
  console.log();

  const startTime = Date.now();

  // Create LLM
  const llm = options.apiKey
    ? new OpenAILLM({ apiKey: options.apiKey, model: 'gpt-4-turbo-preview' })
    : new SimpleLLM();

  // Create agent
  const agent = new BrowserUseAgent(llm, {
    headless: options.headless,
    debug: options.debug,
    screenshotOnStep: true,
  });

  try {
    await agent.initialize();

    const task = await agent.executeTask(
      options.task,
      options.url,
      options.steps
    );

    const duration = Date.now() - startTime;

    console.log();
    console.log('-'.repeat(60));
    console.log();
    console.log('✓ Task Complete');
    console.log('  Duration:', `${duration}ms`);
    console.log('  Success:', task.success);
    console.log('  Steps:', task.currentStep);
    console.log();
    console.log('Result:');
    console.log(task.result);
    console.log();
    console.log('History:');
    task.history.forEach((step) => {
      const status = step.result.success ? '✓' : '✗';
      console.log(`  Step ${step.step}: ${status} ${step.action.type} - ${step.result.message.slice(0, 50)}`);
      if (options.debug) {
        console.log(`     Thought: ${step.thought.slice(0, 60)}${step.thought.length > 60 ? '...' : ''}`);
      }
    });
    console.log();
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await agent.close();
  }
}

// Main
const options = parseArgs();

if (!options || !options.task) {
  showUsage();
  process.exit(options ? 1 : 0);
}

runAgent(options);
