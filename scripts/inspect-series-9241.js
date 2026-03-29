// scripts/inspect-series-9241.js
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
    console.log('Inspecting all matches in Series 9241 (Cricbuzz IPL 2026)...');
    try {
        const r = await fetch('https://cricbuzz-cricket.p.rapidapi.com/series/v1/9241', {
            headers: { 'x-rapidapi-key': KEY, 'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com' }
        });
        const d = await r.json();
        const matches = d.matchDetails || [];
        matches.forEach(md => {
            const m = md.adMatch?.matchInfo;
            if (m) {
                const date = new Date(parseInt(m.startDate)).toDateString();
                console.log(`[MATCH] ${m.team1.teamName} vs ${m.team2.teamName} | Date: ${date} | ID: ${m.matchId}`);
            }
        });
    } catch (e) { console.log('Failed'); }
}

find();
