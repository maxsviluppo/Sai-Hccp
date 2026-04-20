import fetch from 'node-fetch';

async function checkColumns() {
    try {
        const url = 'https://xrbjvisgcrsdbdalpmlw.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmp2aXNnY3JzZGJkYWxwbWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzcxODksImV4cCI6MjA4OTUxMzE4OX0.v7lAgk8_0WZcronEAXQnzcIKg-FjktEEQZwTHLXNz2w';
        const res = await fetch(url);
        const swagger = await res.json();
        
        const table = swagger.definitions ? swagger.definitions['production_records'] : null;
        if (table) {
            console.log('Columns in production_records:', Object.keys(table.properties));
        } else {
            console.log('Error object:', JSON.stringify(swagger, null, 2));
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

checkColumns();
