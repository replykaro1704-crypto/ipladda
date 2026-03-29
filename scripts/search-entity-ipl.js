// scripts/search-entity-ipl.js
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
    console.log('Searching for IPL 2026 on EntitySport...');
    try {
        const r = await fetch(`https://rest.entitysport.com/v2/competitions/?token=${KEYS.entity}&per_page=100&status=active`);
        const d = await r.json();
        d.response.items?.forEach(c => {
            if (c.title.toLowerCase().includes('ipl') || c.title.toLowerCase().includes('indian')) {
                console.log(`[FOUND] ${c.title} | ID: ${c.cid}`);
            }
        });
    } catch (e) { console.log('Failed'); }
}

search();
