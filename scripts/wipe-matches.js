// scripts/wipe-matches.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        const parts = line.split('=');
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim();
        env[k] = v;
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function wipe() {
    console.log('--- STARTING HARD RESET ---');
    
    // 1. Delete all predictions
    console.log('Wiping all predictions...');
    const { error: pErr } = await supabase.from('predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (pErr) console.error('Predictions wipe failed:', pErr);

    // 2. Delete all matches (except any that might be needed for the app structure, though unlikely)
    console.log('Wiping all matches...');
    const { error: mErr } = await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (mErr) {
        console.error('Matches wipe failed:', mErr);
    } else {
        console.log('✓ HARD RESET SUCCESSFUL! Tables are empty.');
        console.log('Now updating the sync logic so the re-sync is clean...');
    }
}

wipe();
