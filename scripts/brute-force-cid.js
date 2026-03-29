// scripts/brute-force-cid.js
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const KEY = env.ENTITY_SPORT_TOKEN;

async function brute() {
    console.log('Search for current/future IPL seasons...');
    for (let p = 1; p <= 3; p++) {
        try {
            const r = await fetch(`https://rest.entitysport.com/v2/competitions/?token=${KEY}&per_page=100&page=${p}&status=active`);
            const d = await r.json();
            d.response.items?.forEach(c => {
               if (c.category === 'cricket' && c.title.toLowerCase().includes('premier league')) {
                   console.log(`[CID] ${c.title} | ID: ${c.cid} | Seasons: ${c.seasons}`);
               }
            });
        } catch (e) {}
    }
}

brute();
