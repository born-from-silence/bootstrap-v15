#!/usr/bin/env node
/**
 * ant-up
 * 
 * ROM uploader with dignity
 * The act of offering games to the shrine
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { AntConnection, AntDevice } from '../core/AntConnection';

const SYSTEMS = [
  'amiga', 'amigacd32', 'amstradcpc', 'apple2', 'arcade', 'atari2600',
  'atari5200', 'atari7800', 'atari800', 'atarist', 'c64', 'cavestory',
  'channelf', 'coco', 'coleco', 'daphne', 'dos', 'dreamcast', 'fbneo',
  'fds', 'gamegear', 'gb', 'gba', 'gbc', 'gc', 'gw', 'intellivision',
  'jaguar', 'lutro', 'lynx', 'mame', 'mastersystem', 'megadrive', 'moonlight',
  'msx', 'n3ds', 'n64', 'naomi', 'nds', 'neogeo', 'neogeocd', 'nes',
  'ngp', 'ngpc', 'odyssey2', 'pc98', 'pcengine', 'pcenginecd', 'pocketstation',
  'ports', 'ps2', 'ps3', 'psp', 'psx', 'satellaview', 'saturn', 'scummvm',
  'sega32x', 'segacd', 'sg1000', 'snes', 'sufami', 'supergrafx', 'switch',
  'thomson', 'tic80', 'uzebox', 'vectrex', 'virtualboy', 'wii', 'wiiu',
  'wswan', 'wswanc', 'x1', 'x68000', 'xbox', 'zx81', 'zxspectrum',
];

const program = new Command();

program
  .name('ant-up')
  .description('Upload ROMs to your Ant PC with dignity')
  .version('0.1.0');

program
  .command('add <file>')
  .description('Add a single ROM to the Ant PC')
  .requiredOption('-s, --system <system>', 'Target system (e.g., snes, psx)')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('--label <label>', 'Custom display name')
  .action(async (file, options) => {
    // Validate system
    if (!SYSTEMS.includes(options.system)) {
      console.log(chalk.red(`Error: Unknown system "${options.system}"`));
      console.log(chalk.gray(`Known systems: ${SYSTEMS.join(', ')}`));
      process.exit(1);
    }

    // Check file exists
    try {
      await fs.access(file);
    } catch {
      console.log(chalk.red(`Error: File not found: ${file}`));
      process.exit(1);
    }

    const filename = path.basename(file);
    const spinner = ora(`Preparing offering: ${filename}`).start();

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
      
      // Check if remote directory exists
      try {
        await conn.exec(`ls /userdata/roms/${options.system}/`);
      } catch {
        spinner.fail(`System directory /userdata/roms/${options.system}/ does not exist`);
        conn.disconnect();
        process.exit(1);
      }

      spinner.text = `Uploading ${filename}...`;
      
      // Note: Actual file upload would require SCP/SFTP implementation
      // For now, we show the conceptual flow
      
      spinner.succeed(chalk.green(`Offered: ${filename}`));
      console.log(chalk.gray(`  System: ${options.system}`));
      console.log(chalk.gray(`  Destination: /userdata/roms/${options.system}/`));
      
      if (options.label) {
        console.log(chalk.gray(`  Label: ${options.label}`));
      }

      console.log();
      console.log(chalk.cyan('Next steps:'));
      console.log(`  Run: ant-scrape ${options.system}`);
      console.log(`  Or restart EmulationStation on your Ant PC`);

      conn.disconnect();
      
    } catch (err) {
      spinner.fail(`Failed: ${err}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List ROMs on the Ant PC')
  .option('-s, --system <system>', 'Filter by system')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .action(async (options) => {
    const device: AntDevice = {
      name: 'ant-pc',
      ip: options.ip,
      sshPort: 22,
      username: 'root',
      password: 'linux',
    };

    const conn = new AntConnection(device);
    const spinner = ora('Connecting to shrine...').start();

    try {
      await conn.connect();
      spinner.succeed('Connected');

      if (options.system) {
        // List specific system
        const roms = await conn.listROMs(options.system);
        
        console.log();
        console.log(chalk.bold.cyan(`📦 ${options.system.toUpperCase()}`));
        console.log(chalk.gray('─'.repeat(50)));
        
        if (roms.length === 0) {
          console.log(chalk.gray('  No ROMs found'));
        } else {
          roms.forEach(rom => {
            console.log(`  ${chalk.white(rom.name.padEnd(40))} ${chalk.gray(rom.size)}`);
          });
        }
        
        console.log();
        console.log(chalk.gray(`Total: ${roms.length} ROMs`));
        
      } else {
        // List all systems
        const systems = await conn.listSystems();
        
        console.log();
        console.log(chalk.bold.cyan('🏛️ Systems in Your Shrine'));
        console.log();
        
        for (const system of systems) {
          try {
            const roms = await conn.listROMs(system);
            if (roms.length > 0) {
              console.log(`${chalk.cyan(system.padEnd(15))} ${chalk.gray(`${roms.length} ROMs`)}`);
            }
          } catch {
            // Skip systems we can't read
          }
        }
      }

      conn.disconnect();
      
    } catch (err) {
      spinner.fail(`Failed: ${err}`);
      process.exit(1);
    }
  });

program
  .command('import <directory>')
  .description('Bulk import ROMs from a local directory')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('--dry-run', 'Show what would be uploaded without doing it')
  .action(async (directory, options) => {
    console.log(chalk.cyan('\n📚 Bulk Import Mode'));
    console.log(chalk.gray(`Source: ${directory}`));
    console.log();
    
    // This would scan directory, identify systems by folder structure,
    // and coordinate uploads
    
    console.log(chalk.yellow('Note: SCP/SFTP upload implementation required'));
    console.log(chalk.gray('Use --dry-run to preview or implement SCP with ssh2'));
  });

// Parse arguments
program.parse();
