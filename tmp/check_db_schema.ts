
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://xrbjvisgcrsdbdalpmlw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmp2aXNnY3JzZGJkYWxwbWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzcxODksImV4cCI6MjA4OTUxMzE4OX0.v7lAgk8_0WZcronEAXQnzcIKg-FjktEEQZwTHLXNz2w');

async function checkColumns() {
    try {
        const { data, error } = await supabase.from('clients').select('*').limit(1);
        if (error) {
            console.error('Error fetching clients:', error);
            return;
        }
        if (data && data.length > 0) {
            console.log('Available columns in clients table:', Object.keys(data[0]));
        } else {
            console.log('Table is empty, trying dummy select...');
        }
    } catch (e) {
        console.error('Query failed:', e);
    }
}

checkColumns();
