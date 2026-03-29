// scripts/find-series-from-match.js
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
    console.log('Fetching MI vs KKR detail to find Series ID...');
    try {
        // Fetch upcoming matches to get any current match ID
        const r = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming', {
            headers: { 'x-rapidapi-key': KEY, 'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com' }
        });
        const d = await r.json();
        const first = d.typeMatches?.[0]?.seriesMatches?.[0]?.seriesAdWrapper?.matches?.[0]?.matchInfo;
        if (first) {
            console.log(`[SERIES INFO] ${first.seriesName} | ID: ${first.seriesId}`);
        } else {
             console.log('No matches found in upcoming list.');
        }
    } catch (e) { console.log('Failed'); }
}

find();
