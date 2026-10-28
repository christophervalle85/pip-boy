#!/usr/bin/env node
/**
 * Restore the animated AirPods GLB from its losslessly compressed Git asset.
 * Runs automatically before "npm run dev" and "npm run build".
 * Uses Node.js built-ins only; no network, new dependency, or ZIP download.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const compressed = fileURLToPath(new URL('../public/models/inventory/airpods_pro.glb.gz', import.meta.url));
const output = fileURLToPath(new URL('../public/models/inventory/airpods_pro.glb', import.meta.url));
const originalSha256 = '89621a94faf7282b265518c4497bec1616b876ab031b3aed2b7c61b1c4e5d277';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

try {
  if (existsSync(output) && digest(readFileSync(output)) === originalSha256) {
    console.log('AirPods GLB already restored and verified.');
  } else {
    if (!existsSync(compressed)) throw new Error('Missing versioned AirPods archive: ' + compressed);
    const bytes = gunzipSync(readFileSync(compressed));
    if (bytes.length !== 5122660 || digest(bytes) !== originalSha256) {
      throw new Error('The stored AirPods asset did not match its original verified checksum.');
    }
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, bytes);
    console.log('Restored the original animated AirPods GLB (' + bytes.length.toLocaleString() + ' bytes).');
  }
} catch (error) {
  console.error('Could not prepare the AirPods 3D model:', error);
  process.exitCode = 1;
}
