// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://aocjoukjdsoynvbuzvas.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvY2pvdWtqZHNveW52YnV6dmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NTEyMDksImV4cCI6MjA1MjUyNzIwOX0.UIJxp9sUWb2Fk6QGvvLtcZmp_naNykmYF2xtWYw_xbQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);