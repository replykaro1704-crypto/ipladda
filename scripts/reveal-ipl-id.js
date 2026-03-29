// scripts/reveal-ipl-id.js
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
    try {
        const r = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming', {
            headers: { 'x-rapidapi-key': KEY, 'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com' }
        });
        const d = await r.json();
        const types = d.typeMatches || [];
        types.forEach(t => {
            const seriesMatches = t.seriesMatches || [];
            seriesMatches.forEach(sm => {
                const s = sm.seriesAdWrapper;
                if (s && (s.seriesName.includes('IPL') || s.seriesName.includes('Indian Premier League'))) {
                     console.log(`[IPL 2026 SERIES ID] ${s.seriesName} | ID: ${s.seriesId}`);
                }
            });
        });
    } catch (e) { console.log('Failed'); }
}

find();
