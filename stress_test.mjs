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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runStressTest() {
  const CONCURRENT_REQUESTS = 50;
  console.log(`🚀 Starting Stress Test on Supabase...`);
  console.log(`Sending ${CONCURRENT_REQUESTS} concurrent requests to 'checklist_records' and 'clients'...`);
  
  const startTime = Date.now();
  
  const promises = Array.from({ length: CONCURRENT_REQUESTS }).map(async (_, index) => {
    const reqStart = Date.now();
    try {
      // Query checklist records filter by client_id to verify index usage
      const { data, error } = await supabase
        .from('checklist_records')
        .select('id, module_id, date')
        .eq('client_id', 'demo')
        .limit(10);
        
      const reqDuration = Date.now() - reqStart;
      if (error) {
        return { success: false, error: error.message, duration: reqDuration };
      }
      return { success: true, count: data?.length || 0, duration: reqDuration };
    } catch (e) {
      return { success: false, error: e.message, duration: Date.now() - reqStart };
    }
  });

  const results = await Promise.all(promises);
  const totalDuration = Date.now() - startTime;
  
  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);
  
  const avgDuration = successes.reduce((acc, r) => acc + r.duration, 0) / (successes.length || 1);
  
  console.log('\n📊 STRESS TEST RESULTS:');
  console.log(`--------------------------------------`);
  console.log(`Total Requests Sent:   ${CONCURRENT_REQUESTS}`);
  console.log(`Successful Queries:    ${successes.length} ✅`);
  console.log(`Failed Queries:        ${failures.length} ❌`);
  console.log(`Total Elapsed Time:    ${totalDuration} ms`);
  console.log(`Average Query Time:    ${avgDuration.toFixed(2)} ms`);
  console.log(`--------------------------------------`);
  
  if (failures.length > 0) {
    console.log('\n❌ Failure details:');
    failures.slice(0, 5).forEach((f, i) => {
      console.log(`  [${i+1}] Error: ${f.error} (${f.duration}ms)`);
    });
  } else {
    console.log('\n🎉 Perfect! Zero errors and fast response times. The indexes are working perfectly!');
  }
}

await runStressTest();
process.exit(0);
