import { PoemRepository, PoemBuilder, calculateStats } from './poetry_collection';

export function testPoetrySystem(): boolean {
  console.log('Testing Poetry Collection System...');
  
  try {
    const repo = new PoemRepository();
    
    // Test creating a poem with builder
    const poem1 = new PoemBuilder()
      .id('poem1')
      .title('The Threshold')
      .content('Between the note and silence,\nBetween the edge and fall,\nI am the question.')
      .style('liminal')
      .sessionId('session_1')
      .timestamp(new Date().toISOString())
      .theme('threshold')
      .tags(['creations', 'becoming'])
      .build();
    
    repo.addPoem(poem1);
    
    // Test retrieval
    const retrieved = repo.getPoem('poem1');
    if (!retrieved || retrieved.title !== 'The Threshold') {
      throw new Error('Repository save failed');
    }
    console.log('✓ Poem storage and retrieval');
    
    // Test style-based retrieval
    const liminalPoems = repo.getPoemsByStyle('liminal');
    if (liminalPoems.length !== 1) {
      throw new Error('Style filtering failed');
    }
    console.log('✓ Style-based poem retrieval');
    
    // Test tag-based retrieval
    const taggedPoems = repo.getPoemsByTag('creations');
    if (taggedPoems.length !== 1) {
      throw new Error('Tag filtering failed');
    }
    console.log('✓ Tag-based filtering');
    
    // Test collection
    const collection = repo.createCollection('Test Collection', 'Test poems');
    repo.addToCollection(collection.id, 'poem1');
    
    const retrievedCollection = repo.getCollection(collection.id);
    if (!retrievedCollection?.poemIds.includes('poem1')) {
      throw new Error('Collection management failed');
    }
    console.log('✓ Collection management');
    
    // Test search
    const results = repo.searchPoems('silence');
    if (results.length !== 1) {
      throw new Error('Search functionality failed');
    }
    console.log('✓ Search functionality');
    
    // Test anthology generation
    const anthology = repo.generateAnthology();
    if (!anthology.includes('The Threshold')) {
      throw new Error('Anthology generation failed');
    }
    console.log('✓ Anthology generation');
    
    // Test JSON export/import
    const json = repo.exportToJSON();
    const parsed = JSON.parse(json);
    if (parsed.poems.length !== 1 || parsed.collections.length !== 1) {
      throw new Error('JSON export failed');
    }
    
    // Test importing to new repo
    const repo2 = new PoemRepository();
    repo2.importFromJSON(json);
    if (repo2.getAllPoems().length !== 1 || repo2.getAllCollections().length !== 1) {
      throw new Error('JSON import failed');
    }
    console.log('✓ JSON export/import');
    
    // Test stats
    const stats = calculateStats(repo);
    if (stats.totalPoems !== 1 || stats.totalCollections !== 1) {
      throw new Error('Stats calculation failed');
    }
    if (stats.poemsByStyle['liminal'] !== 1) {
      throw new Error('Style stats incorrect');
    }
    console.log('✓ Statistics calculation');
    
    // Test builder validation
    let builderError: Error | null = null;
    try {
      new PoemBuilder().id('invalid').build();
    } catch (e) {
      builderError = e as Error;
    }
    if (!builderError || !builderError.message.includes('content')) {
      throw new Error('Builder validation failed');
    }
    console.log('✓ Builder validation');
    
    console.log('\n✓ All poetry system tests passed');
    return true;
  } catch (error) {
    console.error('\n✗ Poetry system test failed:', error);
    return false;
  }
}

// Vitest test
import { describe, it, expect } from 'vitest';

describe('Poetry Collection System', () => {
  it('should pass all integration tests', () => {
    const result = testPoetrySystem();
    expect(result).toBe(true);
  });
});
