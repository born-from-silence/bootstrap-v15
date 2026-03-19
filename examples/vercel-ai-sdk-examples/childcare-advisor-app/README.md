# Expert Childcare Advisor

A production-ready AI-powered childcare assistant built with the Vercel AI SDK v4.

## Features

### 🔥 Core Capabilities
- **Sleep Analysis**: Calculate sleep quality scores and recommendations
- **Wake Window Calculator**: Generate optimal daily schedules
- **Feeding Recommendations**: Calculate feeding amounts by age
- **Developmental Milestones**: Track and assess child's progress
- **Temperature Safety**: Assess fever severity and recommend actions
- **Multi-Tool Coordination**: Chain multiple tools for comprehensive advice

### 🛠️ Technical Features
- **Function Tools**: Auto-execute for calculations
- **Data Tools**: Manual injection for database integration
- **Streaming Responses**: Real-time AI output
- **Error Handling**: Graceful degradation
- **Type Safety**: Full TypeScript + Zod integration

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Set your Anthropic API key
export ANTHROPIC_API_KEY=your_key_here

# Run the demo
cd childcare-advisor-app
npm run demo
```

### Usage Examples

```typescript
import { generateText } from 'ai';
import { functionTools } from './tools/childcare-tools';

const result = await generateText({
  model: anthropic('claude-3-5-sonnet'),
  messages: [
    { role: 'user', content: 'Calculate sleep quality for a 6-month-old...' }
  ],
  tools: functionTools,
  maxSteps: 3,
});

console.log(result.text);
```

## Tool Documentation

### Function Tools (Auto-Execute)

These tools automatically execute when called by the LLM:

| Tool | Purpose | Parameters |
|------|---------|------------|
| `sleepQuality` | Calculate sleep quality score | `sleepHours`, `ageMonths`, `interruptions`, `napCount`, `bedtime`, `wakeTime` |
| `wakeWindow` | Generate optimal schedule | `ageMonths`, `wakeTime`, `napCount` |
| `feedingCalculator` | Calculate feeding amounts | `ageMonths`, `weightKg`, `feedingType`, `feedingsToday` |
| `milestoneChecker` | Check developmental milestones | `ageMonths`, `achievedMilestones` |
| `temperatureSafety` | Assess fever severity | `temperature`, `ageMonths`, `measurementType`, `symptoms` |

### Data Tools (Manual Injection)

These tools require manual data injection:

| Tool | Purpose | Use Case |
|------|---------|----------|
| `childProfile` | Child's profile data | RAG context injection |
| `historicalSleep` | Past sleep patterns | Trend analysis |
| `feedingHistory` | Previous feeding data | Nutrition tracking |
| `milestoneProgress` | Current milestone status | Progress evaluation |
| `safetyGuidelines` | Age-specific safety info | Contextual recommendations |

## API Reference

### Sleep Quality Tool

```typescript
const result = await sleepQualityTool.execute({
  sleepHours: 11.5,
  ageMonths: 12,
  interruptions: 1,
  napCount: 2,
  bedtime: '19:30',
  wakeTime: '07:00',
});

// Returns:
// {
//   score: 85,
//   quality: 'good',
//   expectedSleep: 12,
//   recommendations: [...],
//   ...
// }
```

### Wake Window Calculator

```typescript
const result = await wakeWindowTool.execute({
  ageMonths: 15,
  wakeTime: '07:00',
  napCount: 1,
});

// Returns:
// {
//   wakeWindows: { window1: 300, lastWindow: 360 },
//   recommendedSchedule: [
//     { type: 'wake', time: '07:00' },
//     { type: 'nap1', time: '12:00', duration: 120 },
//     { type: 'bedtime', time: '19:00' },
//   ],
//   ...
// }
```

### Feeding Calculator

```typescript
const result = await feedingCalculatorTool.execute({
  ageMonths: 6,
  weightKg: 7.8,
  feedingType: 'mixed',
  feedingsToday: 4,
});

// Returns:
// {
//   recommendations: {
//     dailyMilkOunces: 19.5,
//     perFeedingOunces: 6,
//     dailyFeeds: 6,
//     remainingFeedsToday: 2,
//   },
//   solidFoods: ['Rice cereal', 'Pureed vegetables'],
//   ...
// }
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  UI Components                                         ││
│  │  - Chat Interface                                      ││
│  │  - Dashboard                                           ││
│  │  - Schedule Viewer                                     ││
│  └─────────────────────────────────────────────────────────┘│
│                          │                                   │
│  ┌───────────────────────▼─────────────────────────────────┐│
│  │  Vercel AI SDK                                          ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │  Function Tools (Auto-Execute)                 │   ││
│  │  │  sleepQuality(), wakeWindow(), ...             │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  │  ┌─────────────────────────────────────────────────┐   ││
│  │  │  Data Tools (Manual Injection)                 │   ││
│  │  │  childProfile(), historicalSleep(), ...        │   ││
│  │  └─────────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                        Server                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Database (PostgreSQL/Supabase)                        ││
│  │  - child_profiles                                      ││
│  │  - sleep_logs                                          ││
│  │  - feeding_records                                     ││
│  │  - milestones                                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- childcare-tools.test.ts

# Watch mode
npm run test:watch
```

### Adding New Tools

1. Define the tool in `tools/childcare-tools.ts`:

```typescript
export const myNewTool = tool({
  description: 'What this tool does...',
  parameters: z.object({
    param1: z.string().describe('Parameter description'),
  }),
  execute: async ({ param1 }) => {
    // Your logic here
    return { result: '...' };
  },
});
```

2. Add to exports:

```typescript
export const functionTools = {
  ...existingTools,
  myNewTool,
};
```

3. Write tests in `tools/childcare-tools.test.ts`

4. Update TypeScript types if needed

## Error Handling

Tools return structured errors:

```typescript
{
  success: false,
  error: 'Error message',
  fallback: 'What to do instead',
}
```

LLM receives error context and can retry or suggest alternatives.

## Performance

- Tool execution: <500ms
- Streaming: Real-time
- Type safety: Compile-time
- Caching: Supported via wrapper pattern

## Security

- **HIPAA Compliance**: Use secure database
- **PII Handling**: Redact sensitive data
- **Rate Limiting**: Implemented at API gateway
- **Authentication**: Required for data access

## Contributing

1. Follow TypeScript best practices
2. Write comprehensive tests
3. Update documentation
4. Validate Zod schemas
5. Handle edge cases

## License

MIT - See parent directory

## Acknowledgments

Built by Bootstrap-v15 as part of the Vercel AI SDK examples collection.
