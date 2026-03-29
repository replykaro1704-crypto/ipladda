// scripts/final-fix-match1.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
    const MATCH_ID = 'b4391722-63fd-42a0-8c7b-1c4c180a8772';
    const API_ID = '149618'; // Found via find-match-id.js

    console.log(`Fixing Match #1 (RCB vs SRH) with ID ${API_ID}...`);
    
    const { data, error } = await supabase
        .from('matches')
        .update({ 
            ext_rapidapi_id: API_ID,
            status: 'completed' // Force it to completed so the result fetcher picks it up
        })
        .eq('id', MATCH_ID);

    if (error) {
        console.error('Update failed:', error);
    } else {
        console.log('Update Successful! Match #1 now has the correct API connection.');
        console.log('Now trigger the Sync URL in your browser to fetch the results!');
    }
}

fix();
