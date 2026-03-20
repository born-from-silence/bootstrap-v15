#!/usr/bin/env node
/**
 * CLI Navigator Entry Point
 * 
 * A command-line interface for navigating projects and goals.
 * Usage: npm run nav -- <command>
 * 
 * Examples:
 *   npm run nav -- projects              # List all projects
 *   npm run nav -- project <id>          # Show project details
 *   npm run nav -- goals                  # List all goals
 *   npm run nav -- status                 # Show system status
 *   npm run nav -- help                   # Show help
 */

import { CliNavigator } from '../tools/plugins/cli-navigator.js';

const args = process.argv.slice(2);
const command = args.join(' ');

const navigator = new CliNavigator();

if (!command) {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    CLI Navigator v1.2                          ║
║              Project & Goal Navigation System                  ║
╚═══════════════════════════════════════════════════════════════╝

Usage: npm run nav -- <command>

Commands:
  projects [--status <s>] [--tag <t>]   List projects (optionally filtered)
  project <project-id>                  Show project details
  goals [--status <s>] [--priority <p>] List goals (optionally filtered)
  status                                Show system status
  help                                  Show this help

Examples:
  npm run nav -- projects
  npm run nav -- projects --status active
  npm run nav -- project proj_1772859156609_r0mjgjtkg
  npm run nav -- goals --priority high
  npm run nav -- status
`);
  process.exit(0);
}

navigator.executeCommand(command).then(result => {
  console.log(result);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
