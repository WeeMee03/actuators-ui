import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kzxdrfefddmdggbosrye.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eGRyZmVmZGRtZGdnYm9zcnllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMzI1NTksImV4cCI6MjA2NjkwODU1OX0.jIlyx-b9Ly3ReD-_1cd9CrjDcvaBlvCEe2-oE9O5EWc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);