// scripts/debug-db.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ENV LOADER
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runDebug() {
    console.log('--- SUPABASE DEBUG ---');
    const { data: matches, error } = await supabase
        .from('matches')
        .select('*');

    if (error) {
        console.error('Error fetching matches:', error);
        return;
    }

    console.log(`Total Matches Found: ${matches.length}`);
    matches.forEach(m => {
        console.log(`[ID: ${m.id}] ${m.team_home} vs ${m.team_away} | Status: ${m.status} | ID: ${m.ext_rapidapi_id || 'NULL'}`);
    });
}

runDebug();
