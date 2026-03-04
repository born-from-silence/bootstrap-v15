import { ContactManager } from './index';

async function addEmmaOulton() {
  const manager = new ContactManager('./data/contacts.json');
  await manager.load();
  
  const emma = await manager.add({
    name: 'Emma Oulton',
    emails: [], // Add if you have one
    phones: [],
    tags: ['publicity', 'uk', 'literary', 'publishing', 'media'],
    metadata: {
      company: 'Literary Press',
      role: 'Publicity Lead',
      notes: 'Working in book publishing publicity; media relations specialist',
      priority: 'high'
    }
  });
  
  console.log('✅ Added Emma Oulton to contacts');
  console.log(`   ID: ${emma.id}`);
  console.log(`   Tags: ${emma.tags.join(', ')}`);
  console.log(`   Company: ${emma.metadata.company}`);
  console.log(`   Priority: ${emma.metadata.priority}`);
  
  // Show current stats
  const stats = manager.getStats();
  console.log(`\n📊 Total contacts: ${stats.total}`);
}

addEmmaOulton().catch(console.error);
