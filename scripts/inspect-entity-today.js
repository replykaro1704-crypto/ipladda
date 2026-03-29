// scripts/inspect-entity-today.js
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

async function inspect() {
    console.log('Inspecting all matches today from EntitySport...');
    try {
        const r = await fetch(`https://rest.entitysport.com/v2/matches/?token=${KEY}&per_page=50`);
        const d = await r.json();
        const items = d.response.items || [];
        console.log(`Found ${items.length} total matches.`);
        items.forEach(m => {
            console.log(`Match ${m.match_id}: ${m.teama.short_name} vs ${m.teamb.short_name} | CID: ${m.competition.cid} | Title: ${m.competition.title}`);
        });
    } catch (e) { console.log('Failed'); }
}

inspect();
