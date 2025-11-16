// Script: reactivate-and-map-images.js
// Usage: node -r dotenv/config scripts/reactivate-and-map-images.js

const supabase = require('../utils/supabase');

async function main() {
  try {
    const updates = [
      // Map DB entries to existing frontend public files
      { slug: 'alaa-ahmed', image: '/alaa.png', is_active: true },
      { slug: 'khaled-habib', image: '/khalid.jpg', is_active: true },
      { slug: 'thamer-alshahrani', image: '/thamir.png', is_active: true }
    ];

    for (const u of updates) {
      console.log('Updating', u.slug, '->', u.image, 'active=', u.is_active);
      const { data, error } = await supabase
        .from('therapists')
        .update({ image: u.image, avatar_url: u.image, is_active: u.is_active })
        .eq('slug', u.slug);

      if (error) {
        console.error('Failed to update', u.slug, error.message || error);
      } else {
        console.log('Updated', u.slug, 'rows:', data ? data.length : 0);
      }
    }

    console.log('Done updates.');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
}

main();
