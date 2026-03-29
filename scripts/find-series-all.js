// scripts/find-series-all.js
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
    console.log('Searching all series in matches feed...');
    try {
        const r = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming', {
            headers: { 'x-rapidapi-key': KEY, 'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com' }
        });
        const d = await r.json();
        const types = d.typeMatches || [];
        types.forEach(t => {
            console.log(`TYPE: ${t.matchType}`);
            const seriesMatches = t.seriesMatches || [];
            seriesMatches.forEach(sm => {
                const s = sm.seriesAdWrapper;
                if (s && s.seriesName.includes('IPL')) {
                     console.log(`[FOUND IPL] ${s.seriesName} | ID: ${s.seriesId}`);
                } else if (s) {
                     console.log(`[OTHER] ${s.seriesName}`);
                }
            });
        });
    } catch (e) { console.log('Failed'); }
}

find();
