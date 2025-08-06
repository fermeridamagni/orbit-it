import { banner, description } from '@utils/banner';
import { Command } from 'commander';
// @ts-expect-error Error: TypeScript does not recognize the import of JSON files by default.
import packagejson from '../package.json' with { type: 'json' };

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
