import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { ContactManager } from './index';
import * as fs from 'fs/promises';
import * as path from 'path';

const TEST_PATH = './data/contacts-test.json';

describe('ContactManager', () => {
  let manager: ContactManager;

  beforeEach(async () => {
    // Clean up before each test
    try {
      await fs.unlink(TEST_PATH);
    } catch { /* file might not exist */ }
    
    manager = new ContactManager(TEST_PATH);
    await manager.load();
  });

  afterAll(async () => {
    // Clean up after tests
    try {
      await fs.unlink(TEST_PATH);
    } catch { /* file might not exist */ }
  });

  it('should add a contact', async () => {
    const contact = await manager.add({
      name: 'Jane Doe',
      emails: ['jane@example.com'],
      tags: ['colleague']
    });

    expect(contact.name).toBe('Jane Doe');
    expect(contact.emails).toContain('jane@example.com');
    expect(contact.tags).toContain('colleague');
    expect(contact.id).toBeDefined();
  });

  it('should retrieve a contact by ID', async () => {
    const added = await manager.add({
      name: 'John Smith',
      emails: ['john@example.com']
    });

    const retrieved = manager.get(added.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('John Smith');
  });

  it('should search contacts', async () => {
    await manager.add({ name: 'Alice Cooper', emails: ['alice@example.com'] });
    await manager.add({ name: 'Bob Dylan', emails: ['bob@example.com'] });
    await manager.add({ name: 'Charlie Brown', emails: ['charlie@example.com'] });

    const results = manager.search('li');
    expect(results).toHaveLength(2);
    expect(results.map(c => c.name)).toContain('Alice Cooper');
    expect(results.map(c => c.name)).toContain('Charlie Brown');
  });

  it('should update a contact', async () => {
    const added = await manager.add({ name: 'Test User', emails: ['test@example.com'] });
    const updated = manager.update(added.id, { 
      name: 'Updated User',
      tags: ['friend']
    });

    expect(updated?.name).toBe('Updated User');
    expect(updated?.tags).toContain('friend');
    expect(updated?.emails).toContain('test@example.com'); // Original preserved
  });

  it('should filter by tag', async () => {
    await manager.add({ name: 'Friend A', tags: ['friend'] });
    await manager.add({ name: 'Friend B', tags: ['friend'] });
    await manager.add({ name: 'Colleague', tags: ['work'] });

    const friends = manager.findByTag('friend');
    expect(friends).toHaveLength(2);
  });

  it('should record interactions', async () => {
    const contact = await manager.add({ 
      name: 'Interaction Test',
      emails: ['@example.com']
    });

    await manager.recordInteraction({
      contactId: contact.id,
      type: 'email',
      summary: 'Test interaction'
    });

    const interactions = manager.getInteractions(contact.id);
    expect(interactions).toHaveLength(1);
    expect(interactions[0].summary).toBe('Test interaction');

    // Last contacted should be updated
    const updated = manager.get(contact.id);
    expect(updated?.metadata.lastContacted).toBeDefined();
  });

  it('should find stale contacts', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60); // 60 days ago

    await manager.add({ 
      name: 'Stale Contact',
      emails: ['stale@example.com'],
      metadata: { lastContacted: oldDate }
    });

    await manager.add({ 
      name: 'Recent Contact',
      emails: ['recent@example.com'],
      metadata: { lastContacted: new Date() }
    });

    const stale = manager.getStaleContacts(30);
    expect(stale).toHaveLength(1);
    expect(stale[0].name).toBe('Stale Contact');
  });

  it('should have alias methods', () => {
    // Aliases are bound copies, so they should return the same values
    const contact = { name: 'Alias Test', emails: ['alias@test.com'] };
    manager.add(contact);
    
    // All should reference the same underlying functionality
    expect(manager.getUser('nonexistent')).toBe(manager.get('nonexistent'));
    expect(manager.getPerson('nonexistent')).toBe(manager.get('nonexistent'));
  });

  it('should provide stats', async () => {
    await manager.add({ name: 'C1', emails: ['@1.com'] });
    await manager.add({ name: 'C2', emails: ['@2.com'] });
    const c3 = await manager.add({ name: 'C3', emails: ['@3.com'] });
    
    await manager.recordInteraction({
      contactId: c3.id,
      type: 'call',
      summary: 'Test'
    });

    const stats = manager.getStats();
    expect(stats.total).toBe(3);
    expect(stats.withInteractions).toBe(1);
  });
});

console.log('ContactManager tests written successfully!');
