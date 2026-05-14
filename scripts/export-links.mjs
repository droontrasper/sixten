import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

const env = {};
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIndex = trimmed.indexOf('=');
  if (eqIndex > 0) {
    env[trimmed.slice(0, eqIndex)] = trimmed.slice(eqIndex + 1);
  }
}

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data, error } = await supabase
  .from('links')
  .select('url, title, status, created_at')
  .neq('status', 'deleted')
  .order('created_at', { ascending: false });

if (error) {
  console.error('Supabase error:', error.message);
  process.exit(1);
}

if (!data.length) {
  console.log('No links found.');
  process.exit(0);
}

console.log(`\nFound ${data.length} links:\n`);
for (const link of data) {
  console.log(`  [${link.status}] ${link.title}`);
  console.log(`    ${link.url}\n`);
}

const csvEscape = (val) => {
  const s = String(val ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

const header = 'url,title,status,created_at';
const rows = data.map(r =>
  [r.url, r.title, r.status, r.created_at].map(csvEscape).join(',')
);

const csv = [header, ...rows].join('\n');
const outPath = resolve(__dirname, '..', 'exported-links.csv');
writeFileSync(outPath, csv, 'utf-8');

console.log(`CSV saved to: ${outPath}`);
