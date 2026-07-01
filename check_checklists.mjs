import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename);
  if (!fs.existsSync(filePath)) return {};
  const vars = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const env = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local'), ...process.env };
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkChecklists() {
  const { data, error } = await supabase.from('checklist_records').select('id, module_id, date, client_id, user_id, timestamp').limit(20);
  if (error) {
    console.error('Error fetching checklist records:', error);
  } else {
    console.log('--- Checklist Records in Database ---');
    console.table(data);
  }
}

await checkChecklists();
process.exit(0);
