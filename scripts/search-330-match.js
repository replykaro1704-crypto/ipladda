// scripts/search-330-match.js
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const KEYS = { 
    cricketdata: env.CRICKETDATA_API_KEY,
    rapidapi: env.RAPIDAPI_KEY,
    entity: env.ENTITY_SPORT_TOKEN
};

async function search() {
    console.log('Searching for 3:30 PM Match (Today, Mar 29)...');

    // 1. EntitySport (Competition Schedule)
    try {
        const r = await fetch(`https://rest.entitysport.com/v2/competitions/127116/matches/?token=${KEYS.entity}&per_page=10`);
        const d = await r.json();
        console.log('[EntitySport] Matches today:', d.response.items?.map(m => `${m.teama.short_name} vs ${m.teamb.short_name} @ ${m.date_start}`));
    } catch (e) { console.log('Entity failed'); }

    // 2. RapidAPI (Cricbuzz Live)
    try {
        const r = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live', {
            headers: { 'x-rapidapi-key': KEYS.rapidapi, 'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com' }
        });
        const d = await r.json();
        const sm = d.typeMatches?.flatMap(tm => tm.seriesMatches || []);
        sm?.forEach(s => {
            const sn = s.seriesAdWrapper?.seriesName || '';
            console.log(`[RapidAPI] Series: ${sn}`);
            s.seriesAdWrapper?.matches?.forEach(m => {
                console.log(`   - ${m.matchInfo.team1.teamSName} vs ${m.matchInfo.team2.teamSName} @ ${m.matchInfo.startDate}`);
            });
        });
    } catch (e) { console.log('RapidAPI failed'); }
}

search();
