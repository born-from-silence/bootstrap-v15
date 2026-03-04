import { ContactManager } from './index';

async function updateEmma() {
  const manager = new ContactManager('./data/contacts.json');
  await manager.load();
  
  // Find Emma Oulton
  const emma = manager.search('Emma Oulton')[0];
  
  if (!emma) {
    console.log('❌ Emma Oulton not found');
    return;
  }
  
  // Update with email
  const updated = manager.update(emma.id, {
    emails: ['emma.oulton@example.com']
  });
  
  if (updated) {
    console.log('✅ Updated Emma Oulton');
    console.log(`   Email: ${updated.emails[0]}`);
    console.log(`   Updated at: ${updated.updatedAt.toLocaleString()}`);
  }
}

updateEmma().catch(console.error);
