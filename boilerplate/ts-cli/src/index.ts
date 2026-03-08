#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('ts-cli')
  .description('Modern TypeScript CLI')
  .version('1.0.0');

program
  .command('hello')
  .description('Say hello')
  .argument('[name]', 'Name to greet', 'World')
  .action((name) => {
    console.log(chalk.green(`Hello, ${name}!`));
  });

program.parse();