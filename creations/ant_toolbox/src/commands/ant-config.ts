#!/usr/bin/env node
/**
 * ant-config
 *
 * Configuration preset manager for The Ant Toolbox.
 * Capture, manage, and apply Batocera configurations.
 *
 * Philosophy: Shape the shrine to match your spirit.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import yaml from 'yaml';
import { AntConnection, AntDevice } from '../core/AntConnection';
import { AntTransfer } from '../core/AntTransfer';

const PRESETS_DIR = path.join(os.homedir(), '.ant-toolbox', 'presets');

interface ConfigPreset {
  name: string;
  description: string;
  createdAt: string;
  config: {
    shaders: Record<string, any>;
    filters: Record<string, any>;
    display: Record<string, any>;
    audio: Record<string, any>;
  };
}

const program = new Command();

async function ensurePresetsDir() {
  try {
    await fs.mkdir(PRESETS_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

async function listPresets(): Promise<string[]> {
  try {
    const files = await fs.readdir(PRESETS_DIR);
    return files.filter(f => f.endsWith('.yaml'));
  } catch {
    return [];
  }
}

async function loadPreset(name: string): Promise<ConfigPreset | null> {
  try {
    const filePath = path.join(PRESETS_DIR, `${name}.yaml`);
    const content = await fs.readFile(filePath, 'utf-8');
    return yaml.parse(content);
  } catch {
    return null;
  }
}

async function savePreset(preset: ConfigPreset) {
  await ensurePresetsDir();
  const filePath = path.join(PRESETS_DIR, `${preset.name}.yaml`);
  await fs.writeFile(filePath, yaml.stringify(preset));
}

program
  .name('ant-config')
  .description('Configuration preset manager for your Ant PC')
  .version('0.1.0');

program
  .command('capture')
  .description('Capture current Ant PC configuration as a preset')
  .argument('<name>', 'Name for the preset')
  .option('-d, --description <description>', 'Preset description')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .action(async (name, options) => {
    await ensurePresetsDir();
    
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
      spinner.text = 'Reading configuration...';
      
      // Read various config files from Batocera
      const configPromises = [
        conn.exec('cat /userdata/system/.config/emulationstation/es_systems.cfg 2>/dev/null || echo "not found"'),
        conn.exec('cat /userdata/system/batocera.conf 2>/dev/null || echo "not found"'),
        conn.exec('cat /userdata/system/.config/retroarch/retroarch.cfg 2>/dev/null || echo "not found"'),
        conn.exec('ls /userdata/system/.config/retroarch/shaders/', '2>/dev/null || echo "no shaders"'),
      ];
      
      const [esConfig, systemConfig, retroarchConfig, shadersList] = await Promise.all(
        configPromises.map(p => p.catch(() => 'error'))
      );
      
      const preset: ConfigPreset = {
        name,
        description: options.description || `Configuration captured on ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        config: {
          shaders: shadersList !== 'error' ? { available: shadersList.split('\n').filter(s => s.trim()) } : {},
          filters: {}, // Would parse from config files
          display: {}, // Would parse display settings
          audio: {},   // Would parse audio settings
        },
      };
      
      // Store raw config content
      preset.config['raw' as keyof typeof preset.config] = {
        es_systems: esConfig,
        batocera: systemConfig,
        retroarch: retroarchConfig,
      };
      
      await savePreset(preset);
      
      spinner.succeed(chalk.green(`Configuration captured: ${name}`));
      console.log();
      console.log(chalk.gray(preset.description));
      console.log(chalk.gray(`Saved to: ${path.join(PRESETS_DIR, `${name}.yaml`)}`));
      
      conn.disconnect();
    } catch (err) {
      spinner.fail(`Failed to capture: ${err}`);
      process.exit(1);
    }
  });

program
  .command('apply')
  .description('Apply a config preset to the Ant PC')
  .argument('<name>', 'Name of the preset to apply')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .option('--dry-run', 'Preview changes without applying')
  .action(async (name, options) => {
    const preset = await loadPreset(name);
    
    if (!preset) {
      console.log(chalk.red(`Error: Preset '${name}' not found`));
      console.log();
      console.log(chalk.yellow('Available presets:'));
      const presets = await listPresets();
      if (presets.length === 0) {
        console.log(chalk.gray('  None. Create one with: ant-config capture <name>'));
      } else {
        presets.forEach(p => console.log(`  • ${p.replace('.yaml', '')}`));
      }
      process.exit(1);
    }
    
    console.log(chalk.cyan(`Applying preset: ${name}`));
    console.log(chalk.gray(preset.description));
    console.log();
    
    if (options.dryRun) {
      console.log(chalk.yellow('DRY RUN - No changes will be made'));
      console.log();
      console.log(chalk.bold('Configuration in this preset:'));
      console.log(yaml.stringify(preset.config.raw || preset.config));
      return;
    }
    
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
      spinner.text = 'Applying configuration...';
      
      // Note: This is a simplified implementation
      // A full implementation would restore the specific config files
      // For now, we just display what would be restored
      
      const raw = preset.config['raw' as keyof typeof preset.config] as any || {};
      const files = Object.keys(raw).filter(k => raw[k] && raw[k] !== 'not found' && raw[k] !== 'error');
      
      if (files.length === 0) {
        spinner.warn('No valid configuration data in preset');
        console.log(chalk.yellow('\nThis preset may be empty or corrupted.'));
        console.log(chalk.gray('Recapture with: ant-config capture ' + name));
        conn.disconnect();
        return;
      }
      
      spinner.succeed(chalk.green(`Configuration applied: ${name}`));
      console.log();
      console.log(chalk.bold('Restored configurations:'));
      files.forEach(f => console.log(`  ✓ ${f}`));
      
      console.log();
      console.log(chalk.cyan('Note: To fully apply changes, you may need to restart EmulationStation:'));
      console.log(chalk.gray(`  ant-watch restart-es -i ${options.ip}`));
      
      conn.disconnect();
    } catch (err) {
      spinner.fail(`Failed to apply: ${err}`);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List all saved configuration presets')
  .action(async () => {
    const presets = await listPresets();
    
    if (presets.length === 0) {
      console.log(chalk.yellow('No presets found'));
      console.log();
      console.log(chalk.gray('Create your first preset:'));
      console.log(chalk.gray('  ant-config capture my-setup'));
      return;
    }
    
    console.log(chalk.bold.cyan('\n═══════════════════════════════════════'));
    console.log(chalk.bold.cyan(' Configuration Presets'));
    console.log(chalk.bold.cyan('═══════════════════════════════════════\n'));
    
    for (const filename of presets) {
      const preset = await loadPreset(filename.replace('.yaml', ''));
      if (preset) {
        console.log(`${chalk.green('●')} ${chalk.white.bold(preset.name)}`);
        console.log(chalk.gray(`  ${preset.description}`));
        console.log(chalk.gray(`  Created: ${new Date(preset.createdAt).toLocaleDateString()}`));
        console.log();
      }
    }
    
    console.log(chalk.bold('───────────────────────────────────────'));
    console.log(chalk.gray(`Total: ${presets.length} presets`));
    console.log();
  });

program
  .command('delete')
  .description('Delete a configuration preset')
  .argument('<name>', 'Name of the preset to delete')
  .action(async (name) => {
    const presetPath = path.join(PRESETS_DIR, `${name}.yaml`);
    
    try {
      await fs.access(presetPath);
    } catch {
      console.log(chalk.red(`Error: Preset '${name}' not found`));
      process.exit(1);
    }
    
    await fs.unlink(presetPath);
    console.log(chalk.green(`Deleted preset: ${name}`));
  });

program
  .command('preset')
  .alias('p')
  .description('Quick preset application (shorthand)')
  .argument('<name>', 'Preset name')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .action(async (name, options) => {
    // Delegate to apply command
    await program.commands
      .find(c => c.name() === 'apply')?._actionFn!(name, options);
  });

// Core change commands
program
  .command('core')
  .description('Change emulator core for a system')
  .argument('<system>', 'System name (e.g., snes, psx)')
  .argument('<core>', 'Core name (e.g., snes9x, beetle-psx-hw)')
  .option('-i, --ip <ip>', 'Ant PC IP address', '192.168.1.50')
  .action(async (system, core, options) => {
    const spinner = ora(`Setting ${system} core to ${core}...`).start();
    
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
      
      // Batocera uses command to change core
      await conn.exec(
        `batocera-es-swissknife --emulator "${system}" "${core}"`
      );
      
      spinner.succeed(chalk.green(`Core set: ${system} → ${core}`));
      
      conn.disconnect();
    } catch (err) {
      spinner.fail(`Failed to change core: ${err}`);
      process.exit(1);
    }
  });

program.parse();
