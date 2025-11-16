// routes/favorites.js - secured and integrated with supabase client
const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticateToken } = require('../utils/jwt');

// GET /api/favorites - list favorites for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || null;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized - patient id required' });
    }

    // Fetch favorites for this patient id
    const { data, error } = await supabase
      .from('favorites')
      .select('id, therapist_id, created_at')
      .eq('patient_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching favorites:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('Unexpected error in GET /api/favorites', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/favorites - add or remove favorite for authenticated user
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || null;
    const { therapistId, action } = req.body;

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized - patient id required' });
    if (!therapistId) return res.status(400).json({ success: false, error: 'therapistId required' });

    if (action === 'add') {
      // Resolve therapistId: accept either UUID or slug
      let resolvedTherapistId = therapistId;
      const uuidRegex = /^[0-9a-fA-F-]{36}$/;
      if (!uuidRegex.test(String(therapistId))) {
        const { data: trow, error: terr } = await supabase.from('therapists').select('id').eq('slug', therapistId).single();
        if (terr || !trow) {
          console.error('Therapist slug not found for favorites:', therapistId, terr);
          return res.status(400).json({ success: false, error: 'Therapist not found' });
        }
        resolvedTherapistId = trow.id;
      }

      const insertRow = {
        therapist_id: resolvedTherapistId,
        patient_id: userId,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('favorites')
        .insert(insertRow)
        .select()
        .single();

      if (error) {
        console.error('Error adding favorite:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, data, message: 'Added to favorites' });
    }

    if (action === 'remove') {
      // Resolve therapistId (slug -> uuid) if needed
      let resolvedTherapistId = therapistId;
      const uuidRegex = /^[0-9a-fA-F-]{36}$/;
      if (!uuidRegex.test(String(therapistId))) {
        const { data: trow, error: terr } = await supabase.from('therapists').select('id').eq('slug', therapistId).single();
        if (terr || !trow) {
          console.error('Therapist slug not found for favorites removal:', therapistId, terr);
          return res.status(400).json({ success: false, error: 'Therapist not found' });
        }
        resolvedTherapistId = trow.id;
      }

      const { data, error } = await supabase
        .from('favorites')
        .delete()
        .eq('therapist_id', resolvedTherapistId)
        .eq('patient_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error removing favorite:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, data, message: 'Removed from favorites' });
    }

    return res.status(400).json({ success: false, error: 'action must be add or remove' });
  } catch (err) {
    console.error('Unexpected error in POST /api/favorites', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;