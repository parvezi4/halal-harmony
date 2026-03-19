import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';

function readEnvVar(filePath, key) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (!match) {
    return null;
  }

  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function getHost(value) {
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

const cwd = process.cwd();
const envPath = path.join(cwd, '.env');
const envLocalPath = path.join(cwd, '.env.local');

const envDatabaseUrl = readEnvVar(envPath, 'DATABASE_URL');
const envLocalDatabaseUrl = readEnvVar(envLocalPath, 'DATABASE_URL');

const issues = [];

if (!envDatabaseUrl) {
  issues.push('DATABASE_URL is missing in .env. Prisma CLI reads .env by default.');
}

if (envDatabaseUrl && /your_host|your_user|your_password/.test(envDatabaseUrl)) {
  issues.push('DATABASE_URL in .env still contains placeholder values.');
}

if (envDatabaseUrl && envLocalDatabaseUrl) {
  const envHost = getHost(envDatabaseUrl);
  const envLocalHost = getHost(envLocalDatabaseUrl);

  if (envHost && envLocalHost && envHost !== envLocalHost) {
    issues.push(`DATABASE_URL host mismatch between .env (${envHost}) and .env.local (${envLocalHost}).`);
  }
}

if (issues.length > 0) {
  console.error('Prisma environment configuration check failed:\n');
  for (const issue of issues) {
    console.error(`- ${issue}`);
  }

  console.error('\nRecommended fix:');
  console.error('- Keep DATABASE_URL aligned between .env and .env.local for local development.');
  console.error('- If you intentionally use a different DB for Prisma CLI, export DATABASE_URL in the shell before running Prisma commands.');
  process.exit(1);
}

console.log('Prisma environment configuration looks aligned.');