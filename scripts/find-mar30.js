// scripts/find-mar30.js
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

async function find() {
    console.log('Searching for any match on Mar 30 (historical 2023/24)...');
    try {
        const matches = [];
        for (let p = 1; p <= 5; p++) {
            const r = await fetch(`https://rest.entitysport.com/v2/matches/?token=${KEY}&per_page=100&page=${p}`);
            const d = await r.json();
            const items = d.response.items || [];
            items.forEach(m => {
               if (m.date_start.includes('-03-30')) {
                   console.log(`[FOUND ON MAR 30] ${m.teama.short_name} vs ${m.teamb.short_name} | Date: ${m.date_start} | COMPETITION: ${m.competition.title}`);
               }
            });
        }
    } catch (e) { console.log('Failed'); }
}

find();
