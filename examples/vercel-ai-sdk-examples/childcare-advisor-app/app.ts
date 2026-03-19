/**
 * Expert Childcare Advisor Application
 * Main entry point for the AI-powered childcare assistant
 * 
 * Features:
 * - Natural language chat interface
 * - Sleep quality analysis
 * - Feeding recommendations  
 * - Developmental milestone tracking
 * - Safety guidance
 * 
 * Uses Vercel AI SDK v4 with both function and data tools
 */

import { generateText, streamText, CoreMessage } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import {
  functionTools,
  dataTools,
  allTools,
} from './tools/childcare-tools';

// Initialize Anthropic client
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-3-5-sonnet-20241022';

// ============================================================================
// MOCK DATA FOR DEMO
// ============================================================================

const MOCK_CHILDREN = [
  {
    id: 'child1',
    name: 'Emma',
    birthDate: '2023-03-15',
    ageMonths: 12,
    weightKg: 9.5,
    feedingType: 'mixed',
  },
  {
    id: 'child2',
    name: 'Liam',
    birthDate: '2023-09-20',
    ageMonths: 6,
    weightKg: 7.8,
    feedingType: 'breast',
  },
];

// Mock data injection for data tools
async function injectMockData(toolCall: any) {
  const { toolName, args } = toolCall;
  
  switch (toolName) {
    case 'childProfile':
      return {
        child: MOCK_CHILDREN.find(c => c.id === args.childId) || null,
        message: 'Profile retrieved',
      };
      
    case 'historicalSleep':
      return {
        childId: args.childId,
        daysAnalyzed: args.days || 7,
        averageSleepHours: 11.2,
        averageQuality: 'good',
        trend: 'improving',
        data: [
          { date: '2024-03-19', hours: 12, quality: 95 },
          { date: '2024-03-18', hours: 11, quality: 85 },
          { date: '2024-03-17', hours: 10.5, quality: 75 },
        ],
      };
      
    case 'feedingHistory':
      return {
        childId: args.childId,
        totalFeeds: 18,
        averageDaily: 6,
        nutritionStatus: 'adequate',
      };
      
    case 'milestoneProgress':
      return {
        childId: args.childId,
        category: args.category || 'all',
        achieved: ['Smiles', 'Rolls over', 'Sits'],
        pending: ['Walks', '3-word phrases'],
        progress: 65,
      };
      
    case 'safetyGuidelines':
      return {
        ageMonths: args.ageMonths,
        category: args.category || 'general',
        guidelines: [
          'Always place baby on back to sleep',
          'Remove loose bedding from crib',
          'Keep small objects away',
        ],
      };
      
    default:
      return { error: 'Unknown data tool' };
  }
}

// ============================================================================
// DEMO FUNCTIONS
// ============================================================================

/**
 * Demo: Sleep Analysis Conversation
 */
export async function demoSleepAnalysis() {
  console.log('=== Demo: Sleep Analysis for Liam ===\n');
  
  const messages: CoreMessage[] = [
    {
      role: 'system',
      content: 'You are an expert childcare advisor. You have access to tools that can calculate sleep quality, wake windows, and feeding recommendations. Always use appropriate tools when making recommendations.',
    },
    {
      role: 'user',
      content: 'My 6-month-old baby Liam woke up at 7 AM, had 3 naps totaling 4 hours, went to bed at 8 PM, and woke up 3 times in the night. How is his sleep quality?',
    },
  ];
  
  const result = await generateText({
    model: anthropic(MODEL),
    messages,
    tools: allTools,
    maxSteps: 3,
    onStepFinish: async ({ toolCalls, toolResults }) => {
      // Handle data tools
      for (const call of toolCalls) {
        if (!('execute' in allTools[call.toolName as keyof typeof allTools])) {
          console.log(`[DATA] Injecting mock data for ${call.toolName}`);
          // In real app, this would fetch from database
        }
      }
    },
  });
  
  console.log('AI Response:', result.text);
  console.log('\nTool Calls Made:', result.toolCalls.map(t => t.toolName));
}

/**
 * Demo: Feeding Recommendations
 */
export async function demoFeedingRecommendations() {
  console.log('=== Demo: Feeding Schedule Calculation ===\n');
  
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: 'My baby is 12 months old, weighs 10kg, and I\'ve already fed them 3 times today. How much more should they eat?',
    },
  ];
  
  const result = await generateText({
    model: anthropic(MODEL),
    messages,
    tools: functionTools,
    maxSteps: 2,
  });
  
  console.log('AI Response:', result.text);
}

/**
 * Demo: Developmental Milestones Check
 */
export async function demoMilestoneCheck() {
  console.log('=== Demo: Developmental Milestones ===\n');
  
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: 'Check developmental milestones for a 9-month-old who can sit, crawl, and babble',
    },
  ];
  
  const result = await generateText({
    model: anthropic(MODEL),
    messages,
    tools: functionTools,
  });
  
  console.log('AI Response:', result.text);
}

/**
 * Demo: Wake Window Schedule Generator
 */
export async function demoWakeWindowSchedule() {
  console.log('=== Demo: Wake Window Schedule ===\n');
  
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: 'Create an optimal daily schedule for my 15-month-old who wakes up at 7 AM and takes 1 nap.',
    },
  ];
  
  const result = await generateText({
    model: anthropic(MODEL),
    messages,
    tools: functionTools,
  });
  
  console.log('AI Response:', result.text);
}

/**
 * Demo: Temperature Safety Check
 */
export async function demoTemperatureSafety() {
  console.log('=== Demo: Fever Assessment ===\n');
  
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: 'My 8-month-old has a temperature of 101.2°F taken rectally. They seem alert and are eating. What should I do?',
    },
  ];
  
  const result = await generateText({
    model: anthropic(MODEL),
    messages,
    tools: functionTools,
  });
  
  console.log('AI Response:', result.text);
}

/**
 * Demo: Multi-turn Conversation
 */
export async function demoMultiTurnConversation() {
  console.log('=== Demo: Multi-Turn Conversation ===\n');
  
  const messages: CoreMessage[] = [
    {
      role: 'user',
      content: 'Tell me about my baby Emma\'s sleep, feeding, and overall development.',
    },
  ];
  
  // First turn
  const result1 = await generateText({
    model: anthropic(MODEL),
    messages,
    tools: allTools,
    maxSteps: 5,
    onStepFinish: async ({ toolCalls }) => {
      // Inject data for data tools
      for (const call of toolCalls) {
        if (call.toolName === 'childProfile') {
          const mockData = await injectMockData(call);
          console.log(`[INJECTED] Child profile for ${call.args.childId}`);
        }
      }
    },
  });
  
  console.log('\nFirst Response:', result1.text);
  
  // Add follow-up
  messages.push({ role: 'assistant', content: result1.text });
  messages.push({
    role: 'user',
    content: 'Based on that, what adjustments should I make to her sleep schedule?',
  });
  
  const result2 = await generateText({
    model: anthropic(MODEL),
    messages,
    tools: functionTools,
  });
  
  console.log('\nFollow-up Response:', result2.text);
}

/**
 * Demo: Interactive Chat Loop
 */
export async function demoInteractiveChat() {
  console.log('=== Interactive Childcare Chat ===\n');
  console.log('Type your childcare question. Examples:');
  console.log('- "What\'s the ideal bedtime for a 6-month-old?"');
  console.log('- "Calculate sleep quality for 10 hours, 2 interruptions"');
  console.log('- "Check milestones for 18-month-old"');
  console.log('- Type "quit" to exit\n');
  
  const messages: CoreMessage[] = [];
  
  // In real implementation, this would read from console
  // For demo, we simulate a conversation
  const sampleQueries = [
    'What\'s the ideal amount of sleep for a 6-month-old baby?',
    'My baby is 12 months old and weighs 10kg. How much food should they eat?',
    'Is my baby on track if they can roll over, sit, and babble at 9 months?',
  ];
  
  for (const query of sampleQueries) {
    console.log(`\n👤 User: ${query}`);
    messages.push({ role: 'user', content: query });
    
    const result = await generateText({
      model: anthropic(MODEL),
      messages,
      tools: allTools,
      maxSteps: 3,
      onStepFinish: async ({ toolCalls }) => {
        for (const call of toolCalls) {
          if (!('execute' in (allTools as any)[call.toolName])) {
            console.log(`[DATA] Would fetch ${call.toolName} data`);
          }
        }
      },
    });
    
    console.log(`\n🤖 AI: ${result.text}`);
    messages.push({ role: 'assistant', content: result.text });
  }
}

/**
 * Demo: Streaming Response
 */
export async function demoStreamingResponse() {
  console.log('=== Demo: Streaming Response ===\n');
  
  const { textStream, toolCalls, toolResults } = streamText({
    model: anthropic(MODEL),
    messages: [
      {
        role: 'user',
        content: 'Analyze sleep quality for a 15-month-old who slept 11 hours, had 1 interruption, 1 nap, bedtime at 7 PM, wake time at 6 AM',
      },
    ],
    tools: functionTools,
  });
  
  console.log('AI Response: ');
  for await (const delta of textStream) {
    process.stdout.write(delta);
  }
  
  const calls = await toolCalls;
  const results = await toolResults;
  
  console.log('\n\n--- Stats ---');
  console.log(`Tool calls: ${calls.length}`);
  results.forEach(r => console.log(`- ${r.toolName}: ${JSON.stringify(r.result).slice(0, 100)}...`));
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  Expert Childcare Advisor                                  ║');
  console.log('║  AI-Powered Childcare Assistant                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\nAvailable demos:\n');
  console.log('1. Sleep Analysis');
  console.log('2. Feeding Recommendations');
  console.log('3. Milestone Check');
  console.log('4. Wake Window Schedule');
  console.log('5. Temperature Safety');
  console.log('6. Multi-Turn Conversation');
  console.log('7. Interactive Chat');
  console.log('8. Streaming Response\n');
  
  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  Warning: ANTHROPIC_API_KEY not set. Some demos will not work.\n');
  }
  
  // Uncomment to run specific demos:
  // await demoSleepAnalysis();
  // await demoFeedingRecommendations();
  // await demoMilestoneCheck();
  // await demoWakeWindowSchedule();
  // await demoTemperatureSafety();
  // await demoMultiTurnConversation();
  // await demoInteractiveChat();
  // await demoStreamingResponse();
  
  console.log('\n✅ Demo initialization complete.');
  console.log('To run demos, uncomment the demo function calls in main().');
}

// Export for use in other modules
export {
  allTools,
  functionTools,
  dataTools,
  MOCK_CHILDREN,
  injectMockData,
};

if (require.main === module) {
  main().catch(console.error);
}
