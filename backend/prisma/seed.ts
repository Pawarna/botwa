import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || ''; 

// We MUST use the service_role key from .env to use the admin API
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('Seeding 2 test accounts via Supabase Admin API...');

    const accounts = [
        { email: 'admin1@wabot.pro', password: 'password123' },
        { email: 'admin2@wabot.pro', password: 'password123' }
    ];

    for (const acc of accounts) {
        // admin.createUser bypasses email verification if email_confirm: true
        const { data, error } = await supabase.auth.admin.createUser({
            email: acc.email,
            password: acc.password,
            email_confirm: true
        });

        if (error) {
            if (error.message.includes('already has been registered') || error.message.includes('already exists')) {
                console.log(`User ${acc.email} already exists. Skipping.`);
            } else {
                console.error(`Error creating ${acc.email}:`, error.message);
            }
        } else {
            console.log(`Successfully created user: ${acc.email} (ID: ${data.user.id})`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
