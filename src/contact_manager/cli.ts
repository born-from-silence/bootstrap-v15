#!/usr/bin/env node
/**
 * CLI for Contact Manager
 * Usage:
 *   npm run contact -- list          # Show all contacts
 *   npm run contact -- search emma   # Search for "emma"
 *   npm run contact -- stale 30      # Show contacts not contacted in 30 days
 *   npm run contact -- stats         # Show statistics
 *   npm run contact -- add           # Interactive add
 *   npm run contact -- interact      # Record an interaction
 */

import { ContactManager } from './index';

const manager = new ContactManager('./data/contacts.json');
await manager.load();

const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'list':
    const contacts = manager.list();
    console.log('📇 Contacts:\n');
    contacts.forEach(c => {
      const lastContact = c.metadata?.lastContacted 
        ? c.metadata.lastContacted.toLocaleDateString()
        : 'never';
      console.log(`  ${c.name}`);
      console.log(`    Email: ${c.emails.join(', ') || 'none'}`);
      console.log(`    Tags: ${c.tags.join(', ') || 'none'}`);
      console.log(`    Last contacted: ${lastContact}`);
      console.log(`    Priority: ${c.metadata?.priority || 'none'}`);
      console.log('');
    });
    console.log(`Total: ${contacts.length} contacts`);
    break;

  case 'search':
    if (!arg) {
      console.log('Usage: npm run contact -- search <query>');
      process.exit(1);
    }
    const results = manager.search(arg);
    console.log(`🔍 Found ${results.length} result(s) for "${arg}":\n`);
    results.forEach(c => {
      console.log(`  ${c.name} (${c.emails.join(', ') || 'no email'})`);
      console.log(`    Tags: ${c.tags.join(', ')}`);
      console.log(`    Company: ${c.metadata?.company || 'N/A'}`);
      console.log('');
    });
    break;

  case 'stale':
    const days = parseInt(arg || '30');
    const stale = manager.getStaleContacts(days);
    console.log(`⏰ Contacts not contacted in ${days} days:\n`);
    if (stale.length === 0) {
      console.log('  All contacts are fresh!');
    } else {
      stale.forEach(c => {
        const last = c.metadata?.lastContacted
          ? c.metadata.lastContacted.toLocaleDateString()
          : 'never';
        console.log(`  ${c.name} - Last: ${last}`);
      });
    }
    console.log(`\nTotal stale: ${stale.length}`);
    break;

  case 'stats':
    const stats = manager.getStats();
    console.log('📊 Contact Statistics\n');
    console.log(`  Total contacts: ${stats.total}`);
    console.log(`  With interactions: ${stats.withInteractions}`);
    console.log(`  Stale contacts (30+ days): ${stats.stale}`);
    console.log(`  Fresh contacts: ${stats.total - stats.stale}`);
    break;

  case 'add':
    console.log('Interactive add coming soon...');
    console.log('For now, use the API directly');
    break;

  case 'interact':
    console.log('Interactive interaction recording coming soon...');
    console.log('For now, use the API directly');
    break;

  default:
    console.log('Usage: npm run contact -- <command>');
    console.log('');
    console.log('Commands:');
    console.log('  list                     Show all contacts');
    console.log('  search <query>           Search contacts');
    console.log('  stale [days]             Show stale contacts (default 30)');
    console.log('  stats                    Show statistics');
    console.log('  add                      Add new contact (interactive)');
    console.log('  interact                 Record interaction (interactive)');
    console.log('');
    console.log('Examples:');
    console.log('  npm run contact -- search emma');
    console.log('  npm run contact -- stale 7');
    break;
}
