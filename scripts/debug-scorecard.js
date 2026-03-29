// scripts/debug-scorecard.js
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

async function debug() {
    const ID = '149618';
    console.log(`Checking scorecard for ID ${ID}...`);
    try {
        const url = `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${ID}/hscard`;
        const r = await fetch(url, {
            headers: {
                'x-rapidapi-key': KEYS.rapidapi,
                'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com'
            }
        });
        const d = await r.json();
        console.log('Response Keys:', Object.keys(d));
        if (d.matchHeader) {
            console.log('Match Header:', {
                status: d.matchHeader.status,
                complete: d.matchHeader.complete,
                result: d.matchHeader.result
            });
        } else {
            console.log('No Match Header found in response!');
            console.log('Full JSON (truncated):', JSON.stringify(d).slice(0, 500));
        }
    } catch (e) { console.error('Failed:', e.message); }
}

debug();
