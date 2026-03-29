// scripts/broad-search.js
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

async function search() {
    console.log('Broad search for IPL in Live/Recent Series...');
    try {
        const r = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live', {
            headers: { 'x-rapidapi-key': KEYS.rapidapi, 'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com' }
        });
        const d = await r.json();
        const sm = d.typeMatches?.flatMap(tm => tm.seriesMatches || []);
        sm?.forEach(s => {
            const sn = s.seriesAdWrapper?.seriesName || '';
            console.log(`- ${sn}`);
            if (sn.toLowerCase().includes('ipl') || sn.toLowerCase().includes('indian') || sn.toLowerCase().includes('premier')) {
                console.log(`   [FOUND!] matches:`, s.seriesAdWrapper?.matches?.map(m => m.matchInfo.team1.teamSName + ' vs ' + m.matchInfo.team2.teamSName));
            }
        });
    } catch (e) { console.log('Failed'); }
}

search();
