// scripts/find-rr-mar30.js
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
    console.log('Searching for ANY Rajasthan Royals (RR) match near today...');
    try {
        const r = await fetch(`https://rest.entitysport.com/v2/matches/?token=${KEY}&status=1&per_page=100`);
        const d = await r.json();
        const items = d.response.items || [];
        items.forEach(m => {
            const teams = `${m.teama.name} vs ${m.teamb.name}`;
            if (teams.includes('Rajasthan') || teams.includes('RR')) {
                console.log(`[FOUND RR] ${teams} | Date: ${m.date_start} | ID: ${m.match_id}`);
            }
        });
    } catch (e) { console.log('Failed'); }
}

find();
