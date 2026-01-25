
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cuctnnsgvxhomxobpchi.supabase.co';
const supabaseKey = 'sb_publishable_KOnkK69_i28bg2KR5AYdcA_5uu4IutT';

// Note: In a real app, these would be in env vars, 
// but provided directly here as per request.
export const supabase = createClient(supabaseUrl, supabaseKey);
