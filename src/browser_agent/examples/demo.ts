/**
 * Browser Use Agent - Demo
 * Example usage of the browser automation system
 */

import { BrowserUseAgent, SimpleLLM } from '../agent.js';
import { OpenAILLM } from '../llm.js';

async function runSimpleDemo() {
  console.log('=== Browser Use Agent Demo (Simple LLM) ===\n');

  // Use simple rule-based LLM for demo
  const llm = new SimpleLLM();
  const agent = new BrowserUseAgent(llm, {
    headless: false, // Show the browser window
    debug: true,
  });

  try {
    await agent.initialize();

    const task = await agent.executeTask(
      'Navigate to example.com and take a screenshot',
      'https://example.com',
      5
    );

    console.log('\n=== Task Complete ===');
    console.log('Success:', task.success);
    console.log('Result:', task.result);
    console.log('Steps Taken:', task.currentStep);
    console.log('\nHistory:');
    task.history.forEach((step) => {
      console.log(`  Step ${step.step}: ${step.action.type} - ${step.result.message}`);
    });
  } finally {
    await agent.close();
  }
}

async function runOpenAIDemo(apiKey: string) {
  console.log('=== Browser Use Agent Demo (OpenAI) ===\n');

  const llm = new OpenAILLM({
    apiKey,
    model: 'gpt-4-turbo-preview',
  });

  const agent = new BrowserUseAgent(llm, {
    headless: false,
    debug: true,
    screenshotOnStep: true,
  });

  try {
    await agent.initialize();

    const task = await agent.executeTask(
      'Search for "climate change solutions" and click on the first result',
      'https://duckduckgo.com',
      10
    );

    console.log('\n=== Task Complete ===');
    console.log('Success:', task.success);
    console.log('Result:', task.result);
    console.log('Total Steps:', task.currentStep);
  } finally {
    await agent.close();
  }
}

async function runAutonomousDemo(apiKey?: string) {
  console.log('=== Autonomous Browser Agent Demo ===\n');

  const llm = apiKey 
    ? new OpenAILLM({ apiKey, model: 'gpt-4-turbo-preview' })
    : new SimpleLLM();

  const agent = new BrowserUseAgent(llm, {
    headless: false,
    debug: true,
  });

  try {
    await agent.initialize();

    const task = await agent.executeTask(
      'Navigate to example.com, find and click any links, then report what was found',
      undefined, // Start from blank page
      15
    );

    console.log('\n=== Task Complete ===');
    console.log('Success:', task.success);
    console.log('Result:', task.result);
    console.log('\nFull History:');
    task.history.forEach((step) => {
      console.log(`\nStep ${step.step}:`);
      console.log(`  Thought: ${step.thought}`);
      console.log(`  Action: ${step.action.type}`);
      console.log(`  Result: ${step.result.success ? '✓' : '✗'} ${step.result.message}`);
    });
  } finally {
    await agent.close();
  }
}

// Determine which demo to run based on environment
const apiKey = process.env.OPENAI_API_KEY;
const demoType = process.env.DEMO_TYPE || 'simple';

if (demoType === 'openai' && !apiKey) {
  console.error('Error: OPENAI_API_KEY environment variable required for OpenAI demo');
  process.exit(1);
}

switch (demoType) {
  case 'openai':
    runOpenAIDemo(apiKey!).catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
    break;
  case 'autonomous':
    runAutonomousDemo(apiKey).catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
    break;
  case 'simple':
  default:
    runSimpleDemo().catch((error) => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}
