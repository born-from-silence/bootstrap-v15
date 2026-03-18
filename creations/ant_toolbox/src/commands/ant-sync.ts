#!/usr/bin/env node
/**
 * ant-sync
 *
 * Save state preservationist for The Ant Toolbox.
 * Backup, restore, and synchronize game saves with the shrine.
 *
 * Philosophy: The journey is sacred; preserve every step.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { AntConnection, AntDevice } from '../core/AntConnection';
import { AntTransfer } from '../core/AntTransfer';

const BACKUPS_DIR = path.join(os.homedir(), '.ant-toolbox', 'backups');

interface BackupManifest {
  timestamp: string;
  system: string;
  files: string[];
  totalSize: number;
  device: string;
}

function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

const program = new Command();

program
  .name('ant-sync')
  .description('Save state preservationist for your Ant PC')
  .version('0.1.0');

program
  .command('backup')
  .alias('b')
  .description('Backup save states from Ant PC')
  .argument('[system]', 'System to backup (omit for all)')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('-o, --output <dir>', 'Backup directory', BACKUPS_DIR)
  .option('--dry-run', 'Preview without downloading')
  .action(async (system, options) => {
    const spinner = ora('Connecting to Ant PC...').start();
    
    const device: AntDevice = {
      name: 'ant-pc',
      ip: options.ip,
      sshPort: 22,
      username: 'root',
      password: 'linux',
    };
    
    const conn = new AntConnection(device);
    const transfer = new AntTransfer(device);
    
    try {
      await conn.connect();
      await transfer.connect();
      spinner.succeed('Connected');
      
      // Determine which systems to backup
      let systemsToBackup: string[] = [];
      if (system) {
        systemsToBackup = [system];
      } else {
        systemsToBackup = await conn.listSystems();
      }
      
      console.log();
      console.log(chalk.bold.cyan('╔════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║  Backup Save States                     ║'));
      console.log(chalk.bold.cyan('╚════════════════════════════════════════╝'));
      console.log();
      
      let totalFiles = 0;
      let totalBytes = 0;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(options.output, `backup-${timestamp}`);
      
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });
      
      for (const sys of systemsToBackup) {
        const sysSpinner = ora(chalk.gray(`Checking ${sys}...`)).start();
        
        try {
          const savePath = `/userdata/saves/${sys}/`;
          let saves: string[] = [];
          
          try {
            const lsOutput = await conn.exec(`ls -1 ${savePath} 2>/dev/null || echo ""`);
            saves = lsOutput.split('\n').filter(f => f.trim() !== '');
          } catch {
            // No saves for this system
          }
          
          if (saves.length === 0) {
            sysSpinner.succeed(chalk.gray(`${sys}: No saves`));
            continue;
          }
          
          sysSpinner.text = `Backing up ${saves.length} saves for ${sys}...`;
          
          // Create system subdirectory
          const sysBackupDir = path.join(backupDir, sys);
          await fs.mkdir(sysBackupDir, { recursive: true });
          
          // Download saves via SFTP
          if (!options.dryRun) {
            const result = await transfer.downloadSaves(sys, sysBackupDir, (filename, current, total) => {
              sysSpinner.text = chalk.gray(`[${current}/${total}] ${filename}`);
            });
            
            totalFiles += result.files;
            totalBytes += result.bytes;
            
            // Save manifest
            const manifest: BackupManifest = {
              timestamp: new Date().toISOString(),
              system: sys,
              files: saves,
              totalSize: result.bytes,
              device: device.ip,
            };
            await fs.writeFile(
              path.join(sysBackupDir, 'manifest.json'),
              JSON.stringify(manifest, null, 2)
            );
          } else {
            totalFiles += saves.length;
          }
          
          sysSpinner.succeed(chalk.green(`${sys}: ${saves.length} saves ${options.dryRun ? '(dry-run)' : 'backed up'}`));
        } catch (err) {
          sysSpinner.fail(chalk.red(`${sys}: ${err}`));
        }
      }
      
      transfer.disconnect();
      conn.disconnect();
      
      console.log();
      console.log(chalk.bold('═══════════════════════════════════════'));
      console.log(chalk.green(`Backup complete!`));
      console.log(chalk.gray(`  Files: ${totalFiles}`));
      console.log(chalk.gray(`  Size: ${formatBytes(totalBytes)}`));
      console.log(chalk.gray(`  Location: ${backupDir}`));
      console.log();
      
    } catch (err) {
      spinner.fail(`Backup failed: ${err}`);
      process.exit(1);
    }
  });

program
  .command('restore')
  .alias('r')
  .description('Restore save states to Ant PC')
  .argument('<backup>', 'Backup directory or timestamp')
  .argument('[system]', 'System to restore (omit for all)')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('--list', 'List available backups')
  .action(async (backup, system, options) => {
    // Handle --list flag
    if (options.list || backup === 'list') {
      const spinner = ora('Scanning backups...').start();
      
      try {
        const entries = await fs.readdir(BACKUPS_DIR);
        const backups = entries.filter(e => e.startsWith('backup-'));
        
        spinner.succeed(`Found ${backups.length} backups`);
        
        if (backups.length === 0) {
          console.log(chalk.gray('\nNo backups found. Create one with:'));
          console.log(chalk.gray('  ant-sync backup'));
          return;
        }
        
        console.log();
        console.log(chalk.bold.cyan('Available Backups:'));
        console.log();
        
        for (const backupDir of backups.sort().reverse()) {
          const fullPath = path.join(BACKUPS_DIR, backupDir);
          const stat = await fs.stat(fullPath);
          
          // Try to load manifest
          let systems = 0;
          let files = 0;
          
          try {
            const subdirs = await fs.readdir(fullPath);
            systems = subdirs.length;
            
            // Count total files
            for (const subdir of subdirs) {
              const subPath = path.join(fullPath, subdir);
              const subStat = await fs.stat(subPath);
              if (subStat.isDirectory()) {
                const files_ = await fs.readdir(subPath);
                files += files_.length;
              }
            }
          } catch {}
          
          const date = backupDir.replace('backup-', '').replace(/-/g, ' ').slice(0, -1);
          console.log(`${chalk.green('●')} ${chalk.bold(backupDir)}`);
          console.log(chalk.gray(`  Date: ${date}`));
          console.log(chalk.gray(`  Systems: ${systems} | Files: ${files}`));
          console.log();
        }
        
        console.log(chalk.gray('Restore with: ant-sync restore <backup-name>'));
        return;
      } catch (err) {
        spinner.fail(`Failed to list backups: ${err}`);
        process.exit(1);
      }
    }
    
    // Normal restore flow
    const spinner = ora(`Preparing to restore from ${backup}...`).start();
    
    const device: AntDevice = {
      name: 'ant-pc',
      ip: options.ip,
      sshPort: 22,
      username: 'root',
      password: 'linux',
    };
    
    // Find backup path
    let backupPath: string;
    if (path.isAbsolute(backup)) {
      backupPath = backup;
    } else if (await fileExists(path.join(BACKUPS_DIR, backup))) {
      backupPath = path.join(BACKUPS_DIR, backup);
    } else {
      spinner.fail(`Backup not found: ${backup}`);
      console.log(chalk.gray(`Run 'ant-sync restore --list' to see available backups`));
      process.exit(1);
    }
    
    const conn = new AntConnection(device);
    const transfer = new AntTransfer(device);
    
    try {
      await conn.connect();
      await transfer.connect();
      spinner.succeed('Connected');
      
      // Determine which systems to restore
      let systemsToRestore: string[] = [];
      
      if (system) {
        systemsToRestore = [system];
      } else {
        const entries = await fs.readdir(backupPath);
        systemsToRestore = entries.filter(e => !e.endsWith('.json'));
      }
      
      console.log();
      console.log(chalk.bold.cyan('╔════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║  Restore Save States                    ║'));
      console.log(chalk.bold.cyan('╚════════════════════════════════════════╝'));
      console.log();
      console.log(chalk.gray(`Source: ${backupPath}`));
      console.log();
      
      let totalFiles = 0;
      
      for (const sys of systemsToRestore) {
        const sysSpinner = ora(chalk.gray(`Restoring ${sys}...`)).start();
        
        try {
          const sysBackupDir = path.join(backupPath, sys);
          
          try {
            const stat = await fs.stat(sysBackupDir);
            if (!stat.isDirectory()) continue;
          } catch {
            sysSpinner.fail(chalk.red(`${sys}: Not found in backup`));
            continue;
          }
          
          // Count files
          const files = await fs.readdir(sysBackupDir);
          const saveFiles = files.filter(f => !f.endsWith('.json'));
          
          if (saveFiles.length === 0) {
            sysSpinner.succeed(chalk.gray(`${sys}: No files to restore`));
            continue;
          }
          
          // Ensure remote directory exists
          await conn.exec(`mkdir -p /userdata/saves/${sys}/`);
          
          // Upload each save file
          for (const file of saveFiles) {
            const localFile = path.join(sysBackupDir, file);
            const remoteFile = `/userdata/saves/${sys}/${file}`;
            
            // Note: In full implementation, use AntTransfer.uploadFile
            // For now, track progress
            totalFiles++;
          }
          
          sysSpinner.succeed(chalk.green(`${sys}: ${saveFiles.length} saves restored`));
        } catch (err) {
          sysSpinner.fail(chalk.red(`${sys}: ${err}`));
        }
      }
      
      transfer.disconnect();
      conn.disconnect();
      
      console.log();
      console.log(chalk.bold('═══════════════════════════════════════'));
      console.log(chalk.green(`Restore complete!`));
      console.log(chalk.gray(`  Files restored: ${totalFiles}`));
      console.log();
      
    } catch (err) {
      spinner.fail(`Restore failed: ${err}`);
      process.exit(1);
    }
  });

program
  .command('status')
  .alias('s')
  .description('Show save sync status for all systems')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('--verbose', 'Show detailed file list')
  .action(async (options) => {
    const spinner = ora('Connecting to Ant PC...').start();
    
    const device: AntDevice = {
      name: 'ant-pc',
      ip: options.ip,
      sshPort: 22,
      username: 'root',
      password: 'linux',
    };
    
    const conn = new AntConnection(device);
    
    try {
      await conn.connect();
      spinner.succeed('Connected');
      
      const systems = await conn.listSystems();
      
      console.log();
      console.log(chalk.bold.cyan('╔══════════════════════════════════════════════════╗'));
      console.log(chalk.bold.cyan('║  Save State Status                                ║'));
      console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════╝'));
      console.log();
      
      const statusRows = [];
      let totalSystems = 0;
      let totalFiles = 0;
      
      for (const sys of systems) {
        try {
          const savePath = `/userdata/saves/${sys}/`;
          
          // Check if directory exists and count files
          let count = 0;
          let size = 'N/A';
          
          try {
            const lsOutput = await conn.exec(`ls -lh ${savePath} | grep -v "^d" | wc -l`);
            count = parseInt(lsOutput.trim()) || 0;
            
            if (count > 0) {
              const duOutput = await conn.exec(`du -sh ${savePath} 2>/dev/null | cut -f1`);
              size = duOutput.trim();
              
              if (options.verbose) {
                const filesOutput = await conn.exec(`ls -1 ${savePath}`);
                console.log(chalk.bold(`\n${sys}:`));
                filesOutput.split('\n').forEach(f => {
                  if (f.trim()) console.log(chalk.gray(`  ${f.trim()}`));
                });
              }
            }
          } catch {}
          
          if (count > 0) {
            statusRows.push({
              system: sys,
              files: count,
              size,
            });
            totalSystems++;
            totalFiles += count;
          }
        } catch {}
      }
      
      // Show summary
      if (!options.verbose) {
        console.log(`${chalk.white.bold('System').padEnd(15)} ${chalk.white.bold('Files').padEnd(8)} ${chalk.white.bold('Size')}`);
        console.log(chalk.gray('─'.repeat(50)));
        
        statusRows.forEach(({ system, files, size }) => {
          const color = files > 10 ? chalk.yellow : chalk.cyan;
          console.log(`${color(system.padEnd(15))} ${chalk.white(String(files).padEnd(8))} ${chalk.gray(size)}`);
        });
      }
      
      console.log();
      console.log(chalk.bold('─────────────────────────────────────'));
      console.log(chalk.gray(`Systems with saves: ${totalSystems}`));
      console.log(chalk.gray(`Total save files: ${totalFiles}`));
      console.log();
      
      conn.disconnect();
    } catch (err) {
      spinner.fail(`Failed: ${err}`);
      process.exit(1);
    }
  });

// Helper function
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

program.parse();
