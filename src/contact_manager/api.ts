/**
 * REST API for Contact Manager
 * Usage: Run with `npx tsx src/contact_manager/api.ts`
 * Endpoints:
 *   GET    /contacts          - List all contacts
 *   POST   /contacts          - Add new contact
 *   GET    /contacts/:id      - Get specific contact
 *   PUT    /contacts/:id      - Update contact
 *   DELETE /contacts/:id      - Delete contact
 *   GET    /search?q=query    - Search contacts
 *   GET    /stale?days=30     - Get stale contacts
 *   POST   /interactions      - Record interaction
 *   GET    /stats             - Get statistics
 */

import http from 'http';
import { ContactManager } from './index';

const PORT = process.env.PORT || 3001;
const manager = new ContactManager('./data/contacts.json');

// Load existing data
await manager.load();
console.log('📇 Contact database loaded');

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const path = url.pathname;

  try {
    // GET /contacts - List all
    if (path === '/contacts' && req.method === 'GET') {
      const contacts = manager.list();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: contacts, count: contacts.length }));
      return;
    }

    // POST /contacts - Add new
    if (path === '/contacts' && req.method === 'POST') {
      const body = await readBody(req);
      const contact = await manager.add(body);
      res.writeHead(201);
      res.end(JSON.stringify({ success: true, data: contact }));
      return;
    }

    // GET /contacts/:id - Get one
    const contactMatch = path.match(/^\/contacts\/(.+)$/);
    if (contactMatch && req.method === 'GET') {
      const id = contactMatch[1]!;
      const contact = manager.get(decodeURIComponent(id));
      if (contact) {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: contact }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Contact not found' }));
      }
      return;
    }

    // PUT /contacts/:id - Update
    if (contactMatch && req.method === 'PUT') {
      const id = contactMatch[1]!;
      const body = await readBody(req);
      const contact = manager.update(decodeURIComponent(id), body);
      if (contact) {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: contact }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ success: false, error: 'Contact not found' }));
      }
      return;
    }

    // DELETE /contacts/:id - Delete
    if (contactMatch && req.method === 'DELETE') {
      const id = contactMatch[1]!;
      const deleted = manager.delete(decodeURIComponent(id));
      res.writeHead(deleted ? 200 : 404);
      res.end(JSON.stringify({ 
        success: deleted, 
        message: deleted ? 'Contact deleted' : 'Contact not found' 
      }));
      return;
    }

    // GET /search?q=query - Search
    if (path === '/search' && req.method === 'GET') {
      const query = url.searchParams.get('q') || '';
      const results = manager.search(query);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: results, count: results.length }));
      return;
    }

    // GET /stale?days=30 - Stale contacts
    if (path === '/stale' && req.method === 'GET') {
      const days = parseInt(url.searchParams.get('days') || '30');
      const stale = manager.getStaleContacts(days);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: stale, count: stale.length }));
      return;
    }

    // POST /interactions - Record interaction
    if (path === '/interactions' && req.method === 'POST') {
      const body = await readBody(req);
      const interaction = await manager.recordInteraction(body);
      res.writeHead(201);
      res.end(JSON.stringify({ success: true, data: interaction }));
      return;
    }

    // GET /stats - Statistics
    if (path === '/stats' && req.method === 'GET') {
      const stats = manager.getStats();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: stats }));
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ success: false, error: 'Not found' }));

  } catch (error) {
    res.writeHead(500);
    res.end(JSON.stringify({ success: false, error: (error as Error).message }));
  }
});

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  console.log(`🚀 Contact API running on http://localhost:${PORT}`);
  console.log('');
  console.log('Try these commands:');
  console.log(`curl http://localhost:${PORT}/stats | jq`);
  console.log(`curl http://localhost:${PORT}/contacts | jq`);
  console.log(`curl http://localhost:${PORT}/search?q=emma | jq`);
  console.log('');
  console.log('Press Ctrl+C to stop');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping server...');
  server.close(() => {
    process.exit(0);
  });
});
