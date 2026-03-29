// scripts/node-api-test.js
const fs = require('fs');
const path = require('path');

// 1. SIMPLE ENV LOADER
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

console.log('--- STARTING TERMINAL DIAGNOSTIC ---');
console.log('Keys found:', {
    cricketdata: !!KEYS.cricketdata,
    rapidapi: !!KEYS.rapidapi,
    entity: !!KEYS.entity
});

async function runTests() {
    // A. TEST CRICKETDATA (Discovery)
    console.log('\n[1] Testing CricketData (Discovery)...');
    try {
        const url = `https://api.cricapi.com/v1/currentMatches?apikey=${KEYS.cricketdata}`;
        const r = await fetch(url);
        const d = await r.json();
        console.log('Status:', d.status);
        if (d.data) {
           console.log('Matches found:', d.data.length);
           const ipl = d.data.filter(m => m.name.toLowerCase().includes('ipl') || m.seriesName?.toLowerCase().includes('ipl'));
           console.log('IPL Matches:', ipl.length);
           if (ipl[0]) console.log('Sample Match:', ipl[0].name, 'Status:', ipl[0].status);
        }
    } catch (e) { console.error('CricketData Failed:', e.message); }

    // B. TEST RAPIDAPI (Cricbuzz)
    console.log('\n[2] Testing RapidAPI (Live Matches)...');
    try {
        const r = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live', {
            headers: {
                'x-rapidapi-key': KEYS.rapidapi,
                'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
            }
        });
        const d = await r.json();
        console.log('Response Status:', d.typeMatches ? 'OK' : 'Error');
        if (d.typeMatches) {
            const count = d.typeMatches.reduce((acc, tm) => acc + (tm.seriesMatches?.length || 0), 0);
            console.log('Live Series found:', count);
        }
    } catch (e) { console.error('RapidAPI Failed:', e.message); }

    // C. TEST ENTITYSPORT
    console.log('\n[3] Testing EntitySport...');
    try {
        const url = `https://restapi.entitysport.com/v2/matches/?token=${KEYS.entity}&status=1`;
        const r = await fetch(url);
        const d = await r.json();
        console.log('Status:', d.status);
        if (d.response && d.response.items) {
           console.log('Live items found:', d.response.items.length);
        }
    } catch (e) { console.error('EntitySport Failed:', e.message); }

    console.log('\n--- DIAGNOSTIC COMPLETE ---');
}

runTests();
