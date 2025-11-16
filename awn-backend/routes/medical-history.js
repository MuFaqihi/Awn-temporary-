const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticateToken } = require('../utils/jwt');

// GET /api/medical-history - return saved history for authenticated patient
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?.patient_id || req.user?.national_id || null;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // Prefer medical_histories table (structured), fallback to patients.medical_history column
    try {
      const { data, error } = await supabase
        .from('medical_histories')
        .select('data, updated_at')
        .eq('patient_id', userId)
        .single();

      if (!error && data) {
        return res.json({ success: true, data: data.data || null, updated_at: data.updated_at || null });
      }
    } catch (e) {
      // Continue to fallback
      console.warn('medical_histories table lookup failed, falling back to patients table:', e?.message || e);
    }

    // Fallback: read full patient row and look for medical_notes or medical_history conservatively
    try {
      const { data: patientRow, error: pErr } = await supabase
        .from('patients')
        .select('*')
        .eq('id', userId)
        .single();

      if (pErr) {
        console.error('Fallback query error for patients row:', pErr?.message || pErr);
        return res.status(500).json({ success: false, error: 'Unable to fetch medical history' });
      }

      const raw = patientRow ? (patientRow.medical_history ?? patientRow.medical_notes ?? null) : null;
      let parsed = null;
      try { parsed = raw && typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (pe) { parsed = raw; }
      return res.json({ success: true, data: parsed || null, updated_at: patientRow?.updated_at || null });
    } catch (e) {
      console.error('Unexpected fallback error GET /api/medical-history', e);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  } catch (err) {
    console.error('Unexpected error in GET /api/medical-history', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/medical-history - save or replace medical history for authenticated patient
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?.patient_id || req.user?.national_id || null;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const payload = req.body || {};

    // Try upsert into medical_histories table (preferred)
    try {
      const { data, error } = await supabase
        .from('medical_histories')
        .upsert([
          {
            patient_id: userId,
            data: payload,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'patient_id' })
        .select()
        .single();

      if (!error && data) {
        return res.json({ success: true, data: data.data || payload, updated_at: data.updated_at || new Date().toISOString() });
      }
    } catch (e) {
      console.warn('Upsert to medical_histories failed, will try fallback to patients table:', e?.message || e);
    }

    // Fallback: update patients.medical_notes (string) or medical_history
    try {
      const store = { medical_notes: JSON.stringify(payload), updated_at: new Date().toISOString() };
      const { data, error } = await supabase
        .from('patients')
        .update(store)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Fallback update to patients.medical_notes failed:', error?.message || error);
        return res.status(500).json({ success: false, error: 'Failed to save medical history' });
      }

      let parsed = payload;
      try { parsed = data?.medical_history ?? (data?.medical_notes ? JSON.parse(data.medical_notes) : payload); } catch (pe) { parsed = payload; }
      return res.json({ success: true, data: parsed, updated_at: data?.updated_at || new Date().toISOString() });
    } catch (e) {
      console.error('Unexpected fallback error saving medical history:', e);
      return res.status(500).json({ success: false, error: 'Failed to save medical history' });
    }
  } catch (err) {
    console.error('Unexpected error in PUT /api/medical-history', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
