/**
 * Data Extraction Example
 * Demonstrates structured data extraction from web pages
 */

import { BrowserUseAgent } from '../agent.js';
import { OpenAILLM, AnthropicLLM } from '../llm.js';

interface ProductInfo {
  name: string;
  price?: string;
  description?: string;
  url?: string;
}

/**
 * Example: Extract product information from an e-commerce site
 */
async function extractProductData(siteUrl: string, apiKey: string) {
  console.log(`Extracting data from: ${siteUrl}`);

  const llm = new OpenAILLM({ apiKey, model: 'gpt-4-turbo-preview' });
  const agent = new BrowserUseAgent(llm, { headless: true, debug: true });

  try {
    await agent.initialize();

    const task = await agent.executeTask(
      `Navigate to ${siteUrl}, scroll down to load products, then extract:
      - Product names
      - Prices (if visible)
      - Any product descriptions
      
      When done, terminate with success and summarize what was found.`,
      siteUrl,
      15
    );

    console.log('Extraction Complete:');
    console.log(task.result);
    console.log('\nHistory:');
    task.history.forEach((step) => {
      if (step.action.type === 'extract') {
        console.log(`Extracted:`, step.result.data);
      }
    });

    return task;
  } finally {
    await agent.close();
  }
}

/**
 * Example: Monitor a webpage for changes
 */
async function monitorPage(siteUrl: string, checkInterval: number /* ms */, apiKey: string) {
  const llm = new OpenAILLM({ apiKey, model: 'gpt-4-turbo-preview' });
  
  console.log(`Monitoring ${siteUrl} every ${checkInterval}ms`);

  let lastContent: string | null = null;
  const startTime = Date.now();
  const duration = 60000; // Monitor for 60 seconds

  while (Date.now() - startTime < duration) {
    const agent = new BrowserUseAgent(llm, { headless: true });
    
    try {
      await agent.initialize();

      const task = await agent.executeTask(
        `Navigate to ${siteUrl}, take a screenshot, and extract the main content area text.`,
        siteUrl,
        5
      );

      const extractSteps = task.history.filter((s) => s.action.type === 'extract');
      const currentContent = extractSteps.length > 0
        ? JSON.stringify(extractSteps[extractSteps.length - 1].result.data)
        : null;

      if (lastContent && currentContent !== lastContent) {
        console.log('Changes detected!');
        // Could trigger notifications here
      } else {
        console.log(`[${new Date().toISOString()}] No changes detected`);
      }

      lastContent = currentContent;
    } finally {
      await agent.close();
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }
}

/**
 * Example: Form filling and submission
 */
async function fillForm(formUrl: string, formData: Record<string, string>, apiKey: string) {
  const llm = new OpenAILLM({ apiKey, model: 'gpt-4-turbo-preview' });
  const agent = new BrowserUseAgent(llm, { headless: false, debug: true });

  try {
    await agent.initialize();

    const task = await agent.executeTask(
      `Navigate to ${formUrl} and fill out the form with:
      ${Object.entries(formData)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n')}
      
      Then submit the form.`,
      formUrl,
      20
    );

    console.log('Form submission complete:', task.success);
    console.log(task.result);

    return task;
  } finally {
    await agent.close();
  }
}

// Example usage execution
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY required');
  process.exit(1);
}

const exampleType = process.argv[2] || 'extract';

switch (exampleType) {
  case 'extract':
    extractProductData('https://example.com', apiKey).catch(console.error);
    break;
  case 'monitor':
    monitorPage('https://example.com', 10000, apiKey).catch(console.error);
    break;
  case 'form':
    fillForm('https://example.com/form', { name: 'Test User', email: 'test@example.com' }, apiKey).catch(console.error);
    break;
  default:
    console.log('Usage: extract | monitor | form');
}
