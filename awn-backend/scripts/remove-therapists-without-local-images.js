// Script: remove-therapists-without-local-images.js
// Usage: node -r dotenv/config scripts/remove-therapists-without-local-images.js

const path = require('path');
const fs = require('fs');
const supabase = require('../utils/supabase');

async function main() {
  try {
    const publicDir = path.resolve(__dirname, '..', '..', 'awn-frontend', 'public');
    console.log('Checking frontend public directory:', publicDir);

    const files = fs.existsSync(publicDir) ? fs.readdirSync(publicDir) : [];
    const fileSet = new Set(files.map(f => f.toLowerCase()));

    console.log('Found public files:', files.length);

    const { data: therapists, error } = await supabase.from('therapists').select('*');
    if (error) throw error;

    console.log('Therapists in DB:', therapists.length);

    const toDelete = [];

    therapists.forEach(t => {
      const img = (t.avatar_url || t.image || '').toString();
      const basename = img ? path.basename(img).toLowerCase() : '';

      // Try common variants: exact basename, with/without dashes, try replacing hyphenated slugs
      const candidates = new Set();
      if (basename) candidates.add(basename);
      // also try slug-like names
      if (t.slug) {
        candidates.add((t.slug + '.jpg').toLowerCase());
        candidates.add((t.slug + '.png').toLowerCase());
      }
      // try therapist-firstname variations (e.g. khalid vs khaled)
      // (simple heuristic: also try first token of slug)
      if (t.slug && t.slug.includes('-')) {
        const first = t.slug.split('-')[0];
        candidates.add((first + '.jpg').toLowerCase());
        candidates.add((first + '.png').toLowerCase());
      }

      const hasLocal = [...candidates].some(c => fileSet.has(c));

      if (!hasLocal) toDelete.push({ id: t.id, name: t.name_en || t.slug, image: img, candidates: [...candidates] });
    });

    console.log('Will delete (no local image match):', toDelete.length);
    toDelete.forEach(d => console.log('-', d.name, d.id, d.image, d.candidates));

    if (toDelete.length === 0) {
      console.log('No deletions needed. Exiting.');
      process.exit(0);
    }

    // Confirm via prompt (simple yes check)
    const confirm = process.argv.includes('--yes');
    if (!confirm) {
      console.log('\nDry run complete. To actually delete these therapists, re-run with --yes');
      process.exit(0);
    }

    for (const d of toDelete) {
      const { error: delErr } = await supabase.from('therapists').delete().eq('id', d.id);
      if (delErr) {
        console.error('Failed to delete', d.id, delErr.message);
      } else {
        console.log('Deleted', d.name, d.id);
      }
    }

    console.log('Done.');

  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
