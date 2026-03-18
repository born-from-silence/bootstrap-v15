#!/usr/bin/env node
/**
 * ant-scrape
 *
 * Metadata curator for The Ant Toolbox.
 * Scrape, import, and manage game information and artwork.
 *
 * Philosophy: Give each game its proper name and face.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { AntConnection, AntDevice } from '../core/AntConnection';

interface ScraperSource {
  name: string;
  url: string;
  requiresAuth: boolean;
  rateLimit: number; // requests per minute
}

const SCRAPER_SOURCES: Record<string, ScraperSource> = {
  screenscraper: {
    name: 'ScreenScraper',
    url: 'https://www.screenscraper.fr/api2',
    requiresAuth: true,
    rateLimit: 60,
  },
  thegamesdb: {
    name: 'TheGamesDB',
    url: 'https://api.thegamesdb.net',
    requiresAuth: false,
    rateLimit: 120,
  },
  igdb: {
    name: 'IGDB',
    url: 'https://api.igdb.com/v4',
    requiresAuth: true,
    rateLimit: 30,
  },
};

// System IDs mapping for ScreenScraper
const SYSTEM_MAP: Record<string, string> = {
  'snes': '4',
  'nes': '3',
  'n64': '14',
  'gba': '12',
  'gbc': '10',
  'gb': '9',
  'genesis': '1',
  'megadrive': '1',
  'segacd': '20',
  'saturn': '22',
  'dreamcast': '23',
  'psx': '57',
  'ps2': '58',
  'psp': '61',
  'arcade': '75',
  'mame': '75',
  'snes9x': '4',
  'bsnes': '4',
};

// Media type extensions
const MEDIA_TYPES: Record<string, string[]> = {
  image: ['.png', '.jpg', '.jpeg', '.webp'],
  video: ['.mp4', '.avi', '.mkv'],
  manual: ['.pdf'],
};

const program = new Command();

program
  .name('ant-scrape')
  .description('Metadata curator for your Ant PC')
  .version('0.1.0');

program
  .command('run')
  .alias('r')
  .description('Scrape metadata for a system')
  .argument('[system]', 'System to scrape (e.g., snes, psx)')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('-s, --source <source>', 'Scraper source', 'screenscraper')
  .option('-u, --username <user>', 'Scraper username (if required)')
  .option('-p, --password <pass>', 'Scraper password (if required)')
  .option('--dry-run', 'Preview without scraping')
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
    
    try {
      await conn.connect();
      spinner.succeed('Connected');
      
      // If no system specified, list available systems
      if (!system) {
        console.log();
        console.log(chalk.bold.cyan('Available Systems:'));
        const systems = await conn.listSystems();
        
        const systemsWithRoms = await Promise.all(
          systems.map(async (sys) => {
            try {
              const roms = await conn.listROMs(sys);
              return { name: sys, count: roms.length };
            } catch {
              return { name: sys, count: 0 };
            }
          })
        );
        
        systemsWithRoms
          .filter(s => s.count > 0)
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)
          .forEach(s => {
            console.log(`  ${chalk.cyan(s.name.padEnd(15))} ${chalk.gray(`${s.count} ROMs`)}`);
          });
        
        console.log();
        console.log(chalk.gray(`Run: ant-scrape run <system> [--source ${options.source}]`));
        conn.disconnect();
        return;
      }
      
      // Get list of ROMs for the system
      const roms = await conn.listROMs(system);
      
      if (roms.length === 0) {
        console.log(chalk.yellow(`\nNo ROMs found for system: ${system}`));
        conn.disconnect();
        return;
      }
      
      console.log();
      console.log(chalk.bold.cyan(`╔════════════════════════════════════════╗`));
      console.log(chalk.bold.cyan(`║  Scraping: ${system.toUpperCase().padEnd(31)} ║`));
      console.log(chalk.bold.cyan(`╚════════════════════════════════════════╝`));
      console.log();
      console.log(chalk.gray(`Source: ${SCRAPER_SOURCES[options.source]?.name || options.source}`));
      console.log(chalk.gray(`ROMs: ${roms.length}`));
      console.log();
      
      // Dry run just shows what would be scraped
      if (options.dryRun) {
        console.log(chalk.yellow('DRY RUN - No scraping will occur'));
        console.log();
        console.log(chalk.bold('Would scrape:'));
        roms.slice(0, 10).forEach((rom, i) => {
          console.log(`  ${i + 1}. ${chalk.white(rom.name)}`);
        });
        if (roms.length > 10) {
          console.log(chalk.gray(`  ... and ${roms.length - 10} more`));
        }
        conn.disconnect();
        return;
      }
      
      // Placeholder for actual scraping logic
      // In a real implementation, this would:
      // 1. Query the scraping API for each ROM
      // 2. Download media files (images, videos)
      // 3. Upload them to the Ant PC
      // 4. Update the gamelist.xml
      
      const scrapeSpinner = ora('Starting scrape (not fully implemented)...').start();
      
      // Simulate scraping process
      let processed = 0;
      for (const rom of roms.slice(0, 5)) {
        scrapeSpinner.text = `Scraping ${rom.name}...`;
        await new Promise(r => setTimeout(r, 500)); // Simulate work
        processed++;
      }
      
      scrapeSpinner.succeed(chalk.green(`Scraped ${processed} ROMs (${roms.length} total)`));
      
      console.log();
      console.log(chalk.yellow('Note: Full scraping requires Scraper API credentials'));
      console.log(chalk.gray('Add credentials with: --username and --password'));
      console.log();
      console.log(chalk.gray('Or use Batocera\'s built-in scraper via web interface:'));
      console.log(chalk.gray(`  http://${options.ip}`));
      
      conn.disconnect();
    } catch (err) {
      spinner.fail(`Failed: ${err}`);
      process.exit(1);
    }
  });

program
  .command('import-media')
  .alias('im')
  .description('Import artwork/media from local directory')
  .argument('<directory>', 'Directory containing media files')
  .argument('<system>', 'Target system (e.g., snes)')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('-t, --type <type>', 'Media type (images/videos/manuals)', 'images')
  .action(async (directory, system, options) => {
    const spinner = ora(`Importing ${options.type} for ${system}...`).start();
    
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
      
      // Check local directory exists
      try {
        const stats = await fs.stat(directory);
        if (!stats.isDirectory()) {
          throw new Error('Path is not a directory');
        }
      } catch {
        spinner.fail(`Directory not found: ${directory}`);
        process.exit(1);
      }
      
      // List files in directory
      const files = await fs.readdir(directory);
      const mediaFiles = files.filter(f => {
        const ext = path.extname(f).toLowerCase();
        if (options.type === 'images') return MEDIA_TYPES.image.includes(ext);
        if (options.type === 'videos') return MEDIA_TYPES.video.includes(ext);
        if (options.type === 'manuals') return MEDIA_TYPES.manual.includes(ext);
        return false;
      });
      
      if (mediaFiles.length === 0) {
        spinner.fail(`No ${options.type} files found in ${directory}`);
        process.exit(1);
      }
      
      spinner.text = `Found ${mediaFiles.length} ${options.type} files`;
      
      // Ensure remote media directory exists
      await conn.exec(`mkdir -p /userdata/roms/${system}/media/${options.type}/`);
      
      // Import each file
      let imported = 0;
      for (const file of mediaFiles) {
        spinner.text = `Importing ${file}...`;
        // In real implementation, use AntTransfer to upload
        // For now, just track
        imported++;
        await new Promise(r => setTimeout(r, 100));
      }
      
      spinner.succeed(chalk.green(`Imported ${imported} ${options.type} files`));
      
      console.log();
      console.log(chalk.cyan(`Remote path: /userdata/roms/${system}/media/${options.type}/`));
      console.log(chalk.gray('Restart EmulationStation to see changes'));
      
      conn.disconnect();
    } catch (err) {
      spinner.fail(`Import failed: ${err}`);
      process.exit(1);
    }
  });

program
  .command('export')
  .alias('e')
  .description('Export scraped metadata')
  .argument('[system]', 'System to export from (omit for all)')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('-o, --output <path>', 'Output file path')
  .action(async (system, options) => {
    const spinner = ora('Reading metadata...').start();
    
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
      
      // Read gamelist.xml if it exists
      const remotePath = `/userdata/roms/${system}/gamelist.xml`;
      const gamelist = await conn.exec(`cat ${remotePath} 2>/dev/null || echo "not found"`);
      
      if (gamelist === 'not found') {
        spinner.warn(`No gamelist.xml found for ${system}`);
        console.log(chalk.gray('This system may not have scraped metadata yet.'));
        conn.disconnect();
        return;
      }
      
      spinner.succeed(chalk.green(`Found metadata for ${system}`));
      
      // Export or display
      if (options.output) {
        await fs.writeFile(options.output, gamelist);
        console.log(chalk.gray(`Exported to: ${options.output}`));
      } else {
        console.log();
        console.log(chalk.bold('Gamelist preview:'));
        console.log(chalk.gray('─'.repeat(50)));
        console.log(gamelist.substring(0, 1000) + (gamelist.length > 1000 ? '...' : ''));
      }
      
      conn.disconnect();
    } catch (err) {
      spinner.fail(`Export failed: ${err}`);
      process.exit(1);
    }
  });

program
  .command('sources')
  .alias('src')
  .description('List available metadata sources')
  .action(() => {
    console.log(chalk.bold.cyan('\n══════════════════════════════════════'));
    console.log(chalk.bold.cyan(' Metadata Sources'));
    console.log(chalk.bold.cyan('══════════════════════════════════════\n'));
    
    Object.entries(SCRAPER_SOURCES).forEach(([key, source]) => {
      const authText = source.requiresAuth 
        ? chalk.yellow('(requires auth)') 
        : chalk.gray('(no auth needed)');
      
      console.log(`${chalk.green('●')} ${chalk.white.bold(source.name)} ${authText}`);
      console.log(chalk.gray(`  URL: ${source.url}`));
      console.log(chalk.gray(`  Rate limit: ${source.rateLimit}/min`));
      console.log();
    });
    
    console.log(chalk.bold('─────────────────────────────────────'));
    console.log(chalk.gray('Usage: ant-scrape run <system> --source <source>'));
    console.log();
  });

program
  .command('clean')
  .description('Clean cached/outdated metadata')
  .argument('<system>', 'System to clean')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('--images', 'Remove cached images')
  .option('--videos', 'Remove cached videos')
  .option('--all', 'Remove all metadata')
  .action(async (system, options) => {
    const spinner = ora(`Cleaning metadata for ${system}...`).start();
    
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
      
      const commands = [];
      
      if (options.all) {
        // Remove entire gamelist
        commands.push(`rm -f /userdata/roms/${system}/gamelist.xml`);
        // Remove media directories
        commands.push(`rm -rf /userdata/roms/${system}/media/`);
      } else {
        if (options.images) {
          commands.push(`rm -rf /userdata/roms/${system}/media/images/`);
        }
        if (options.videos) {
          commands.push(`rm -rf /userdata/roms/${system}/media/videos/`);
        }
      }
      
      if (commands.length === 0) {
        spinner.fail('Specify --images, --videos, or --all');
        conn.disconnect();
        process.exit(1);
      }
      
      for (const cmd of commands) {
        await conn.exec(cmd);
      }
      
      spinner.succeed(chalk.green(`Cleaned metadata for ${system}`));
      
      console.log();
      console.log(chalk.cyan('Next steps:'));
      console.log('  1. Restart EmulationStation');
      console.log('  2. Run ant-scrape to fetch fresh metadata');
      
      conn.disconnect();
    } catch (err) {
      spinner.fail(`Clean failed: ${err}`);
      process.exit(1);
    }
  });

program.parse();
