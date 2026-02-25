import { createClient } from '@supabase/supabase-js';
import { config } from '../utils/config.js';

/**
 * Shared Supabase client singleton.
 * All services import from here instead of creating their own instances.
 */
export const supabase = createClient(config.supabaseUrl, config.supabaseKey);
