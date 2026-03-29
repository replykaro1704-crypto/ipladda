// scripts/fetch-ipl-full.js
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const KEYS = { entity: env.ENTITY_SPORT_TOKEN };

async function fetchFull() {
    const ID = '127579';
    console.log(`Fetching FULL schedule for IPL 2026 (ID ${ID})...`);
    try {
        const r = await fetch(`https://rest.entitysport.com/v2/competitions/${ID}/matches/?token=${KEYS.entity}&per_page=100`);
        const d = await r.json();
        const items = d.response.items || [];
        console.log(`Total Matches Found: ${items.length}`);
        items.slice(0, 5).forEach(m => {
            console.log(`- Match ${m.match_id}: ${m.teama.short_name} vs ${m.teamb.short_name} | ${m.date_start} | Status: ${m.status_str}`);
        });
    } catch (e) { console.log('Failed:', e.message); }
}

fetchFull();
