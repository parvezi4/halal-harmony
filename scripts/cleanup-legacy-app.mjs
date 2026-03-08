import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const legacyAppDir = resolve(process.cwd(), 'app');

if (!existsSync(legacyAppDir)) {
  console.log('No legacy ./app directory found.');
  process.exit(0);
}

rmSync(legacyAppDir, { recursive: true, force: true });
console.log('Removed legacy ./app directory.');
console.log('This project should now use only ./src/app.');
