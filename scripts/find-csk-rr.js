// scripts/find-csk-rr.js
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
    console.log('Searching for CSK vs RR matches...');
    try {
        // Search across multiple pages of matches
        for (let p = 1; p <= 5; p++) {
            const r = await fetch(`https://rest.entitysport.com/v2/matches/?token=${KEY}&per_page=100&page=${p}`);
            const d = await r.json();
            const items = d.response.items || [];
            items.forEach(m => {
                const teams = `${m.teama.short_name} vs ${m.teamb.short_name}`;
                if ((teams.includes('CSK') && teams.includes('RR')) || (teams.includes('Chennai') && teams.includes('Rajasthan'))) {
                    console.log(`[FOUND] ${teams} | ID: ${m.match_id} | Date: ${m.date_start} | CID: ${m.competition.cid}`);
                }
            });
        }
    } catch (e) { console.log('Failed'); }
}

find();
