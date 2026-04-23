import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrbjvisgcrsdbdalpmlw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmp2aXNnY3JzZGJkYWxwbWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzcxODksImV4cCI6MjA4OTUxMzE4OX0.v7lAgk8_0WZcronEAXQnzcIKg-FjktEEQZwTHLXNz2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectNCs() {
  console.log("Inspecting 'non_conformities' table...");
  const { data, error } = await supabase.from('non_conformities').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No rows in NC table to check columns.");
  }
}

await inspectNCs();
process.exit(0);
