// scripts/inspect-raw-9241.js
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const KEY = env.RAPIDAPI_KEY;

async function find() {
    console.log('Fetching raw Series 9241 detail from Cricbuzz...');
    try {
        const r = await fetch('https://cricbuzz-cricket.p.rapidapi.com/series/v1/9241', {
            headers: { 'x-rapidapi-key': KEY, 'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com' }
        });
        const d = await r.json();
        console.log(JSON.stringify(d, null, 2).substring(0, 1000));
    } catch (e) { console.log('Failed'); }
}

find();
