// scripts/cleanup-duplicates.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        const parts = line.split('=');
        const k = parts[0].trim();
        const v = parts.slice(1).join('=').trim();
        env[k] = v;
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function clean() {
    console.log('--- STARTING DEDUPLICATION ---');
    
    // 1. Get all matches
    const { data: matches, error: fetchErr } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (fetchErr) {
        console.error('Fetch failed:', fetchErr);
        return;
    }

    const seen = new Map();
    const toDelete = [];

    for (const m of matches) {
        // Sort teams to ensure order-independent matching (e.g., RCB vs SRH == SRH vs RCB)
        const sortedTeams = [m.team_home, m.team_away].sort();
        const matchKey = `${sortedTeams[0]}_vs_${sortedTeams[1]}_#${m.match_number || 0}`.toLowerCase();
        
        if (seen.has(matchKey)) {
            const existing = seen.get(matchKey);
            // Keep the one with actual results or IDs
            if ((!existing.result_winner && m.result_winner) || (!existing.ext_rapidapi_id && m.ext_rapidapi_id)) {
                toDelete.push(existing.id);
                seen.set(matchKey, m);
            } else {
                toDelete.push(m.id);
            }
        } else {
            seen.set(matchKey, m);
        }
    }

    if (toDelete.length > 0) {
        console.log(`Found ${toDelete.length} duplicate(s). Deleting now...`);
        const { error: delErr } = await supabase.from('matches').delete().in('id', toDelete);
        if (delErr) console.error('Delete failed:', delErr);
        else console.log(`✓ DELETED duplicates: ${toDelete.join(', ')}`);
    } else {
        console.log('✓ Everything set! No duplicates found.');
    }
}

clean();
