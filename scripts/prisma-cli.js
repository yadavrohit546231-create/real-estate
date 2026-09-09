#!/usr/bin/env node
/**
 * Prisma CLI wrapper that dynamically resolves component database environment variables
 * (DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME)
 * and safely encodes credentials before passing to Prisma commands.
 */
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

if (!process.env.DATABASE_URL) {
  const user = encodeURIComponent(process.env.DATABASE_USER || process.env.DATABSE_USER || process.env.DB_USER || 'root');
  const password = encodeURIComponent(process.env.DATABASE_PASSWORD || process.env.DATABSE_PASSWORD || process.env.DB_PASSWORD || '');
  const host = process.env.DATABASE_HOST || process.env.DATABSE_HOST || process.env.DB_HOST || 'localhost';
  const port = process.env.DATABASE_PORT || process.env.DATABSE_PORT || process.env.DB_PORT || '3306';
  const name = process.env.DATABASE_NAME || process.env.DATABSE_NAME || process.env.DB_NAME || 'real-estate';
  process.env.DATABASE_URL = `mysql://${user}:${password}@${host}:${port}/${name}`;
}

const args = process.argv.slice(2);
const isWin = process.platform === 'win32';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const proc = spawn(npxCmd, ['prisma', ...args], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

proc.on('exit', (code) => {
  process.exit(code || 0);
});
