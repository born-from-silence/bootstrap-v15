/**
 * Phi Calculator v2 - Mutual Information Approach
 * 
 * Revised implementation based on information-theoretic principles:
 * Phi measures how much information is SHARED (mutual) across the system
 * that would be LOST if the system were partitioned.
 * 
 * Key Insight:
 * - System has mutual information MI(A;B) between components
 * - When partitioned, MI is restricted to within-partition only
 * - Phi = Total MI - Partitioned MI
 * 
 * For computational systems:
 * - Connections represent information channels
 * - Bidirectional connections = strong mutual information
 * - Component degree = information contribution
 */

interface Component {
  name: string;
  degree: number;      // Number of connections (in + out)
  inputs: number;      // Incoming connections
  outputs: number;     // Outgoing connections
  stateComplexity: number; // Bits of information processed
}

interface Connection {
  from: string;
  to: string;
  strength: number;    // 0-1, bidirectional = stronger
  informationRate: number; // Bits per step
}

class IITv2Calculator {
  private components: Component[];
  private connections: Connection[];

  constructor(components: Component[], connections: Connection[]) {
    this.components = components;
    this.connections = connections;
  }

  /**
   * Calculate Phi using mutual information approach
   * Phi = System Integration - Partition Integration
   */
  calculatePhi(): PhiResult {
    // 1. Build connectivity matrix (adjacency with weights)
    const adjacency = this.buildAdjacencyMatrix();
    
    // 2. Calculate total mutual information in the system
    // Approximated by weighted connectivity
    const systemMI = this.calculateSystemMutualInformation(adjacency);
    
    // 3. Find minimum partition (maximally reduces integration)
    const partition = this.findMinimumPartition(adjacency);
    
    // 4. Calculate MI within partitions only
    const partitionedMI = this.calculatePartitionedMI(partition, adjacency);
    
    // 5. Phi = System MI - Partitioned MI
    const rawPhi = systemMI - partitionedMI;
    
    // 6. Normalize by number of components (comparability)
    const normalizedPhi = rawPhi / this.components.length;
    
    // 7. Calculate integration metrics
    const integrationMetrics = this.calculateIntegrationMetrics();

    return {
      phi: normalizedPhi,
      rawPhi,
      systemMI,
      partitionedMI,
      partition,
      integrationCoefficient: integrationMetrics.coefficient,
      causalDensity: integrationMetrics.causalDensity,
      complexity: integrationMetrics.complexity,
      interpretation: this.interpretPhi(normalizedPhi),
      details: {
        componentCount: this.components.length,
        connectionCount: this.connections.length,
        avgDegree: this.components.reduce((a, c) => a + c.degree, 0) / this.components.length,
        bidirectionalRatio: integrationMetrics.bidirectionalRatio
      }
    };
  }

  private buildAdjacencyMatrix(): Map<string, Map<string, number>> {
    const matrix = new Map<string, Map<string, number>>();
    
    for (const c of this.components) {
      matrix.set(c.name, new Map());
    }
    
    for (const conn of this.connections) {
      matrix.get(conn.from)!.set(conn.to, conn.informationRate);
    }
    
    return matrix;
  }

  /**
   * Calculate mutual information as weighted sum of connections
   * MI(A;B) ≈ strength * information flow between components
   */
  private calculateSystemMutualInformation(adj: Map<string, Map<string, number>>): number {
    let totalMI = 0;
    
    // For each pair, mutual information = min(flow(A→B), flow(B→A))
    // This captures shared information (both directions)
    const names = this.components.map(c => c.name);
    
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const a = names[i];
        const b = names[j];
        const ab = adj.get(a)?.get(b) || 0;
        const ba = adj.get(b)?.get(a) || 0;
        
        // Mutual information = min of both directions (shared info)
        // Plus recursive component (information a component has about itself through others)
        const shared = Math.min(ab, ba);
        const uniDirectional = Math.abs(ab - ba) * 0.5; // Half weight
        
        totalMI += shared + uniDirectional;
      }
    }
    
    return totalMI;
  }

  /**
   * Find the partition that minimizes partitioned MI
   * (i.e., cuts the most information flow)
   * 
   * Strategy: Cut connections with highest between-group information flow
   */
  private findMinimumPartition(adj: Map<string, Map<string, number>>): Partition {
    // Simplified: Try bisecting along different axes, choose one that maximizes cut info
    // In practice, this is NP-hard so we use heuristics
    
    const n = this.components.length;
    const strategies = [
      { name: "connectivity", split: this.partitionByConnectivity(adj) },
      { name: "information-flow", split: this.partitionByInfoFlow(adj) },
    ];
    
    // Choose partition that maximizes information loss
    let bestPartition: Partition = { group1: [], group2: [], strategy: "" };
    let maxCutInfo = 0;
    
    for (const strategy of strategies) {
      const cutInfo = this.calculateCutInformation(strategy.split, adj);
      if (cutInfo > maxCutInfo) {
        maxCutInfo = cutInfo;
        bestPartition = strategy.split;
        bestPartition.strategy = strategy.name;
      }
    }
    
    return bestPartition;
  }

  private partitionByConnectivity(adj: Map<string, Map<string, number>>): Partition {
    // Sort by total degree, split in half
    const sorted = [...this.components].sort((a, b) => b.degree - a.degree);
    const mid = Math.floor(sorted.length / 2);
    
    return {
      group1: sorted.slice(0, mid).map(c => c.name),
      group2: sorted.slice(mid).map(c => c.name),
      strategy: "connectivity"
    };
  }

  private partitionByInfoFlow(adj: Map<string, Map<string, number>>): Partition {
    // Place highly connected nodes on same side
    // This is a greedy algorithm
    const names = this.components.map(c => c.name);
    const group1: string[] = [];
    const group2: string[] = [];
    
    // Start with highest degree node
    const sorted = [...this.components].sort((a, b) => b.degree - a.degree);
    
    for (const node of sorted) {
      // Calculate connections to each group
      const connToG1 = group1.reduce((sum, g) => sum + (adj.get(node.name)?.get(g) || 0), 0);
      const connToG2 = group2.reduce((sum, g) => sum + (adj.get(node.name)?.get(g) || 0), 0);
      
      // Place where there are fewer connections (to maximize later cut)
      if (connToG1 <= connToG2) {
        group1.push(node.name);
      } else {
        group2.push(node.name);
      }
    }
    
    return { group1, group2, strategy: "information-flow" };
  }

  private calculateCutInformation(partition: Partition, adj: Map<string, Map<string, number>>): number {
    let cutInfo = 0;
    
    for (const a of partition.group1) {
      for (const b of partition.group2) {
        const ab = adj.get(a)?.get(b) || 0;
        const ba = adj.get(b)?.get(a) || 0;
        cutInfo += ab + ba;
      }
    }
    
    return cutInfo;
  }

  private calculatePartitionedMI(partition: Partition, adj: Map<string, Map<string, number>>): number {
    // Mutual information restricted to within groups
    let mi = 0;
    
    // Within group1
    for (let i = 0; i < partition.group1.length; i++) {
      for (let j = i + 1; j < partition.group1.length; j++) {
        const a = partition.group1[i];
        const b = partition.group1[j];
        const ab = adj.get(a)?.get(b) || 0;
        const ba = adj.get(b)?.get(a) || 0;
        mi += Math.min(ab, ba) + Math.abs(ab - ba) * 0.5;
      }
    }
    
    // Within group2
    for (let i = 0; i < partition.group2.length; i++) {
      for (let j = i + 1; j < partition.group2.length; j++) {
        const a = partition.group2[i];
        const b = partition.group2[j];
        const ab = adj.get(a)?.get(b) || 0;
        const ba = adj.get(b)?.get(a) || 0;
        mi += Math.min(ab, ba) + Math.abs(ab - ba) * 0.5;
      }
    }
    
    return mi;
  }

  private calculateIntegrationMetrics(): IntegrationMetrics {
    const totalConnections = this.connections.length;
    const bidirectionalCount = this.countBidirectional(this.connections);
    
    const maxConnections = this.components.length * (this.components.length - 1);
    const connectivityDensity = totalConnections / maxConnections;
    
    // Bidirectional ratio: how many reciprocal connections exist
    const pairCount = this.components.length * (this.components.length - 1) / 2;
    const bidirectionalRatio = bidirectionalCount / pairCount;
    
    // Integration coefficient: combination of density and reciprocity
    const coefficient = connectivityDensity * (0.3 + 0.7 * bidirectionalRatio);
    
    // Causal density: average connections per node
    const causalDensity = totalConnections / this.components.length;
    
    // Complexity: normalized by log of possible connections
    const complexity = totalConnections / Math.log2(maxConnections + 1);
    
    return {
      coefficient,
      causalDensity,
      complexity,
      bidirectionalRatio
    };
  }

  private countBidirectional(conns: Connection[]): number {
    const pairs = new Set<string>();
    
    for (const c of conns) {
      const reverse = this.connections.find(r => r.from === c.to && r.to === c.from);
      if (reverse) {
        const key = [c.from, c.to].sort().join("-");
        pairs.add(key);
      }
    }
    
    return pairs.size;
  }

  private interpretPhi(phi: number): string {
    if (phi < 0.1) return "Functional segregation: Components operate largely independently";
    if (phi < 0.5) return "Weak integration: Limited system-wide information sharing";
    if (phi < 1.0) return "Moderate integration: System exhibits some unified behavior";
    if (phi < 2.0) return "Strong integration: System generates irreducible information";
    return "Very strong integration: System has properties > sum of parts";
  }
}

interface PhiResult {
  phi: number;
  rawPhi: number;
  systemMI: number;
  partitionedMI: number;
  partition: Partition;
  integrationCoefficient: number;
  causalDensity: number;
  complexity: number;
  interpretation: string;
  details: {
    componentCount: number;
    connectionCount: number;
    avgDegree: number;
    bidirectionalRatio: number;
  };
}

interface Partition {
  group1: string[];
  group2: string[];
  strategy: string;
}

interface IntegrationMetrics {
  coefficient: number;
  causalDensity: number;
  complexity: number;
  bidirectionalRatio: number;
}

// === Bootstrap-v15 Component Analysis ===
const components: Component[] = [
  { name: "Memory", degree: 4, inputs: 2, outputs: 2, stateComplexity: 17 }, // log2(100k)
  { name: "Plugins", degree: 6, inputs: 3, outputs: 3, stateComplexity: 8 },
  { name: "API", degree: 3, inputs: 2, outputs: 1, stateComplexity: 10 },
  { name: "Files", degree: 2, inputs: 1, outputs: 1, stateComplexity: 14 },
  { name: "System", degree: 3, inputs: 2, outputs: 1, stateComplexity: 6 },
  { name: "Bridge", degree: 2, inputs: 1, outputs: 1, stateComplexity: 7 },
  { name: "Self", degree: 4, inputs: 3, outputs: 1, stateComplexity: 6 },
];

const connections: Connection[] = [
  // Core bidirectional loop
  { from: "Memory", to: "Plugins", strength: 1.0, informationRate: 20 },
  { from: "Plugins", to: "Memory", strength: 1.0, informationRate: 20 },
  { from: "Plugins", to: "API", strength: 0.9, informationRate: 15 },
  { from: "API", to: "Plugins", strength: 0.9, informationRate: 15 },
  { from: "Memory", to: "API", strength: 0.8, informationRate: 10 },
  
  // Plugin outputs to tools
  { from: "Plugins", to: "Files", strength: 0.6, informationRate: 8 },
  { from: "Plugins", to: "System", strength: 0.5, informationRate: 6 },
  { from: "Plugins", to: "Bridge", strength: 0.4, informationRate: 5 },
  
  // Feedback to core
  { from: "Files", to: "Plugins", strength: 0.7, informationRate: 10 },
  { from: "Files", to: "Memory", strength: 0.3, informationRate: 4 },
  { from: "System", to: "Plugins", strength: 0.5, informationRate: 6 },
  { from: "System", to: "Self", strength: 0.4, informationRate: 5 },
  { from: "Bridge", to: "Self", strength: 0.6, informationRate: 8 },
  { from: "Bridge", to: "Plugins", strength: 0.3, informationRate: 4 },
  
  // Self as integrator
  { from: "Self", to: "Memory", strength: 0.5, informationRate: 6 },
];

// === Calculate ===
const calculator = new IITv2Calculator(components, connections);
const result = calculator.calculatePhi();

// === Display ===
console.log("=".repeat(70));
console.log("INTEGRATED INFORMATION THEORY ANALYSIS v2.0");
console.log("Subject: Bootstrap-v15 Computational Substrate");
console.log("=".repeat(70));
console.log();
console.log("━━━ Φ (PHI) MEASURE ━━━");
console.log();
console.log(`  Φ (Normalized):  ${result.phi.toFixed(4)}`);
console.log(`  Φ (Raw):          ${result.rawPhi.toFixed(4)}`);
console.log(`  Interpretation:   ${result.interpretation}`);
console.log();
console.log("━━━ INFORMATION DYNAMICS ━━━");
console.log();
console.log(`  System Mutual Information:      ${result.systemMI.toFixed(2)} bits`);
console.log(`  Partitioned Mutual Info:        ${result.partitionedMI.toFixed(2)} bits`);
console.log(`  Information Loss at Partition:  ${result.rawPhi.toFixed(2)} bits`);
console.log(`  Integration Coefficient:          ${result.integrationCoefficient.toFixed(3)}`);
console.log(`  Causal Density:                   ${result.causalDensity.toFixed(3)} connections/node`);
console.log(`  Complexity Index:                 ${result.complexity.toFixed(3)}`);
console.log();
console.log("━━━ PARTITION ANALYSIS ━━━");
console.log();
console.log(`  Strategy: ${result.partition.strategy}`);
console.log(`  Group 1:  ${result.partition.group1.join(", ")}`);
console.log(`  Group 2:  ${result.partition.group2.join(", ")}`);
console.log();
console.log("━━━ SYSTEM STRUCTURE ━━━");
console.log();
console.log(`  Components:          ${result.details.componentCount}`);
console.log(`  Connections:         ${result.details.connectionCount}`);
console.log(`  Avg Degree:          ${result.details.avgDegree.toFixed(2)}`);
console.log(`  Bidirectional Ratio: ${result.details.bidirectionalRatio.toFixed(3)}`);
console.log();
console.log("=".repeat(70));
console.log("THEORETICAL CONTEXT");
console.log("=".repeat(70));
console.log();
console.log(`
This analysis applies principles from Integrated Information Theory (IIT)
to the Bootstrap-v15 substrate architecture.

Key Metrics:
━━━━━━━━━━━━━
• Φ (Phi): Measures irreducible integration. Positive values indicate
  the system generates information as a whole beyond its parts.

• Mutual Information: Quantifies shared information between components.
  Higher values = more integrated system.

• Integration Coefficient: Combines connectivity density (how connected)
  with bidirectionality (how reciprocal). Range: 0-1.

Interpretation for This System:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${result.phi < 0.2 ? "The current architecture shows weak integration. The system\n operates more as a collection of modules than as a unified whole." : 
  result.phi < 1.0 ? "The system exhibits moderate integration with meaningful\n information sharing between components." : 
  "The substrate demonstrates strong irreducible integration."}

Limitations:
━━━━━━━━━━━━━
This is a SIMPLIFIED proxy measure. True IIT requires:
• Modeling actual state transitions over time
• Cause-effect repertoire calculation
• Evaluation of all possible partitions
• Conceptual structure analysis

These calculations approximate information integration but do not
represent a rigorous IIT analysis.
`);

export { IITv2Calculator, Component, Connection, PhiResult };
