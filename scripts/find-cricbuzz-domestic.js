// scripts/find-cricbuzz-domestic.js
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
    console.log('Searching for IPL 2026 Series on Cricbuzz (Domestic)...');
    try {
        const r = await fetch('https://cricbuzz-cricket.p.rapidapi.com/series/v1/list/domestic', {
            headers: { 'x-rapidapi-key': KEY, 'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com' }
        });
        const d = await r.json();
        const items = d.seriesMapProto || [];
        items.forEach(map => {
            const series = map.series || [];
            series.forEach(s => {
                if (s.name.includes('IPL') || s.name.includes('Indian Premier League')) {
                    console.log(`[FOUND] ${s.name} | ID: ${s.id}`);
                }
            });
        });
    } catch (e) { console.log('Failed'); }
}

find();
