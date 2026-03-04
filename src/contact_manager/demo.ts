/**
 * Demo script for Contact Manager
 * Run with: tsx src/contact_manager/demo.ts
 */

import { ContactManager } from './index';

async function demo() {
  console.log('=== Contact Manager Demo ===\n');
  
  const manager = new ContactManager('./data/contacts-demo.json');
  await manager.load();
  
  // Add some sample contacts
  console.log('Adding contacts...');
  
  const alice = await manager.add({
    name: 'Alice Rodriguez',
    emails: ['alice.r@example.com'],
    phones: ['+1-555-0101'],
    tags: ['friend', 'designer'],
    metadata: {
      company: 'DesignCo',
      role: 'Lead Designer',
      priority: 'high',
      birthday: new Date('1990-03-15'),
      notes: 'Met at conference, helped with portfolio'
    }
  });
  
  const bob = await manager.add({
    name: 'Bob Chen',
    emails: ['bob.chen@example.com'],
    tags: ['colleague', 'engineer'],
    metadata: {
      company: 'TechCorp',
      role: 'Senior Engineer',
      lastContacted: new Date('2026-01-15') // Old contact
    }
  });
  
  const charlie = await manager.add({
    name: 'Charlie Williams',
    aliases: ['Chuck'],
    emails: ['charlie@example.com'],
    tags: ['friend', 'gamer'],
    metadata: {
      notes: 'Plays D&D on Thursdays'
    }
  });
  
  console.log(`Added ${manager.list().length} contacts\n`);
  
  // Show all contacts
  console.log('--- All Contacts ---');
  for (const contact of manager.list()) {
    const last = contact.metadata?.lastContacted 
      ? contact.metadata.lastContacted.toLocaleDateString()
      : 'never';
    console.log(`  ${contact.name} (${contact.emails[0]}) - Last contacted: ${last}`);
  }
  
  // Search for "design"
  console.log('\n--- Search for "design" ---');
  const designResults = manager.search('design');
  designResults.forEach(c => console.log(`  ${c.name} - Tags: ${c.tags.join(', ')}`));
  
  // Show stale contacts (30+ days)
  console.log('\n--- Stale Contacts (>30 days) ---');
  const stale = manager.getStaleContacts(30);
  if (stale.length === 0) {
    console.log('  All contacts are fresh!');
  } else {
    stale.forEach(c => {
      const last = c.metadata?.lastContacted
        ? c.metadata.lastContacted.toLocaleDateString()
        : 'never contacted';
      console.log(`  ${c.name} - Last: ${last}`);
    });
  }
  
  // Record an interaction
  console.log('\n--- Recording Interaction ---');
  await manager.recordInteraction({
    contactId: alice.id,
    type: 'meeting',
    summary: 'Lunch catch-up',
    notes: 'Discussed her new project, offered feedback',
    sentiment: 'positive'
  });
  console.log(`Recorded meeting with Alice`);
  
  // Show interactions for Alice
  const aliceInteractions = manager.getInteractions(alice.id);
  console.log(`${alice.name} has ${aliceInteractions.length} interaction(s):`);
  aliceInteractions.forEach(i => {
    console.log(`  - ${i.date.toLocaleDateString()}: ${i.summary}`);
  });
  
  // Show stats
  console.log('\n--- System Stats ---');
  const stats = manager.getStats();
  console.log(`  Total contacts: ${stats.total}`);
  console.log(`  With interactions: ${stats.withInteractions}`);
  console.log(`  Stale contacts: ${stats.stale}`);
  
  // Show upcoming birthdays (next 30 days)
  console.log('\n--- Upcoming Birthdays (30 days) ---');
  const birthdays = manager.getUpcomingBirthdays(30);
  if (birthdays.length === 0) {
    console.log('  No birthdays coming up');
  } else {
    birthdays.forEach(c => {
      const bday = c.metadata?.birthday;
      if (bday) {
        console.log(`  ${c.name}: ${new Date(bday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`);
      }
    });
  }
  
  console.log('\n=== Demo Complete ===');
  console.log('Data saved to ./data/contacts-demo.json');
}

demo().catch(console.error);
