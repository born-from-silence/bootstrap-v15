#!/usr/bin/env node
/**
 * ant-watch
 * 
 * Real-time system monitoring for your Ant PC
 * Like keeping a candle burning for the shrine
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { AntConnection, AntDevice } from '../core/AntConnection';

const program = new Command();

program
  .name('ant-watch')
  .description('Monitor your Ant PC like a shrine keeper')
  .version('0.1.0');

program
  .command('live')
  .description('Real-time system monitoring')
  .option('-i, --ip <ip>', 'Ant PC IP address')
  .option('-p, --port <port>', 'SSH port', '22')
  .option('--interval <seconds>', 'Update interval', '5')
  .action(async (options) => {
    if (!options.ip) {
      console.log(chalk.red('Error: IP address required'));
      process.exit(1);
    }

    const device: AntDevice = {
      name: 'ant-pc',
      ip: options.ip,
      sshPort: parseInt(options.port),
      username: 'root',
      password: 'linux',
    };

    const conn = new AntConnection(device);
    
    const spinner = ora('Connecting to Ant PC...').start();
    
    try {
      await conn.connect();
      spinner.succeed('Connected to shrine');
      
      console.log(chalk.cyan('\n📡 Monitoring Ant PC... Press Ctrl+C to exit\n'));
      
      const interval = parseInt(options.interval) * 1000;
      
      const update = async () => {
        try {
          const status = await conn.getStatus();
          
          // Clear screen
          console.clear();
          
          // Header
          console.log(chalk.bold.cyan('╔════════════════════════════════════════╗'));
          console.log(chalk.bold.cyan('║         🔥 THE ANT PC 🔥               ║'));
          console.log(chalk.bold.cyan('╚════════════════════════════════════════╝'));
          console.log();
          
          // Basic info
          console.log(chalk.white(`Hostname: ${chalk.green(status.hostname)}`));
          console.log(chalk.white(`Uptime:   ${chalk.yellow(status.uptime)}`));
          console.log(chalk.white(`Version:  ${chalk.magenta(status.batoceraVersion)}`));
          console.log();
          
          // Storage bar
          const barWidth = 40;
          const filled = Math.floor((status.storage.percentage / 100) * barWidth);
          const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
          const storageColor = status.storage.percentage > 85 ? chalk.red : 
                               status.storage.percentage > 70 ? chalk.yellow : chalk.green;
          
          console.log(chalk.bold('Storage:'));
          console.log(`  ${storageColor(bar)} ${status.storage.percentage}%`);
          console.log(`  ${chalk.gray(`${status.storage.used} / ${status.storage.total} used`)}`);
          console.log();
          
          // Temperatures (if available)
          if (status.cpuTemp !== undefined) {
            const tempColor = status.cpuTemp > 70 ? chalk.red :
                            status.cpuTemp > 55 ? chalk.yellow : chalk.green;
            console.log(chalk.bold('Temperatures:'));
            console.log(`  CPU: ${tempColor(`${status.cpuTemp}°C`)}`);
            if (status.gpuTemp !== undefined) {
              console.log(`  GPU: ${tempColor(`${status.gpuTemp}°C`)}`);
            }
            console.log();
          }
          
          // Active game
          const activeGame = await conn.getActiveGame();
          if (activeGame) {
            console.log(chalk.bold('Currently playing: ') + chalk.cyan(activeGame));
          } else {
            console.log(chalk.gray('EmulationStation idle'));
          }
          
          // Footer
          console.log();
          console.log(chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}`));
          
        } catch (err) {
          console.error(chalk.red(`\n⚠ Error: ${err}`));
        }
      };
      
      // Initial update
      await update();
      
      // Set interval
      const timer = setInterval(update, interval);
      
      // Graceful shutdown
      process.on('SIGINT', () => {
        clearInterval(timer);
        conn.disconnect();
        console.log(chalk.gray('\n\nGoodbye, caretaker.'));
        process.exit(0);
      });
      
    } catch (err) {
      spinner.fail(`Connection failed: ${err}`);
      process.exit(1);
    }
  });

program
  .command('check')
  .description('One-time health check')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('-p, --port <port>', 'SSH port', '22')
  .action(async (options) => {
    const device: AntDevice = {
      name: 'ant-pc',
      ip: options.ip,
      sshPort: parseInt(options.port),
      username: 'root',
      password: 'linux',
    };

    const conn = new AntConnection(device);
    
    try {
      await conn.connect();
      const status = await conn.getStatus();
      
      // Exit code based on health
      const healthy = status.storage.percentage < 85 && 
                     (status.cpuTemp === undefined || status.cpuTemp < 80);
      
      console.log(healthy ? chalk.green('✓ Healthy') : chalk.yellow('⚠ Attention needed'));
      
      conn.disconnect();
      process.exit(healthy ? 0 : 1);
      
    } catch (err) {
      console.error(chalk.red(`✗ Unreachable: ${err}`));
      process.exit(2);
    }
  });

// Parse arguments
program.parse();
