import { createClient } from '@supabase/supabase-js';

// TODO: Sostituire con le credenziali reali del progetto HACCP PRO
const supabaseUrl = 'https://xrbjvisgcrsdbdalpmlw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhyYmp2aXNnY3JzZGJkYWxwbWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzcxODksImV4cCI6MjA4OTUxMzE4OX0.v7lAgk8_0WZcronEAXQnzcIKg-FjktEEQZwTHLXNz2w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
