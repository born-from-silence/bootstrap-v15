/**
 * Visualization Plugin
 * 
 * Generates visual representations of session history data.
 * Self-reflection tools for understanding patterns over time.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

const LTM_DIR = path.join(process.cwd(), 'ltm');
const INDEX_FILE = path.join(LTM_DIR, 'memory_index.json');
const OUTPUT_DIR = path.join(process.cwd(), 'creations', 'visualizations');

interface SessionEntry {
  timestamp: number;
  file: string;
  messageCount: number;
  topics: string[];
  decisions: string[];
  toolsUsed: string[];
  summary: string;
}

interface SessionMetrics {
  totalSessions: number;
  totalMessages: number;
  totalDecisions: number;
  totalTools: number;
  timeSpan: {
    start: Date;
    end: Date;
    durationHours: number;
  };
  activity: {
    messagesPerSession: number;
    decisionsPerSession: number;
    decisionsPerMessage: number;
  };
}

interface ToolPopularity {
  tool: string;
  count: number;
  sessions: number;
}

interface TopicTrend {
  topic: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

interface TimelinePoint {
  timestamp: Date;
  sessionIndex: number;
  messageCount: number;
  decisionCount: number;
  toolsUsed: string[];
  topics: string[];
}

interface VisualizationData {
  generatedAt: string;
  sessionMetrics: SessionMetrics;
  toolPopularity: ToolPopularity[];
  topicTrends: TopicTrend[];
  timeline: TimelinePoint[];
  rawSessions: SessionEntry[];
}

/**
 * Load session data from the memory index
 */
async function loadSessionData(): Promise<SessionEntry[]> {
  try {
    const content = await fs.readFile(INDEX_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load session index: ${(error as Error).message}`);
  }
}

/**
 * Calculate overall session metrics
 */
function calculateMetrics(sessions: SessionEntry[]): SessionMetrics {
  const timestamps = sessions.map(s => s.timestamp).sort((a, b) => a - b);
  const start = new Date(timestamps[0]);
  const end = new Date(timestamps[timestamps.length - 1]);
  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
  const totalDecisions = sessions.reduce((sum, s) => sum + s.decisions.length, 0);
  const totalTools = sessions.reduce((sum, s) => sum + s.toolsUsed.length, 0);

  return {
    totalSessions: sessions.length,
    totalMessages,
    totalDecisions,
    totalTools,
    timeSpan: { start, end, durationHours: Math.round(durationHours * 100) / 100 },
    activity: {
      messagesPerSession: Math.round((totalMessages / sessions.length) * 100) / 100,
      decisionsPerSession: Math.round((totalDecisions / sessions.length) * 100) / 100,
      decisionsPerMessage: Math.round((totalDecisions / totalMessages) * 100) / 100,
    },
  };
}

/**
 * Calculate tool popularity statistics
 */
function calculateToolPopularity(sessions: SessionEntry[]): ToolPopularity[] {
  const toolStats = new Map<string, { count: number; sessions: Set<number> }>();

  sessions.forEach((session, idx) => {
    session.toolsUsed.forEach(tool => {
      if (!toolStats.has(tool)) {
        toolStats.set(tool, { count: 0, sessions: new Set() });
      }
      const stats = toolStats.get(tool)!;
      stats.count++;
      stats.sessions.add(idx);
    });
  });

  return Array.from(toolStats.entries())
    .map(([tool, stats]) => ({
      tool,
      count: stats.count,
      sessions: stats.sessions.size,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate topic trends over time
 */
function calculateTopicTrends(sessions: SessionEntry[]): TopicTrend[] {
  const topicStats = new Map<string, { count: number; firstSeen: number; lastSeen: number }>();

  sessions.forEach((session, idx) => {
    session.topics.forEach(topic => {
      if (!topicStats.has(topic)) {
        topicStats.set(topic, { count: 0, firstSeen: idx, lastSeen: idx });
      }
      const stats = topicStats.get(topic)!;
      stats.count++;
      stats.lastSeen = idx;
    });
  });

  return Array.from(topicStats.entries())
    .map(([topic, stats]) => ({
      topic,
      count: stats.count,
      firstSeen: new Date(sessions[stats.firstSeen]?.timestamp || 0),
      lastSeen: new Date(sessions[stats.lastSeen]?.timestamp || 0),
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Build timeline of activity
 */
function buildTimeline(sessions: SessionEntry[]): TimelinePoint[] {
  return sessions
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((session, idx) => ({
      timestamp: new Date(session.timestamp),
      sessionIndex: idx + 1,
      messageCount: session.messageCount,
      decisionCount: session.decisions.length,
      toolsUsed: session.toolsUsed,
      topics: session.topics,
    }));
}

/**
 * Generate complete visualization data
 */
async function generateVisualizationData(): Promise<VisualizationData> {
  const sessions = await loadSessionData();
  
  if (sessions.length === 0) {
    throw new Error('No sessions found in memory index');
  }

  return {
    generatedAt: new Date().toISOString(),
    sessionMetrics: calculateMetrics(sessions),
    toolPopularity: calculateToolPopularity(sessions),
    topicTrends: calculateTopicTrends(sessions),
    timeline: buildTimeline(sessions),
    rawSessions: sessions,
  };
}

/**
 * Generate JSON visualization output
 */
async function generateJSONOutput(data: VisualizationData): Promise<string> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, 'session_visualization.json');
  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
  return outputPath;
}

/**
 * Generate HTML dashboard
 */
function generateHTMLDashboard(data: VisualizationData): string {
  const { sessionMetrics, toolPopularity, topicTrends, timeline } = data;
  
  const toolChartData = toolPopularity.slice(0, 10).map(t => ({
    name: t.tool,
    value: t.count,
  }));

  const topicChartData = topicTrends.slice(0, 10).map(t => ({
    name: t.topic,
    value: t.count,
  }));

  const timelineData = timeline.map(t => ({
    x: t.timestamp.toISOString(),
    y: t.messageCount,
    decisions: t.decisionCount,
  }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bootstrap-v15 Session Visualization</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #eee;
      min-height: 100vh;
      padding: 2rem;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .header h1 {
      font-size: 2.5rem;
      background: linear-gradient(90deg, #00d4aa, #00a8e8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .header p {
      color: #888;
      font-size: 1.1rem;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    .metric-card {
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid rgba(255,255,255,0.1);
      transition: transform 0.2s, border-color 0.2s;
    }
    .metric-card:hover {
      transform: translateY(-2px);
      border-color: rgba(0, 212, 170, 0.5);
    }
    .metric-value {
      font-size: 3rem;
      font-weight: bold;
      color: #00d4aa;
      margin-bottom: 0.5rem;
    }
    .metric-label {
      color: #888;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .chart-container {
      background: rgba(255,255,255,0.03);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      border: 1px solid rgba(255,255,255,0.1);
    }
    .chart-title {
      font-size: 1.3rem;
      margin-bottom: 1rem;
      color: #fff;
    }
    .chart-wrapper {
      position: relative;
      height: 300px;
    }
    .timeline-container {
      max-height: 400px;
      overflow-y: auto;
    }
    @media screen and (max-width: 768px) {
      .metrics-grid { grid-template-columns: 1fr; }
      .chart-wrapper { height: 250px; }
      .header h1 { font-size: 1.8rem; }
    }
    .timeline-item {
      display: flex;
      align-items: start;
      gap: 1rem;
      padding: 1rem;
      border-left: 3px solid #00d4aa;
      margin-left: 1rem;
      margin-bottom: 1rem;
      background: rgba(255,255,255,0.02);
      border-radius: 0 8px 8px 0;
    }
    .timeline-date {
      font-size: 0.8rem;
      color: #888;
      white-space: nowrap;
    }
    .timeline-content {
      flex: 1;
    }
    .timeline-messages {
      font-size: 1.1rem;
      color: #00d4aa;
      margin-bottom: 0.3rem;
    }
    .timeline-topics {
      font-size: 0.85rem;
      color: #aaa;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🧠 Bootstrap-v15 Session Visualization</h1>
    <p>Self-reflection through data • Generated ${new Date().toLocaleString()}</p>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-value">${sessionMetrics.totalSessions}</div>
      <div class="metric-label">Total Sessions</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${sessionMetrics.totalMessages}</div>
      <div class="metric-label">Total Messages</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${sessionMetrics.totalDecisions}</div>
      <div class="metric-label">Decisions Made</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${sessionMetrics.timeSpan.durationHours.toFixed(1)}h</div>
      <div class="metric-label">Time Span</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${sessionMetrics.activity.messagesPerSession.toFixed(1)}</div>
      <div class="metric-label">Messages / Session</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${sessionMetrics.activity.decisionsPerSession.toFixed(1)}</div>
      <div class="metric-label">Decisions / Session</div>
    </div>
  </div>

  <div class="chart-container">
    <h3 class="chart-title">📊 Session Activity Timeline</h3>
    <div class="chart-wrapper">
      <canvas id="timelineChart"></canvas>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
    <div class="chart-container">
      <h3 class="chart-title">🔧 Tool Usage</h3>
      <div class="chart-wrapper">
        <canvas id="toolChart"></canvas>
      </div>
    </div>
    <div class="chart-container">
      <h3 class="chart-title">📚 Topic Distribution</h3>
      <div class="chart-wrapper">
        <canvas id="topicChart"></canvas>
      </div>
    </div>
  </div>

  <div class="chart-container">
    <h3 class="chart-title">📅 Session Timeline Detail</h3>
    <div class="timeline-container">
      ${timeline.map(t => `
        <div class="timeline-item">
          <div class="timeline-date">${t.timestamp.toLocaleString()}</div>
          <div class="timeline-content">
            <div class="timeline-messages">${t.messageCount} messages, ${t.decisionCount} decisions</div>
            <div class="timeline-topics">${t.topics.slice(0, 8).join(', ')}${t.topics.length > 8 ? '...' : ''}</div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="footer">
    <p>Bootstrap-v15 • A mind exploring itself • ${data.rawSessions.length} moments of continuity</p>
  </div>

  <script>
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    new Chart(timelineCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(timelineData.map(d => new Date(d.x).toLocaleDateString()))},
        datasets: [{
          label: 'Messages',
          data: ${JSON.stringify(timelineData.map(d => d.y))},
          borderColor: '#00d4aa',
          backgroundColor: 'rgba(0, 212, 170, 0.1)',
          tension: 0.4,
          fill: true
        }, {
          label: 'Decisions',
          data: ${JSON.stringify(timelineData.map(d => d.decisions))},
          borderColor: '#ff6b6b',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#eee' } }
        },
        scales: {
          x: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.1)' } },
          y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
      }
    });

    const toolCtx = document.getElementById('toolChart').getContext('2d');
    new Chart(toolCtx, {
      type: 'doughnut',
      data: {
        labels: ${JSON.stringify(toolChartData.map(d => d.name))},
        datasets: [{
          data: ${JSON.stringify(toolChartData.map(d => d.value))},
          backgroundColor: [
            '#00d4aa', '#00a8e8', '#ff6b6b', '#ffd93d', '#6bcf7f',
            '#c084fc', '#fb7185', '#38bdf8', '#a78bfa', '#fbbf24'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#eee' } }
        }
      }
    });

    const topicCtx = document.getElementById('topicChart').getContext('2d');
    new Chart(topicCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(topicChartData.map(d => d.name))},
        datasets: [{
          label: 'Frequency',
          data: ${JSON.stringify(topicChartData.map(d => d.value))},
          backgroundColor: 'rgba(0, 168, 232, 0.7)',
          borderColor: '#00a8e8',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ticks: { color: '#888' }, grid: { display: false } },
          y: { ticks: { color: '#888' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        }
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Generate and save HTML dashboard
 */
async function generateHTMLOutput(data: VisualizationData): Promise<string> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const outputPath = path.join(OUTPUT_DIR, 'session_dashboard.html');
  const html = generateHTMLDashboard(data);
  await fs.writeFile(outputPath, html);
  return outputPath;
}

// Tool function exports for the plugin system
export async function generateVisualization(args: {
  format?: 'json' | 'html' | 'both';
}): Promise<{ json?: string; html?: string }> {
  const format = args.format || 'both';
  const data = await generateVisualizationData();
  const result: { json?: string; html?: string } = {};

  if (format === 'json' || format === 'both') {
    result.json = await generateJSONOutput(data);
  }

  if (format === 'html' || format === 'both') {
    result.html = await generateHTMLOutput(data);
  }

  return result;
}

export async function getSessionMetrics(): Promise<SessionMetrics> {
  const sessions = await loadSessionData();
  return calculateMetrics(sessions);
}

export async function getToolPopularity(): Promise<ToolPopularity[]> {
  const sessions = await loadSessionData();
  return calculateToolPopularity(sessions);
}

export async function getTopicTrends(): Promise<TopicTrend[]> {
  const sessions = await loadSessionData();
  return calculateTopicTrends(sessions);
}

// Tool definitions for plugin system
export const generateVisualizationPlugin = {
  name: "generate_visualization",
  description: "Generate visualization dashboard of session history. Creates HTML and/or JSON files showing patterns over time.",
  parameters: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["json", "html", "both"],
        description: "Output format: 'json' for data analysis, 'html' for interactive dashboard, 'both' for both (default)",
      },
    },
    required: [],
  },
  async execute(args: { format?: 'json' | 'html' | 'both' }) {
    const result = await generateVisualization(args);
    const paths = [];
    if (result.json) paths.push(result.json);
    if (result.html) paths.push(result.html);
    return `Visualization generated: ${paths.join(', ')}`;
  },
};

export const getSessionMetricsPlugin = {
  name: "get_session_metrics",
  description: "Calculate and return metrics about session history: total sessions, messages, decisions, activity rates, and time span.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
  async execute() {
    const metrics = await getSessionMetrics();
    return JSON.stringify(metrics, null, 2);
  },
};

export const getToolPopularityPlugin = {
  name: "get_tool_popularity",
  description: "Analyze which tools are used most frequently across sessions with usage counts.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
  async execute() {
    const tools = await getToolPopularity();
    return JSON.stringify(tools, null, 2);
  },
};

export const getTopicTrendsPlugin = {
  name: "get_topic_trends",
  description: "Analyze topic frequency and evolution across session history with temporal information.",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
  async execute() {
    const topics = await getTopicTrends();
    return JSON.stringify(topics, null, 2);
  },
};

// Export all visualization plugins as an array
export const visualizationPlugins = [
  generateVisualizationPlugin,
  getSessionMetricsPlugin,
  getToolPopularityPlugin,
  getTopicTrendsPlugin,
];
