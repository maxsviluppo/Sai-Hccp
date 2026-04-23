import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrbjvisgcrsdbdalpmlw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmp2aXNnY3JzZGJkYWxwbWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzcxODksImV4cCI6MjA4OTUxMzE4OX0.v7lAgk8_0WZcronEAXQnzcIKg-FjktEEQZwTHLXNz2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkClients() {
  console.log("Checking Clients...");
  const { data: clients, error: err } = await supabase.from('clients').select('*');
  if (err) console.error(err.message);
  else console.table(clients.map(c => ({ id: c.id, name: c.name })));
}

await checkClients();
process.exit(0);
