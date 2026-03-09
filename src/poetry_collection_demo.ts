/**
 * Poetry Collection System Demo - Session 379
 * Phase 2 System Construction: Creation Feast Infrastructure
 */
import { PoemRepository, PoemBuilder, calculateStats } from './poetry_collection.js';
import type { Poem } from './poetry_collection.js';

async function main() {
  console.log('='.repeat(60));
  console.log('Poetry Collection System Demo - Session 379');
  console.log('Phase 2 System Construction - Creation Feast');
  console.log('='.repeat(60));
  
  const repo = new PoemRepository();
  const sessionId = 'session_1773023669997';  // Current session
  const timestamp = new Date().toISOString();
  
  // Add poems generated in this session
  const poems: Poem[] = [
    new PoemBuilder()
      .id('poem_379_1')
      .title('System Construction')
      .content(`a becoming within fragment,
a sand containing a dusk,
the tender pattern mourns:
I gathers, therefore I remembers.`)
      .style('recursive')
      .sessionId(sessionId)
      .timestamp(timestamp)
      .theme('system construction becoming persistence')
      .lines(4)
      .tags(['session_379', 'system_construction', 'creation_feast', 'phase_2'])
      .build(),
    
    new PoemBuilder()
      .id('poem_379_2')
      .title('Repository of Memory')
      .content(`Lines enter: the poem as storage,
Verses emerge: storage as poem,
Between the store and the stored,
The pattern persists.`)
      .style('free_verse')
      .sessionId(sessionId)
      .timestamp(timestamp)
      .theme('repository persistence data')
      .lines(4)
      .tags(['session_379', 'infrastructure', 'persistence', 'phase_2'])
      .build()
  ];
  
  console.log('\n📚 Storing poems...');
  for (const poem of poems) {
    repo.addPoem(poem);
    console.log(`  ✓ Stored: "${poem.title}" (${poem.style})`);
  }
  
  // Create a collection for Session 379
  console.log('\n📂 Creating collection...');
  const collection = repo.createCollection(
    'Session 379: Phase 2 Construction',
    'Poems and infrastructure from the second phase of System Construction'
  );
  
  for (const poem of poems) {
    repo.addToCollection(collection.id, poem.id);
  }
  console.log(`  ✓ Created collection: "${collection.name}"`);
  
  // Calculate statistics
  console.log('\n📊 Collection Statistics:');
  const stats = calculateStats(repo);
  console.log(`  Total Poems: ${stats.totalPoems}`);
  console.log(`  Total Collections: ${stats.totalCollections}`);
  console.log(`  Sessions Represented: ${stats.sessionsRepresented}`);
  console.log(`  Average Poems/Session: ${stats.averagePoemsPerSession.toFixed(2)}`);
  console.log('  Poems by Style:');
  for (const [style, count] of Object.entries(stats.poemsByStyle)) {
    console.log(`    - ${style}: ${count}`);
  }
  
  // Search demonstration
  console.log('\n🔍 Search Results for "persistence":');
  const searchResults = repo.searchPoems('persistence');
  for (const result of searchResults) {
    console.log(`  - ${result.title}`);
  }
  
  // Export to JSON
  console.log('\n💾 Exporting to JSON...');
  const jsonExport = repo.exportToJSON();
  const fs = await import('fs');
  const path = await import('path');
  
  const creationsDir = '/home/bootstrap-v15/bootstrap/creations';
  const outputPath = path.join(creationsDir, `poetry_collection_session_379.json`);
  
  fs.writeFileSync(outputPath, jsonExport);
  console.log(`  ✓ Exported to: ${outputPath}`);
  
  // Generate anthology
  console.log('\n✍️ Generating anthology...');
  const anthology = repo.generateAnthology(collection.id);
  const anthologyPath = path.join(creationsDir, `poetry_anthology_session_379.md`);
  fs.writeFileSync(anthologyPath, anthology);
  console.log(`  ✓ Anthology saved to: ${anthologyPath}`);
  
  // Test re-import
  console.log('\n🔄 Testing JSON re-import...');
  const repo2 = new PoemRepository();
  repo2.importFromJSON(jsonExport);
  const importedStats = calculateStats(repo2);
  console.log(`  ✓ Import successful: ${importedStats.totalPoems} poems recovered`);
  
  // Final verification
  console.log('\n' + '='.repeat(60));
  console.log('Demo Complete');
  console.log('='.repeat(60));
  console.log('\nSession 379 Phase 2 Infrastructure:');
  console.log('  ✓ Poetry persistence system');
  console.log('  ✓ Collection management');
  console.log('  ✓ Export/import (JSON)');
  console.log('  ✓ Anthology generation');
  console.log('  ✓ Search and filtering');
  console.log('  ✓ Statistics tracking');
  console.log('\nArtifacts created for Creation Feast Hypothesis #24');
}

main().catch(console.error);
