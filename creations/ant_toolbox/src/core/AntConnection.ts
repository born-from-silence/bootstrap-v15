/**
 * AntConnection.ts
 * 
 * Core connectivity layer for The Ant Toolbox.
 * Establishes and manages SSH connections to Batocera systems.
 * 
 * Philosophy: The Ant Toolbox never runs on the Ant PC.
 * It serves from a distance, preserving the shrine's purity.
 */

import { Client } from 'ssh2';
import { EventEmitter } from 'events';

export interface AntDevice {
  name: string;
  ip: string;
  sshPort: number;
  sshKey?: string;
  username: string;
  password?: string;
}

export interface SystemStatus {
  hostname: string;
  uptime: string;
  storage: {
    total: string;
    used: string;
    available: string;
    percentage: number;
  };
  cpuTemp?: number;
  gpuTemp?: number;
  batoceraVersion: string;
}

export class AntConnection extends EventEmitter {
  private device: AntDevice;
  private client: Client;
  private connected: boolean = false;

  constructor(device: AntDevice) {
    super();
    this.device = device;
    this.client = new Client();
    
    this.client.on('ready', () => {
      this.connected = true;
      this.emit('ready');
    });

    this.client.on('error', (err) => {
      this.emit('error', err);
    });

    this.client.on('end', () => {
      this.connected = false;
      this.emit('disconnected');
    });
  }

  /**
   * Connect to the Ant PC via SSH
   * Batocera default credentials: root / linux
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const config: any = {
        host: this.device.ip,
        port: this.device.sshPort,
        username: this.device.username,
        readyTimeout: 20000,
      };

      if (this.device.sshKey) {
        config.privateKey = require('fs').readFileSync(this.device.sshKey);
      } else if (this.device.password) {
        config.password = this.device.password;
      } else {
        // Batocera default
        config.password = 'linux';
      }

      this.client.once('ready', resolve);
      this.client.once('error', reject);
      this.client.connect(config);
    });
  }

  /**
   * Execute a command on the Ant PC
   * Returns stdout as string
   */
  async exec(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected. Call connect() first.'));
        return;
      }

      this.client.exec(command, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }

        let data = '';
        let errorData = '';

        stream.on('data', (chunk: Buffer) => {
          data += chunk.toString();
        });

        stream.stderr.on('data', (chunk: Buffer) => {
          errorData += chunk.toString();
        });

        stream.on('close', (code: number) => {
          if (code !== 0 && errorData) {
            reject(new Error(`Command failed with code ${code}: ${errorData}`));
          } else {
            resolve(data.trim());
          }
        });
      });
    });
  }

  /**
   * Get current system status
   * Scrapes Batocera's diagnostic information
   */
  async getStatus(): Promise<SystemStatus> {
    try {
      // Get basic system info
      const hostname = await this.exec('hostname');
      const uptime = await this.exec('uptime -p');
      
      // Get storage info - Batocera mounts games on /media
      const dfOutput = await this.exec('df -h /media | tail -1');
      const dfParts = dfOutput.split(/\s+/);
      const total = dfParts[1];
      const used = dfParts[2];
      const available = dfParts[3];
      const percentage = parseInt(dfParts[4].replace('%', ''));

      // Get Batocera version
      const versionOutput = await this.exec('cat /usr/share/batocera/batocera.version');
      
      // Try to get temperatures (may not be available on all hardware)
      let cpuTemp: number | undefined;
      let gpuTemp: number | undefined;
      
      try {
        const tempOutput = await this.exec('cat /sys/class/thermal/thermal_zone0/temp');
        cpuTemp = parseInt(tempOutput) / 1000;
      } catch {
        // Temperature monitoring not available
      }

      return {
        hostname,
        uptime,
        storage: {
          total,
          used,
          available,
          percentage,
        },
        cpuTemp,
        gpuTemp,
        batoceraVersion: versionOutput,
      };
    } catch (error) {
      throw new Error(`Failed to get status: ${error}`);
    }
  }

  /**
   * List ROM directories by system
   * Batocera stores ROMs in /userdata/roms/{system}/
   */
  async listSystems(): Promise<string[]> {
    const output = await this.exec('ls -1 /userdata/roms/');
    return output.split('\n').filter(line => line.trim() !== '');
  }

  /**
   * List ROMs for a specific system
   */
  async listROMs(system: string): Promise<{ name: string; size: string }[]> {
    const command = `ls -lh /userdata/roms/${system}/ | awk 'NR>1 {print $9, $5}'`;
    const output = await this.exec(command);
    
    return output.split('\n')
      .filter(line => line.trim() !== '' && !line.includes('total'))
      .map(line => {
        const parts = line.trim().split(/\s+/);
        return {
          name: parts[0],
          size: parts[1] || 'unknown',
        };
      });
  }

  /**
   * Get save state directories
   */
  async getSavePath(system: string): Promise<string> {
    return `/userdata/saves/${system}/`;
  }

  /**
   * Backup saves to local machine via SFTP
   * This would require additional SFTP implementation
   */
  async backupSaves(
    system: string, 
    localDestination: string
  ): Promise<{ files: number; size: string }> {
    // Implementation would use SFTP to download files
    throw new Error('Backup via SFTP not yet implemented');
  }

  /**
   * Restart EmulationStation (soft restart)
   */
  async restartEmulationStation(): Promise<void> {
    await this.exec('/etc/init.d/S31emulationstation restart');
  }

  /**
   * Reboot the system
   */
  async reboot(): Promise<void> {
    await this.exec('reboot');
  }

  /**
   * Shut down the system
   */
  async shutdown(): Promise<void> {
    await this.exec('poweroff');
  }

  /**
   * Get current game being played
   * This checks if an emulator process is running
   */
  async getActiveGame(): Promise<string | null> {
    try {
      // Check for running emulator processes
      const psOutput = await this.exec('ps aux | grep -E "(retroarch|dolphin|pcsx2)" | grep -v grep');
      if (!psOutput) return null;
      
      // Parse to extract game name if possible
      // This is rough - depends on how emulator was launched
      return 'Active (parsing details not implemented)';
    } catch {
      return null;
    }
  }

  /**
   * Disconnect from the Ant PC
   */
  disconnect(): void {
    this.client.end();
  }

  /**
   * Check if still connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// Example usage:
// const ant = new AntConnection({
//   name: 'living-room',
//   ip: '192.168.1.50',
//   sshPort: 22,
//   username: 'root',
//   password: 'linux',
// });
// 
// await ant.connect();
// const status = await ant.getStatus();
// console.log(status);
// ant.disconnect();
