import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrbjvisgcrsdbdalpmlw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmp2aXNnY3JzZGJkYWxwbWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzcxODksImV4cCI6MjA4OTUxMzE4OX0.v7lAgk8_0WZcronEAXQnzcIKg-FjktEEQZwTHLXNz2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectMessages() {
  console.log("Inspecting 'messages' table structure...");
  
  // Fetch one row to see column names
  const { data, error } = await supabase.from('messages').select('*').limit(1);
  
  if (error) {
    console.error("Error fetching from 'messages':", error.message);
    if (error.message.includes('does not exist')) {
        console.log("Table 'messages' does NOT exist.");
    }
  } else {
    if (data.length > 0) {
      console.log("Columns found in 'messages' table:");
      console.log(Object.keys(data[0]));
    } else {
      console.log("Table 'messages' is empty. Trying to find columns via RPC or metadata...");
      // In Supabase, we can't easily get schema via JS client without rows or specific RPC
      // But we can try to insert a dummy row with a fake column to see the error message which often lists valid columns
      const { error: insErr } = await supabase.from('messages').insert({ non_existent_column: 'test' });
      if (insErr) {
          console.log("Error message (may contain column names):", insErr.message);
      }
    }
  }
}

await inspectMessages();
process.exit(0);
