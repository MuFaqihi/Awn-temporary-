// Script: deactivate-therapists-without-local-images.js
// Usage: node -r dotenv/config scripts/deactivate-therapists-without-local-images.js --yes

const path = require('path');
const fs = require('fs');
const supabase = require('../utils/supabase');

async function main() {
  try {
    const publicDir = path.resolve(__dirname, '..', '..', 'awn-frontend', 'public');
    console.log('Checking frontend public directory:', publicDir);

    const files = fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : [];
    const fileSet = new Set(files.map(f => f.toLowerCase()));

    const { data: therapists, error } = await supabase.from('therapists').select('*');
    if (error) throw error;

    const toDeactivate = [];

    therapists.forEach(t => {
      const img = (t.avatar_url || t.image || '').toString();
      const basename = img ? path.basename(img).toLowerCase() : '';
      const candidates = new Set();
      if (basename) candidates.add(basename);
      if (t.slug) {
        candidates.add((t.slug + '.jpg').toLowerCase());
        candidates.add((t.slug + '.png').toLowerCase());
      }
      if (t.slug && t.slug.includes('-')) {
        const first = t.slug.split('-')[0];
        candidates.add((first + '.jpg').toLowerCase());
        candidates.add((first + '.png').toLowerCase());
      }

      const hasLocal = [...candidates].some(c => fileSet.has(c));
      if (!hasLocal) toDeactivate.push({ id: t.id, name: t.name_en || t.slug, image: img });
    });

    console.log('Will deactivate (no local image match):', toDeactivate.length);
    toDeactivate.forEach(d => console.log('-', d.name, d.id, d.image));

    if (toDeactivate.length === 0) {
      console.log('No updates needed. Exiting.');
      process.exit(0);
    }

    const confirm = process.argv.includes('--yes');
    if (!confirm) {
      console.log('\nDry run complete. To actually deactivate these therapists, re-run with --yes');
      process.exit(0);
    }

    for (const d of toDeactivate) {
      const { error: updErr } = await supabase.from('therapists').update({ is_active: false }).eq('id', d.id);
      if (updErr) {
        console.error('Failed to deactivate', d.id, updErr.message);
      } else {
        console.log('Deactivated', d.name, d.id);
      }
    }

    console.log('Done.');

  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
