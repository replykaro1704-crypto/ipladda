// scripts/check-pbks-year.js
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

async function check() {
    try {
        const r = await fetch(`https://rest.entitysport.com/v2/matches/60963?token=${KEY}`);
        const d = await r.json();
        console.log(`Match ID 60963: ${d.response.teama.short_name} vs ${d.response.teamb.short_name} | Date: ${d.response.date_start}`);
    } catch (e) { console.log('Failed'); }
}

check();
