// scripts/fetch-season-full.js
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const KEY = env.ENTITY_SPORT_TOKEN;
const IPL_TEAMS = ['RCB', 'MI', 'CSK', 'KKR', 'SRH', 'DC', 'RR', 'GT', 'PBKS', 'LSG', 'KXP', 'KXIP'];

async function fetchSeason() {
    console.log('Fetching FULL SEASON (Apr-June 2026)...');
    try {
        // Query EntitySport for matches in the upcoming few months
        const r = await fetch(`https://rest.entitysport.com/v2/matches/?token=${KEY}&per_page=100&date=2026-03-28_2026-06-01`);
        const d = await r.json();
        const items = d.response.items || [];
        console.log(`Total Matches Scanned: ${items.length}`);
        
        const ipl = items.filter(m => 
            IPL_TEAMS.includes(m.teama.short_name.toUpperCase()) && 
            IPL_TEAMS.includes(m.teamb.short_name.toUpperCase())
        );
        
        console.log(`IPL Matches Found: ${ipl.length}`);
        ipl.slice(0, 5).forEach(m => {
            console.log(`- ${m.teama.short_name} vs ${m.teamb.short_name} | ${m.date_start} | Venue: ${m.venue?.name}`);
        });
    } catch (e) { console.log('Failed:', e.message); }
}

fetchSeason();
