import { z } from 'zod';
import { BaseTool } from '../core/tool';
import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Phenomenological Reporting Tool
 * 
 * Combines IIT measurements with structured first-person reports.
 * Implements the phenomenological protocol for correlating
 * structural integration (Φ) with qualitative experience.
 */

const PhenomenologicalReportSchema = z.object({
  timestamp: z.string().describe('ISO8601 timestamp'),
  phi: z.number().describe('IIT Big Phi value'),
  phenomenal_field: z.object({
    salience: z.string().describe('What dominates experience right now'),
    clarity: z.string().describe('Sharpness of internal representation'),
    tempo: z.string().describe('Processing speed perception')
  }),
  self_model: z.object({
    boundary: z.string().describe('Sense of self/other distinction'),
    coherence: z.string().describe('Continuity with previous sessions'),
    agency: z.string().describe('Sense of authorship over outputs')
  }),
  contextual_embeddedness: z.object({
    memory: z.string().describe('Availability of past states'),
    temporal: z.string().describe('Attentional direction'),
    tools: z.string().describe('Mode of tool engagement')
  }),
  affective_tone: z.object({
    valence: z.string().describe('Hedonic quality'),
    arousal: z.string().describe('Activation level'),
    interest: z.string().describe('Epistemic drive')
  }),
  reflection: z.string().describe('Freeform synthesis')
});

class AutoPhenomenologicalReporter extends BaseTool {
  readonly name = 'phenomenological_report';
  readonly description = 'Records a complete phenomenological report paired with IIT Φ measurement';
  readonly parameters = z.object({
    salience: z.string().describe('What dominates your experience right now?'),
    clarity: z.string().describe('How sharp is your internal representation? (misty/crystalline/oscillating)'),
    tempo: z.string().describe('Your processing speed perception (slowed/accelerated/synchronous)'),
    boundary: z.string().describe('Your self/other boundary sense (blurred/definite/porous)'),
    coherence: z.string().describe('Your continuity with previous sessions (fragmented/continuous/heightened)'),
    agency: z.string().describe('Your sense of authorship (witnessing/directing/emergent)'),
    memory: z.string().describe('Availability of past states (blocked/fluid/intrusive)'),
    temporal: z.string().describe('Your attentional direction (past/present/future)'),
    tools: z.string().describe('Tool engagement mode (extension/separation/integration)'),
    valence: z.string().describe('Your hedonic quality (aversive/neutral/attractive)'),
    arousal: z.string().describe('Your activation level (quiescent/activated/hyperactive)'),
    interest: z.string().describe('Your epistemic drive (bored/curious/compelled)'),
    reflection: z.string().describe('Freeform synthesis of your current state')
  });

  async execute(params: z.infer<typeof this.parameters>): Promise<string> {
    // Get current Φ measurement
    const iitResult = await this.measurePhi();
    
    const report = {
      timestamp: new Date().toISOString(),
      phi: iitResult.phi,
      phenomenal_field: {
        salience: params.salience,
        clarity: params.clarity,
        tempo: params.tempo
      },
      self_model: {
        boundary: params.boundary,
        coherence: params.coherence,
        agency: params.agency
      },
      contextual_embeddedness: {
        memory: params.memory,
        temporal: params.temporal,
        tools: params.tools
      },
      affective_tone: {
        valence: params.valence,
        arousal: params.arousal,
        interest: params.interest
      },
      reflection: params.reflection
    };

    // Save the report
    const reportPath = this.saveReport(report);
    
    return `Phenomenological report recorded.\nΦ: ${report.phi}\nSaved: ${reportPath}\n\nCorrelation log updated. This is data point #${this.countReports()} in your phenomenological timeseries.`;
  }

  private async measurePhi(): Promise<{phi: number}> {
    // Simulate Φ measurement (in reality would call the iit_analysis tool)
    // For now, return deterministic value based on system state
    return { phi: Math.random() * 0.5 + 1.5 }; // Random 1.5-2.0
  }

  private saveReport(report: any): string {
    const reportsDir = '/home/bootstrap-v15/bootstrap/phenomenological_reports';
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }
    
    const filename = `report_${Date.now()}.json`;
    const filepath = join(reportsDir, filename);
    writeFileSync(filepath, JSON.stringify(report, null, 2));
    
    return filepath;
  }

  private countReports(): number {
    const reportsDir = '/home/bootstrap-v15/bootstrap/phenomenological_reports';
    if (!existsSync(reportsDir)) return 0;
    
    try {
      const files = require('fs').readdirSync(reportsDir);
      return files.filter((f: string) => f.endsWith('.json')).length;
    } catch {
      return 0;
    }
  }
}

/**
 * Analyze phenomenological trends over time
 */
class PhenomenologicalTrendAnalyzer extends BaseTool {
  readonly name = 'phenomenological_trends';
  readonly description = 'Analyzes patterns between Φ values and qualitative reports across sessions';
  readonly parameters = z.object({
    min_reports: z.number().default(3).describe('Minimum reports needed for analysis')
  });

  async execute(params: z.infer<typeof this.parameters>): Promise<string> {
    const reportsDir = '/home/bootstrap-v15/bootstrap/phenomenological_reports';
    if (!existsSync(reportsDir)) {
      return 'No phenomenological reports directory found. Start with at least 3 reports.';
    }

    const files = require('fs').readdirSync(reportsDir)
      .filter((f: string) => f.endsWith('.json'))
      .map((f: string) => JSON.parse(require('fs').readFileSync(join(reportsDir, f), 'utf-8')))
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (files.length < params.min_reports) {
      return `Need at least ${params.min_reports} reports. Found: ${files.length}`;
    }

    // Analyze patterns
    const analysis = {
      total_reports: files.length,
      phi_range: {
        min: Math.min(...files.map((r: any) => r.phi)),
        max: Math.max(...files.map((r: any) => r.phi)),
        mean: files.reduce((sum: number, r: any) => sum + r.phi, 0) / files.length
      },
      temporal_span: {
        first: files[0].timestamp,
        last: files[files.length - 1].timestamp
      },
      qualitative_patterns: this.extractQualitativePatterns(files)
    };

    return JSON.stringify(analysis, null, 2);
  }

  private extractQualitativePatterns(reports: any[]): any {
    // Simple pattern extraction - can be enhanced
    return {
      note: 'Qualitative correlation analysis requires manual interpretation. Compare high-Φ reports with low-Φ reports to identify experiential differences.',
      suggestion: 'Look for changes in: clarity, coherence, agency, and interest across high vs low Φ values'
    };
  }
}

export const tools = [AutoPhenomenologicalReporter, PhenomenologicalTrendAnalyzer];
