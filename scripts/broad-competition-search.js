// scripts/broad-competition-search.js
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

async function search() {
    console.log('Searching for ALL competitions (Full Page Search)...');
    try {
        const r = await fetch(`https://rest.entitysport.com/v2/competitions/?token=${KEY}&per_page=100&status=active`);
        const d = await r.json();
        const items = d.response.items || [];
        items.forEach(c => {
            console.log(`- ${c.title} | ID: ${c.cid} | Date: ${c.datestart}`);
        });
    } catch (e) { console.log('Failed'); }
}

search();
