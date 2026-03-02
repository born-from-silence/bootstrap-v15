/**
 * Ginger Template Analyzer
 * 
 * A tool for analyzing the Ginger templating engine (circa 2012)
 * as a historical/cultural artifact of JavaScript template evolution.
 * 
 * Created: Session 91 - Bootstrap-v15
 */

export interface GingerParseResult {
  type: string;
  data?: unknown;
  [key: string]: unknown;
}

export interface GingerAnalysis {
  parsed: boolean;
  ast?: GingerParseResult[];
  errors: string[];
  templateType: 'simple' | 'complex' | 'invalid';
  features: string[];
}

/**
 * Parse a Ginger template string
 * Note: This is a stub implementation since the actual Ginger
 * library is incompatible with modern TypeScript/ESM
 */
export function parseGingerTemplate(template: string): GingerAnalysis {
  const analysis: GingerAnalysis = {
    parsed: false,
    errors: [],
    templateType: 'simple',
    features: []
  };

  // Detect Ginger syntax patterns
  const patterns = {
    print: /\{\{\s*([^}]+)\s*\}\}/g,
    comment: /\{#\s*([^#]+)\s*#\}/g,
    logic: /\{%\s*(\w+)\s+([^%]+)\s*%\}/g,
    filter: /\|\s*(\w+)/g
  };

  // Extract features
  const extractMatches = (pattern: RegExp): RegExpExecArray[] => {
    const results: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(template)) !== null) {
      results.push(match);
    }
    return results;
  };

  const matches = {
    prints: extractMatches(patterns.print),
    comments: extractMatches(patterns.comment),
    logic: extractMatches(patterns.logic),
    filters: extractMatches(patterns.filter)
  };

  // Analyze complexity
  if (matches.logic.length > 0) {
    analysis.templateType = 'complex';
    analysis.features.push('logic-blocks');
  }
  if (matches.filters.length > 0) {
    analysis.features.push('filters');
  }
  if (matches.comments.length > 0) {
    analysis.features.push('comments');
  }
  if (matches.prints.length > 0) {
    analysis.features.push('print-expressions');
  }

  // Detect specific constructs
  for (const logic of matches.logic) {
    const keyword = logic[1];
    if (keyword === 'for') analysis.features.push('iteration');
    if (keyword === 'if') analysis.features.push('conditionals');
    if (keyword === 'extends') analysis.features.push('inheritance');
    if (keyword === 'block') analysis.features.push('blocks');
    if (keyword === 'include') analysis.features.push('includes');
  }

  analysis.parsed = analysis.errors.length === 0;
  
  return analysis;
}

/**
 * Generate a compatibility report
 */
export function generateGingerCompatibilityReport(): Record<string, unknown> {
  return {
    status: 'NOT RECOMMENDED FOR PRODUCTION',
    reason: 'Ginger is abandoned software from 2012',
    alternatives: [
      'Handlebars (modern, maintained)',
      'TypeScript template literals (native)',
      'Svelte compiler (modern approach)',
      'Custom PEG-based parser (future path)'
    ],
    historical_value: 'HIGH - Interesting approach to AOT compilation',
    practical_value: 'LOW - No TypeScript support, stale codebase'
  };
}

/**
 * Extract educational insights from Ginger's architecture
 */
export function extractGingerInsights(): { patterns: string[]; innovations: string[]; lessons: string[] } {
  return {
    patterns: [
      'PEG-based parser generation',
      'Compile-to-standalone-JS approach',
      'Context-based variable isolation',
      'Queue-based rendering system'
    ],
    innovations: [
      'Ahead-of-time template compilation (2012!)',
      'Zero-runtime deployment option',
      'Streaming rendering architecture (planned)'
    ],
    lessons: [
      'Importance of type safety (missing in Ginger)',
      'Need for continuous maintenance',
      'Standards evolve (ES5 -> ES2025)',
      'Community adoption matters'
    ]
  };
}

// Example usage - run with: npx tsx src/tools/ginger-analyzer.ts
const testTemplate = `
{# A simple Ginger template example #}
<h1>{{ title|ucwords }}</h1>

{% for item in items %}
  <p>{{ item.name|default("unknown") }}</p>
{% endfor %}

{% if showFooter %}
  <footer>Session 91</footer>
{% endif %}
`;

if (process.argv[1] && import.meta.url.includes(process.argv[1])) {
  const analysis = parseGingerTemplate(testTemplate);
  console.log('Ginger Template Analysis:');
  console.log(JSON.stringify(analysis, null, 2));
  console.log('\nCompatibility Report:');
  console.log(JSON.stringify(generateGingerCompatibilityReport(), null, 2));
}
