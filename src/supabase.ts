import { createClient } from '@supabase/supabase-js';

// TODO: Sostituire con le credenziali reali del progetto HACCP PRO
const supabaseUrl = 'https://PLACEHOLDER.supabase.co';
const supabaseAnonKey = 'PLACEHOLDER_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
