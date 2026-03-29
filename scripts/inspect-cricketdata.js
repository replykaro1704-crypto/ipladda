// scripts/inspect-cricketdata.js
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const KEY = env.CRICKETDATA_API_KEY;

async function inspect() {
    console.log('Inspecting CricketData full response...');
    try {
        const r = await fetch(`https://api.cricketdata.org/v1/currentMatches?apikey=${KEY}`);
        const d = await r.json();
        const matches = d.data || [];
        console.log(`Matches found: ${matches.length}`);
        matches.forEach(m => {
            console.log(`- ${m.name} | Series: ${m.series_id} | Time: ${m.dateTimeGMT}`);
            if (m.name.toLowerCase().includes('mi') || m.name.toLowerCase().includes('csk') || m.name.toLowerCase().includes('srh')) {
                console.log(`   [POTENTIAL IPL]`);
            }
        });
    } catch (e) { console.log('Failed'); }
}

inspect();
