// scripts/find-ipl-2026-id.js
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

async function search() {
    console.log('Searching for "2026" competitions on EntitySport...');
    try {
        const r = await fetch(`https://rest.entitysport.com/v2/competitions/?token=${KEYS.entity}&per_page=100&status=active`);
        const d = await r.json();
        d.response.items?.forEach(c => {
            if (c.title.includes('2026') || c.title.toLowerCase().includes('ipl')) {
                console.log(`[COMPETITION] ${c.title} | ID: ${c.cid}`);
            }
        });
    } catch (e) { console.log('Failed'); }
}

search();
