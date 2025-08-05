import { Command } from 'commander';
import packagejson from '../package.json' with { type: 'json' };
import { banner, description } from './utils/banner';

// Display the intro message
const program = new Command();

program
  .version(packagejson.version)
  .name(packagejson.name)
  .description(`${banner}\n\n\n${description}`);

// Register commands
// ...

// Handle unknown commands
program.parse(process.argv);
