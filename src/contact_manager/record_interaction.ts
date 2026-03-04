import { ContactManager } from './index';

async function recordInteraction() {
  const manager = new ContactManager('./data/contacts.json');
  await manager.load();
  
  // Find Emma Oulton
  const emma = manager.search('Emma Oulton')[0];
  
  if (!emma) {
    console.log('❌ Emma Oulton not found');
    return;
  }
  
  // Record the interaction
  const interaction = await manager.recordInteraction({
    contactId: emma.id,
    type: 'email',
    summary: 'Initial outreach email sent',
    notes: 'First contact attempt. Waiting for response.',
    sentiment: 'neutral'
  });
  
  console.log('✅ Interaction recorded');
  console.log(`   Type: ${interaction.type}`);
  console.log(`   Date: ${interaction.date.toLocaleString()}`);
  console.log(`   Summary: ${interaction.summary}`);
  
  // Show updated contact info
  const updated = manager.get(emma.id);
  console.log(`\n📊 Contact updated:`);
  console.log(`   Last contacted: ${updated?.metadata.lastContacted?.toLocaleString()}`);
  console.log(`   Total interactions: ${updated?.interactions.length}`);
}

recordInteraction().catch(console.error);
