import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const legacyAppDir = resolve(process.cwd(), 'app');

if (existsSync(legacyAppDir)) {
  console.error('Legacy route root detected at ./app.');
  console.error('This project uses src/app only.');
  console.error('Remove or migrate files from ./app to ./src/app before running commands.');
  process.exit(1);
}
