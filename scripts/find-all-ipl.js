// scripts/find-all-ipl.js
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
    console.log('Searching for any and all IPL competition IDs...');
    try {
        const r = await fetch(`https://rest.entitysport.com/v2/competitions/?token=${KEY}&status=2&per_page=100`);
        const d = await r.json();
        const items = d.response.items || [];
        items.forEach(c => {
           if (c.title.includes('Indian Premier League') || c.title.includes('IPL')) {
               console.log(`[IPL FOUND] ${c.title} | CID: ${c.cid} | Season: ${c.season}`);
           }
        });
    } catch (e) { console.log('Failed'); }
}

find();
