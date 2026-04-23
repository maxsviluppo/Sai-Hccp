import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrbjvisgcrsdbdalpmlw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmp2aXNnY3JzZGJkYWxwbWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzcxODksImV4cCI6MjA4OTUxMzE4OX0.v7lAgk8_0WZcronEAXQnzcIKg-FjktEEQZwTHLXNz2w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkColumns() {
  const { data, error } = await supabase.from('messages').select('*').limit(1);
  if (data && data.length > 0) {
    console.log("Detailed Columns:", Object.keys(data[0]));
  } else {
    // Try to insert with all possible names to see what fails
    const testMsg = {
        id: 'test_diag_' + Date.now(),
        senderId: 'test',
        senderName: 'test',
        recipientType: 'ALL',
        subject: 'test',
        content: 'test',
        timestamp: new Date().toISOString(),
        read: false,
        fileData: 'test'
    };
    const { error: err } = await supabase.from('messages').insert(testMsg);
    if (err) {
        console.log("Insert failed with camelCase. Error:", err.message);
        if (err.message.includes('fileData')) {
            console.log("Confirming: 'fileData' column is MISSING.");
        }
    } else {
        console.log("Insert SUCCEEDED with camelCase (including fileData).");
        await supabase.from('messages').delete().eq('id', testMsg.id);
    }
  }
}

await checkColumns();
process.exit(0);
