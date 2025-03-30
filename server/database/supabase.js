const { createClient } = require(`@supabase/supabase-js`);
require(`dotenv`).config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY)
    throw new Error(`Missing SUPABASE_URL or SUPABASE_KEY environment variables`);

const SUPABASE_URL = process.env.NODE_ENV === `production`
    ? process.env.SUPABASE_URL_INTERNAL
    : process.env.SUPABASE_URL;

console.log(SUPABASE_URL)

const supabase = createClient(
    SUPABASE_URL,
    process.env.SUPABASE_KEY,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            storage: {
                getItem: key => null,
                setItem: (key, value) => {},
                removeItem: key => {}
            }
        }
    }
);

const externalSupabase = process.env.NODE_ENV === `production`
    ? createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY,
        {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storage: {
                    getItem: key => null,
                    setItem: (key, value) => {},
                    removeItem: key => {}
                }
            }
        }
    )
    : null;

module.exports = supabase, externalSupabase;
