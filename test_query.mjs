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

async function testQuery() {
  const since = new Date();
  since.setDate(since.getDate() - 120);
  const sinceStr = since.toISOString().split('T')[0];
  
  console.log('Querying since:', sinceStr);
  
  // Test the optimized IN query with OR filter
  const start = Date.now();
  const { data: dbRecords, error } = await supabase
    .from('checklist_records')
    .select('*')
    .in('client_id', ['1z314m17t', 'GLOBAL'])
    .or(`date.gte.${sinceStr},date.eq.GLOBAL,module_id.eq.operative-phases-config`);
    
  console.log('Optimized IN query finished in', Date.now() - start, 'ms. Success:', !error, 'Count:', dbRecords?.length);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(dbRecords.slice(0, 5).map(r => ({ id: r.id, date: r.date, client_id: r.client_id })));
  }



}

await testQuery();
process.exit(0);
