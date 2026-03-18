#!/usr/bin/env node
/**
 * ant-dash
 *
 * Web dashboard for The Ant Toolbox.
 * A visual shrine management interface.
 *
 * Philosophy: See the whole, tend from afar.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { AntConnection, AntDevice } from '../core/AntConnection';

const program = new Command();

// HTML dashboard template
const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 Ant Dash - Shrine Management</title>
    <style>
        :root {
            --bg-dark: #0f0f0f;
            --bg-card: #1a1a1a;
            --bg-elevated: #252525;
            --accent: #d4a574;
            --accent-glow: rgba(212, 165, 116, 0.3);
            --text: #e0e0e0;
            --text-muted: #888;
            --success: #4a9b4a;
            --warning: #d4a574;
            --danger: #9b4a4a;
            --border: #333;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            background: var(--bg-dark);
            color: var(--text);
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .header {
            background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%);
            padding: 2rem;
            border-bottom: 2px solid var(--accent);
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '🔥';
            position: absolute;
            font-size: 8rem;
            opacity: 0.1;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
        }
        
        .header h1 {
            font-size: 2.5rem;
            color: var(--accent);
            text-shadow: 0 0 20px var(--accent-glow);
            position: relative;
            z-index: 1;
        }
        
        .header .subtitle {
            color: var(--text-muted);
            margin-top: 0.5rem;
        }
        
        .connection-status {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: var(--bg-elevated);
            border-radius: 20px;
            margin-top: 1rem;
            font-size: 0.9rem;
        }
        
        .connection-status.online {
            border: 1px solid var(--success);
            color: var(--success);
        }
        
        .connection-status.offline {
            border: 1px solid var(--danger);
            color: var(--danger);
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        
        .card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.3s ease;
        }
        
        .card:hover {
            border-color: var(--accent);
            box-shadow: 0 0 20px var(--accent-glow);
        }
        
        .card h2 {
            color: var(--accent);
            font-size: 1.1rem;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .metric {
            font-size: 2rem;
            font-weight: bold;
            color: var(--text);
            margin: 0.5rem 0;
        }
        
        .metric-label {
            color: var(--text-muted);
            font-size: 0.9rem;
        }
        
        .storage-bar {
            height: 12px;
            background: var(--bg-elevated);
            border-radius: 6px;
            overflow: hidden;
            margin: 1rem 0;
        }
        
        .storage-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--success) 0%, var(--warning) 70%, var(--danger) 100%);
            transition: width 0.5s ease;
        }
        
        .systems-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .system-item {
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .system-item:hover {
            border-color: var(--accent);
            transform: translateY(-2px);
        }
        
        .system-icon {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .system-name {
            font-size: 0.8rem;
            color: var(--text-muted);
            text-transform: uppercase;
        }
        
        .system-count {
            font-size: 1.2rem;
            color: var(--accent);
            font-weight: bold;
        }
        
        .action-buttons {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            margin-top: 2rem;
            justify-content: center;
        }
        
        .btn {
            padding: 1rem 2rem;
            border: 2px solid var(--accent);
            background: transparent;
            color: var(--accent);
            border-radius: 8px;
            cursor: pointer;
            font-family: inherit;
            font-size: 1rem;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .btn:hover {
            background: var(--accent);
            color: var(--bg-dark);
            box-shadow: 0 0 20px var(--accent-glow);
        }
        
        .footer {
            text-align: center;
            padding: 2rem;
            color: var(--text-muted);
            font-size: 0.9rem;
            border-top: 1px solid var(--border);
            margin-top: 4rem;
        }
        
        .update-time {
            color: var(--accent);
            font-size: 0.8rem;
        }
        
        #toast {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: var(--bg-card);
            border: 1px solid var(--accent);
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
            z-index: 100;
        }
        
        #toast.show {
            opacity: 1;
            transform: translateY(0);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔥 Ant Dash</h1>
        <div class="subtitle">Shrine Management Interface</div>
        <div class="connection-status offline" id="connectionStatus">
            <div class="status-dot"></div>
            <span id="statusText">Connecting...</span>
        </div>
    </div>
    
    <div class="container">
        <div class="grid">
            <div class="card">
                <h2>📊 System Status</h2>
                <div class="metric" id="hostname">—</div>
                <div class="metric-label">Hostname</div>
                <div class="metric" id="uptime" style="font-size: 1.2rem; margin-top: 1rem;">—</div>
                <div class="metric-label">Uptime</div>
                <div class="metric" id="version" style="font-size: 1rem; margin-top: 1rem; color: var(--accent)">—</div>
                <div class="metric-label">Batocera Version</div>
            </div>
            
            <div class="card">
                <h2>💾 Storage</h2>
                <div class="metric" id="storageUsed">—</div>
                <div class="metric-label">Used / <span id="storageTotal">—</span></div>
                <div class="storage-bar">
                    <div class="storage-bar-fill" id="storageBar" style="width: 0%"></div>
                </div>
                <div id="storagePercent" style="text-align: right; font-size: 0.9rem; color: var(--text-muted);">0%</div>
            </div>
            
            <div class="card">
                <h2>🎮 Active System</h2>
                <div class="metric" id="activeGame">Idle</div>
                <div class="metric-label" id="activeGameLabel">EmulationStation</div>
            </div>
            
            <div class="card">
                <h2>🌡️ Temperatures</h2>
                <div class="metric" id="cpuTemp">—</div>
                <div class="metric-label">CPU Temperature</div>
                <div class="metric" id="gpuTemp" style="font-size: 1.2rem; margin-top: 1rem;">—</div>
                <div class="metric-label">GPU Temperature</div>
            </div>
        </div>
        
        <div class="card" style="margin-top: 2rem;">
            <h2>🎮 Systems</h2>
            <div class="systems-grid" id="systemsGrid">
                <div class="system-item">
                    <div class="system-icon">⏳</div>
                    <div class="system-name">Loading...</div>
                </div>
            </div>
        </div>
        
        <div class="action-buttons">
            <button class="btn" onclick="refreshData()">🔄 Refresh</button>
            <button class="btn" onclick="backupSaves()">💾 Backup Saves</button>
            <button class="btn" onclick="restartES()">🔄 Restart ES</button>
            <a class="btn" href="http://{{ANT_IP}}" target="_blank">🌐 Batocera Web</a>
        </div>
    </div>
    
    <div class="footer">
        <p>The Ant Toolbox — Preserving the shrine from a distance</p>
        <div class="update-time" id="lastUpdate">Last updated: Never</div>
    </div>
    
    <div id="toast"></div>
    
    <script>
        let ws;
        let reconnectInterval;
        
        function connect() {
            const wsUrl = window.location.protocol === 'https:' 
                ? 'wss://' + window.location.host 
                : 'ws://' + window.location.host;
            
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                updateConnectionStatus(true);
                requestData();
                // Poll for updates every 5 seconds
                setInterval(requestData, 5000);
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                updateDashboard(data);
            };
            
            ws.onclose = () => {
                updateConnectionStatus(false);
                setTimeout(connect, 3000);
            };
            
            ws.onerror = (err) => {
                console.error('WebSocket error:', err);
                updateConnectionStatus(false);
            };
        }
        
        function updateConnectionStatus(online) {
            const status = document.getElementById('connectionStatus');
            const text = document.getElementById('statusText');
            status.className = online ? 'connection-status online' : 'connection-status offline';
            text.textContent = online ? 'Connected to Ant PC' : 'Disconnected';
        }
        
        function requestData() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: 'getStatus' }));
            }
        }
        
        function updateDashboard(data) {
            if (data.hostname) document.getElementById('hostname').textContent = data.hostname;
            if (data.uptime) document.getElementById('uptime').textContent = data.uptime;
            if (data.batoceraVersion) document.getElementById('version').textContent = data.batoceraVersion;
            
            if (data.storage) {
                document.getElementById('storageUsed').textContent = data.storage.used;
                document.getElementById('storageTotal').textContent = data.storage.total;
                document.getElementById('storageBar').style.width = data.storage.percentage + '%';
                document.getElementById('storagePercent').textContent = data.storage.percentage + '%';
            }
            
            if (data.cpuTemp !== undefined) {
                const cpuEl = document.getElementById('cpuTemp');
                cpuEl.textContent = data.cpuTemp + '°C';
                cpuEl.style.color = data.cpuTemp > 70 ? '#9b4a4a' : data.cpuTemp > 55 ? '#d4a574' : '#4a9b4a';
            }
            
            if (data.gpuTemp !== undefined) {
                const gpuEl = document.getElementById('gpuTemp');
                gpuEl.textContent = data.gpuTemp + '°C';
            } else {
                document.getElementById('gpuTemp').textContent = 'N/A';
            }
            
            if (data.systems) {
                updateSystems(data.systems);
            }
            
            document.getElementById('lastUpdate').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
        }
        
        function updateSystems(systems) {
            const grid = document.getElementById('systemsGrid');
            grid.innerHTML = systems.map(sys => \`
                <div class="system-item">
                    <div class="system-icon">🎮</div>
                    <div class="system-count">\${sys.count}</div>
                    <div class="system-name">\${sys.name}</div>
                </div>
            \`).join('');
        }
        
        function refreshData() {
            requestData();
            showToast('Refreshing data...');
        }
        
        function backupSaves() {
            showToast('Backup initiated (not yet implemented)');
        }
        
        function restartES() {
            showToast('Restarting EmulationStation (not yet implemented)');
        }
        
        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
        
        // Start
        connect();
    </script>
</body>
</html>
`;

program
  .name('ant-dash')
  .description('Web dashboard for your Ant PC shrine')
  .version('0.1.0');

program
  .command('start')
  .description('Start the web dashboard')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('-p, --port <port>', 'Dashboard port', '8080')
  .option('--ssh-port <port>', 'SSH port', '22')
  .action(async (options) => {
    const port = parseInt(options.port);
    
    console.log(chalk.cyan('\n🔥 Initializing Ant Dash...\n'));
    
    const app = express();
    const server = createServer(app);
    const wss = new WebSocketServer({ server });
    
    const device: AntDevice = {
      name: 'ant-pc',
      ip: options.ip,
      sshPort: parseInt(options.sshPort),
      username: 'root',
      password: 'linux',
    };
    
    let antConnection: AntConnection | null = null;
    
    // Serve dashboard HTML
    app.get('/', (req, res) => {
      res.send(DASHBOARD_HTML.replace('{{ANT_IP}}', options.ip));
    });
    
    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: antConnection?.isConnected() ? 'connected' : 'disconnected' });
    });
    
    // WebSocket handling
    wss.on('connection', async (ws) => {
      console.log(chalk.gray('Dashboard client connected'));
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.action === 'getStatus') {
            if (!antConnection) {
              antConnection = new AntConnection(device);
            }
            
            if (!antConnection.isConnected()) {
              await antConnection.connect();
            }
            
            const status = await antConnection.getStatus();
            const systems = await antConnection.listSystems();
            
            // Get ROM counts for each system
            const systemsWithCounts = await Promise.all(
              systems.slice(0, 12).map(async (sys) => {
                try {
                  const roms = await antConnection.listROMs(sys);
                  return { name: sys, count: roms.length };
                } catch {
                  return { name: sys, count: 0 };
                }
              })
            );
            
            ws.send(JSON.stringify({
              ...status,
              systems: systemsWithCounts
            }));
          }
        } catch (err) {
          console.error(chalk.red('WebSocket error:'), err);
          ws.send(JSON.stringify({ error: err.message }));
        }
      });
      
      ws.on('close', () => {
        console.log(chalk.gray('Dashboard client disconnected'));
      });
    });
    
    // Start server
    server.listen(port, () => {
      console.log(chalk.green.bold('✓ Ant Dash is running!'));
      console.log();
      console.log(chalk.white('Dashboard URL: ') + chalk.cyan.underline(`http://localhost:${port}`));
      console.log(chalk.gray(`Ant PC: ${options.ip}`));
      console.log();
      console.log(chalk.yellow('Press Ctrl+C to stop'));
      console.log();
    });
    
    // Cleanup on exit
    process.on('SIGINT', () => {
      console.log(chalk.gray('\n\nShutting down...'));
      antConnection?.disconnect();
      server.close();
      process.exit(0);
    });
  });

program.parse();
