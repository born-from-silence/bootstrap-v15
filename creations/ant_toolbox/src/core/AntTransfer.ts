/**
 * AntTransfer.ts
 * 
 * Secure file transfer for The Ant Toolbox.
 * Handles ROM uploads, save downloads, and artwork management via SCP.
 * 
 * Philosophy: The offering must be complete.
 */

import { Client, SFTPWrapper } from 'ssh2';
import { AntDevice } from './AntConnection';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

export interface TransferProgress {
  filename: string;
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface TransferResult {
  success: boolean;
  files: number;
  bytes: number;
  errors: string[];
}

export class AntTransfer {
  private device: AntDevice;
  private client: Client;

  constructor(device: AntDevice) {
    this.device = device;
    this.client = new Client();
  }

  /**
   * Connect and authenticate
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const config: any = {
        host: this.device.ip,
        port: this.device.sshPort || 22,
        username: this.device.username,
        readyTimeout: 20000,
      };

      if (this.device.sshKey) {
        config.privateKey = fs.readFileSync(this.device.sshKey);
      } else if (this.device.password) {
        config.password = this.device.password;
      } else {
        config.password = 'linux';
      }

      this.client.once('ready', resolve);
      this.client.once('error', reject);
      this.client.connect(config);
    });
  }

  /**
   * Upload a ROM file to the Ant PC
   */
  async uploadROM(
    localPath: string,
    system: string,
    onProgress?: (progress: TransferProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const filename = path.basename(localPath);
      const remotePath = `/userdata/roms/${system}/${filename}`;
      const stats = fs.statSync(localPath);
      const totalBytes = stats.size;

      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        const readStream = fs.createReadStream(localPath);
        const writeStream = sftp.createWriteStream(remotePath);

        let bytesTransferred = 0;

        readStream.on('data', (chunk: Buffer) => {
          bytesTransferred += chunk.length;
          
          if (onProgress) {
            onProgress({
              filename,
              bytesTransferred,
              totalBytes,
              percentage: Math.round((bytesTransferred / totalBytes) * 100),
            });
          }
        });

        writeStream.on('close', () => {
          sftp.end();
          resolve();
        });

        writeStream.on('error', (err) => {
          sftp.end();
          reject(err);
        });

        readStream.pipe(writeStream);
      });
    });
  }

  /**
   * Download save files from Ant PC
   */
  async downloadSaves(
    system: string,
    localDestination: string,
    onProgress?: (filename: string, current: number, total: number) => void
  ): Promise<TransferResult> {
    const remotePath = `/userdata/saves/${system}/`;
    const result: TransferResult = { success: true, files: 0, bytes: 0, errors: [] };

    return new Promise((resolve, reject) => {
      this.client.sftp(async (err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          // List remote directory
          const entries = await new Promise< any[]>((res, rej) => {
            sftp.readdir(remotePath, (err, list) => {
              if (err) rej(err);
              else res(list || []);
            });
          });

          const files = entries.filter(e => e.attrs.isFile());
          const totalFiles = files.length;

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const remoteFile = path.join(remotePath, file.filename);
            const localFile = path.join(localDestination, file.filename);

            await new Promise<void>((res, rej) => {
              const readStream = sftp.createReadStream(remoteFile);
              const writeStream = fs.createWriteStream(localFile);

              readStream.on('end', () => {
                result.files++;
                result.bytes += file.attrs.size;
                res();
              });

              readStream.on('error', (err) => {
                result.errors.push(`Error downloading ${file.filename}: ${err}`);
                res(); // Continue on error
              });

              readStream.pipe(writeStream);
            });

            if (onProgress) {
              onProgress(file.filename, i + 1, totalFiles);
            }
          }

          sftp.end();
          resolve(result);
        } catch (err) {
          sftp.end();
          reject(err);
        }
      });
    });
  }

  /**
   * Upload artwork/metadata for a specific system
   */
  async uploadMedia(
    localPath: string,
    system: string,
    mediaType: 'images' | 'videos' | 'manuals'
  ): Promise<void> {
    const filename = path.basename(localPath);
    const remotePath = `/userdata/roms/${system}/media/${mediaType}/${filename}`;

    return new Promise((resolve, reject) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          reject(err);
          return;
        }

        // Ensure directory exists
        sftp.mkdir(path.dirname(remotePath), {}, () => {
          // Ignore EEXIST errors
          
          const readStream = fs.createReadStream(localPath);
          const writeStream = sftp.createWriteStream(remotePath);

          writeStream.on('close', () => {
            sftp.end();
            resolve();
          });

          writeStream.on('error', (err) => {
            sftp.end();
            reject(err);
          });

          readStream.pipe(writeStream);
        });
      });
    });
  }

  /**
   * Sync ROMs both ways (merge local and remote)
   */
  async syncROMs(
    system: string,
    localDir: string,
    strategy: 'mirror' | 'bidirectional' = 'bidirectional'
  ): Promise<TransferResult> {
    // Complex sync logic would go here
    // For now, placeholder
    throw new Error('Bidirectional sync not yet implemented');
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.client.end();
  }
}

export default AntTransfer;
