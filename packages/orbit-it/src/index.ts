import { banner, descriptionMessage } from '@utils/banners';
import { Command } from 'commander';
// @ts-expect-error Error: TypeScript does not recognize the import of JSON files by default.
import packagejson from '../package.json' with { type: 'json' };
import initCommand from './lib/commands/init-command';

// Display the intro message
const program = new Command();

program
  .version(packagejson.version)
  .name(packagejson.name)
  .description(`${banner}\n\n\n${descriptionMessage}`);

// Register commands
initCommand(program);

// Handle unknown commands
program.parse(process.argv);
