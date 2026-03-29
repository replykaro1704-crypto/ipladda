// scripts/find-match-id.js
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const KEYS = { rapidapi: env.RAPIDAPI_KEY };

async function find() {
    console.log('Searching for RCB vs SRH from March 28...');
    try {
        const r = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/recent', {
            headers: {
                'x-rapidapi-key': KEYS.rapidapi,
                'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
            }
        });
        const d = await r.json();
        const typeMatches = d.typeMatches || [];
        for (const tm of typeMatches) {
            for (const sm of tm.seriesMatches || []) {
                for (const m of sm.seriesAdWrapper?.matches || []) {
                    const info = m.matchInfo;
                    if (info.team1.teamSName.includes('RCB') || info.team1.teamSName.includes('SRH')) {
                        console.log(`[MATCH FOUND] ${info.team1.teamSName} vs ${info.team2.teamSName} | ID: ${info.matchId} | Desc: ${info.matchDesc}`);
                    }
                }
            }
        }
    } catch (e) { console.error('Failed:', e.message); }
}

find();
