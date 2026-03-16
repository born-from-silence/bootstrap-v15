#!/usr/bin/env node
/**
 * ant-toolbox
 * 
 * Main entry point and configuration management
 * The keeper of the config
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';

const CONFIG_DIR = path.join(os.homedir(), '.ant-toolbox');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.yaml');

const program = new Command();

program
  .name('ant-toolbox')
  .description('The Ant Toolbox - tending your shrine')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize configuration')
  .action(async () => {
    console.log(chalk.cyan('\n🔧 Initializing The Ant Toolbox\n'));

    // Create config directory
    try {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch {
      // Already exists
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Name this Ant PC:',
        default: 'living-room'
      },
      {
        type: 'input',
        name: 'ip',
        message: 'Ant PC IP address:',
        default: '192.168.1.50'
      },
      {
        type: 'input',
        name: 'username',
        message: 'SSH username:',
        default: 'root'
      },
      {
        type: 'password',
        name: 'password',
        message: 'SSH password:',
        default: 'linux'
      }
    ]);

    const config = {
      ant_pcs: {
        [answers.name]: {
          ip: answers.ip,
          ssh_port: 22,
          username: answers.username,
          password: answers.password,
        }
      },
      defaults: {
        scraper: 'screenscraper',
        parallel_uploads: 4,
        compress_images: true,
        backup_retention: '30d'
      }
    };

    const yaml = require('yaml');
    await fs.writeFile(CONFIG_FILE, yaml.stringify(config));
    
    console.log(chalk.green(`\n✓ Configuration saved to ${CONFIG_FILE}`));
    console.log(chalk.gray('\nNext steps:'));
    console.log(`  ant-watch live -i ${answers.ip}`);
    console.log(`  ant-up list -i ${answers.ip}`);
  });

program
  .command('scan')
  .description('Scan network for Batocera devices')
  .action(async () => {
    console.log(chalk.cyan('\n🔍 Scanning for Ant PCs...\n'));
    console.log(chalk.yellow('Note: Requires nmap or network scanning tool'));
    console.log(chalk.gray('Manual method: Check your router for devices named "batocera" or "RETRO"'));
    
    // Could implement via child_process.exec('nmap...')
    // For now, guidance
    console.log(chalk.gray('\nCommon locations:'));
    console.log('  - Check router admin page');
    console.log('  - Run: nmap -p 22 192.168.1.0/24');
    console.log('  - TV screen: Settings shows IP');
  });

program
  .command('config')
  .description('Show current configuration')
  .action(async () => {
    try {
      const content = await fs.readFile(CONFIG_FILE, 'utf8');
      console.log(chalk.cyan('\n📄 Current Configuration:\n'));
      console.log(content);
    } catch {
      console.log(chalk.yellow('No configuration found. Run: ant-toolbox init'));
    }
  });

program
  .command('version')
  .description('Show version')
  .action(() => {
    console.log(chalk.cyan('The Ant Toolbox v0.1.0'));
    console.log(chalk.gray('For Ant PC + Batocera'));
  });

program.parse();
