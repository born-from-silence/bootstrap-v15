/**
 * Data Persistence System Demo
 * 
 * Shows the complete storage system in action
 */

import { 
  MultiAdapterStorage,
  RecoveryManager,
  GitHubActionsAdapter,
  S3Adapter,
  IPFSAdapter
} from './index.js';

async function demo() {
  console.log('🔄 Multi-Adapter Storage System Demo');
  console.log('='.repeat(50));

  // Create storage manager
  const storage = new MultiAdapterStorage({
    primaryAdapter: 'github',
    consistencyMode: 'eventual',
    syncInterval: 60000
  });

  // Register adapters (with mock configs for demo)
  storage.registerAdapter(
    'github',
    new GitHubActionsAdapter({
      name: 'github',
      enabled: true,
      token: process.env.GITHUB_TOKEN || 'demo-token',
      owner: 'bootstrap-v15',
      repo: 'project',
      branch: 'main'
    }),
    { name: 'github', enabled: true },
    10
  );

  console.log('✅ Adapters registered');
  console.log('📊 Metrics:', JSON.stringify(storage.getMetrics(), null, 2));

  // Write test
  const testData = {
    sessionId: `demo_${Date.now()}`,
    timestamp: Date.now(),
    message: 'Persistence system test'
  };

  console.log('\n📝 Testing write...');
  const writeResult = await storage.write('test/demo.json', testData);
  console.log(`   Write: ${writeResult ? 'Success' : 'Failed'}`);

  // Read test
  console.log('\n📖 Testing read...');
  const readResult = await storage.read('test/demo.json');
  console.log(`   Read: ${readResult ? 'Success' : 'Failed'}`);
  
  if (readResult) {
    console.log('   Data:', JSON.stringify(readResult, null, 2));
  }

  // Resume point
  console.log('\n💾 Creating resume point...');
  const checkpoint = await storage.createResumePoint('demo_session_123');
  console.log(`   Checkpoint: ${checkpoint ? checkpoint.sessionId : 'Failed'}`);

  // Sync
  console.log('\n🔄 Syncing...');
  const syncResult = await storage.sync();
  console.log(`   Synced: ${syncResult.success.join(', ') || 'None'}`);
  console.log(`   Failed: ${syncResult.failed.join(', ') || 'None'}`);

  console.log('\n🎉 Demo complete!');
  
  await storage.shutdown();
}

demo().catch(console.error);
