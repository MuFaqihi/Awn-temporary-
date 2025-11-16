const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

// GET /api/settings - get current user's settings/profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.patient_id || req.user?.national_id || null;
    const email = req.user?.email || null;

    if (!userId && !email) return res.status(401).json({ success: false, error: 'Unauthorized' });

    // Prefer querying by primary `id` (UUID), then fall back to national_id, then email
    // Try selecting all columns first (supabase '*' is tolerant); if that errors (rare), fall back to a safe subset
    let data, error;
    try {
      if (userId) {
        ({ data, error } = await supabase.from('patients').select('*').eq('id', userId).single());
        if ((error || !data) && userId) {
          ({ data, error } = await supabase.from('patients').select('*').eq('national_id', userId).single());
        }
      } else {
        ({ data, error } = await supabase.from('patients').select('*').eq('email', String(email).toLowerCase()).single());
      }
    } catch (e) {
      const safeCols = 'id,national_id,first_name,last_name,email,phone,gender,created_at,updated_at';
      if (userId) {
        ({ data, error } = await supabase.from('patients').select(safeCols).eq('id', userId).single());
        if ((error || !data) && userId) {
          ({ data, error } = await supabase.from('patients').select(safeCols).eq('national_id', userId).single());
        }
      } else {
        ({ data, error } = await supabase.from('patients').select(safeCols).eq('email', String(email).toLowerCase()).single());
      }
    }

    if (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ success: false, error: error.message || 'Failed to fetch settings' });
    }

    // If the row contains `medical_notes` (JSON string), merge it into the returned object
    try {
      if (data && data.medical_notes) {
        let notes = {};
        try { notes = typeof data.medical_notes === 'string' ? JSON.parse(data.medical_notes) : data.medical_notes; } catch (e) { notes = {}; }
        // Merge notes keys without overwriting existing patient columns that are present
        for (const k of Object.keys(notes)) {
          if (data[k] === undefined || data[k] === null || data[k] === '') data[k] = notes[k];
        }
      }
    } catch (mergeErr) {
      console.warn('Failed to merge medical_notes into settings response', mergeErr);
    }

    res.json({ success: true, data: data || {} });
  } catch (err) {
    console.error('Unexpected error in GET /api/settings', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /api/settings - update profile/settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.patient_id || req.user?.national_id || null;
    const email = req.user?.email || null;
    if (!userId && !email) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const payload = {};
    // Accept common profile fields from frontend. Backend will only copy these keys.
    const allowed = [
      'first_name','last_name','phone','gender',
      'address','city','national_id','date_of_birth','marital_status',
      'notification_email','notification_sms','allow_history_access'
    ];
    for (const k of allowed) {
      if (req.body[k] !== undefined) payload[k] = req.body[k];
    }

    if (Object.keys(payload).length === 0) return res.status(400).json({ success: false, error: 'No valid fields to update' });

    // Try updating by id first, then national_id, then email
    let data, error;
    try {
      // Fetch the current row for the user so we only update columns that actually exist
      let currentRow = null;
      try {
        if (userId) {
          const r = await supabase.from('patients').select('*').eq('id', userId).single();
          currentRow = r.data || null;
          if (!currentRow) {
            const r2 = await supabase.from('patients').select('*').eq('national_id', userId).single();
            currentRow = r2.data || null;
          }
        } else {
          const r = await supabase.from('patients').select('*').eq('email', email).single();
          currentRow = r.data || null;
        }
      } catch (fetchErr) {
        console.warn('Could not fetch current patient row for allowed columns check, proceeding with best-effort update', fetchErr?.message || fetchErr);
      }

      // If we have the current `currentRow`, only attempt to update columns that exist
      const allowedUpdatePayload = {};
      const missingKeys = [];
      if (currentRow && typeof currentRow === 'object') {
        const existingKeys = new Set(Object.keys(currentRow));
        for (const k of Object.keys(payload)) {
          if (existingKeys.has(k)) allowedUpdatePayload[k] = payload[k];
          else missingKeys.push(k);
        }
      } else {
        Object.assign(allowedUpdatePayload, payload);
      }

      if (userId) {
        ({ data, error } = await supabase.from('patients').update(allowedUpdatePayload).eq('id', userId).select('*').single());
        if ((error || !data) && userId) {
          ({ data, error } = await supabase.from('patients').update(allowedUpdatePayload).eq('national_id', userId).select('*').single());
        }
      } else {
        ({ data, error } = await supabase.from('patients').update(allowedUpdatePayload).eq('email', email).select('*').single());
      }
    } catch (e) {
      console.error('Error updating settings:', e);
      return res.status(500).json({ success: false, error: e.message || 'Failed to update settings' });
    }

    if (error) {
      console.error('Error updating settings:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    // If there were payload keys that aren't actual columns, persist them into `medical_notes` JSON
    try {
      if (currentRow && Array.isArray(missingKeys) && missingKeys.length > 0) {
        // read existing notes
        let notes = {};
        try { notes = currentRow.medical_notes ? JSON.parse(currentRow.medical_notes) : {}; } catch (e) { notes = {} }
        let didChange = false;
        for (const k of missingKeys) {
          if (payload[k] !== undefined) {
            notes[k] = payload[k];
            didChange = true;
          }
        }
        if (didChange) {
          // update medical_notes
          let up;
          if (userId) {
            up = await supabase.from('patients').update({ medical_notes: JSON.stringify(notes) }).eq('id', userId).select('*').single();
            if ((up.error || !up.data) && userId) {
              up = await supabase.from('patients').update({ medical_notes: JSON.stringify(notes) }).eq('national_id', userId).select('*').single();
            }
          } else {
            up = await supabase.from('patients').update({ medical_notes: JSON.stringify(notes) }).eq('email', email).select('*').single();
          }
          if (up && up.error) console.warn('Failed to persist fallback medical_notes', up.error);
          // prefer to return the most recent updated row
          data = up && up.data ? up.data : data;
        }
      }
    } catch (fallbackErr) {
      console.warn('Failed to persist fallback fields into medical_notes', fallbackErr);
    }

    // If medical_notes exists on the returned row, merge it for client convenience
    try {
      if (data && data.medical_notes) {
        let notes = {};
        try { notes = typeof data.medical_notes === 'string' ? JSON.parse(data.medical_notes) : data.medical_notes; } catch (e) { notes = {}; }
        for (const k of Object.keys(notes)) {
          if (data[k] === undefined || data[k] === null || data[k] === '') data[k] = notes[k];
        }
      }
    } catch (mergeErr) {
      console.warn('Failed to merge medical_notes into updated settings response', mergeErr);
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('Unexpected error in PUT /api/settings', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/settings/change-password - change current user's password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?.patient_id || req.user?.national_id || null;
    const email = req.user?.email || null;
    if (!userId && !email) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, error: 'currentPassword and newPassword required' });

    // Fetch user by id first, then national_id, then email
    let user = null;
    let fetchErr = null;
    if (userId) {
      try {
        const r1 = await supabase.from('patients').select('*').eq('id', userId).single();
        user = r1.data; fetchErr = r1.error;
        if ((fetchErr || !user)) {
          const r2 = await supabase.from('patients').select('*').eq('national_id', userId).single();
          user = r2.data; fetchErr = r2.error;
        }
      } catch (e) {
        fetchErr = e;
      }
    } else {
      const r = await supabase.from('patients').select('*').eq('email', String(email).toLowerCase()).single();
      user = r.data; fetchErr = r.error;
    }
    if (fetchErr || !user) {
      console.error('Error fetching user for password change:', fetchErr);
      return res.status(500).json({ success: false, error: fetchErr?.message || 'User not found' });
    }

    const stored = user.password_hash || '';
    let ok = false;
    try {
      if (!stored) ok = false;
      else if (stored === currentPassword) ok = true; // legacy plain-text match
      else ok = await bcrypt.compare(currentPassword, stored);
    } catch (e) {
      console.warn('Password compare failed:', e);
      ok = false;
    }

    if (!ok) return res.status(401).json({ success: false, error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    // Update by id first, fallback to national_id or email
    let updated = null;
    let updateErr = null;
    if (userId) {
      try {
        const u1 = await supabase.from('patients').update({ password_hash: hashed }).eq('id', userId).select().single();
        updated = u1.data; updateErr = u1.error;
        if ((updateErr || !updated)) {
          const u2 = await supabase.from('patients').update({ password_hash: hashed }).eq('national_id', userId).select().single();
          updated = u2.data; updateErr = u2.error;
        }
      } catch (e) {
        updateErr = e;
      }
    } else {
      const u = await supabase.from('patients').update({ password_hash: hashed }).eq('email', String(email).toLowerCase()).select().single();
      updated = u.data; updateErr = u.error;
    }
    if (updateErr) {
      console.error('Error updating password:', updateErr);
      return res.status(500).json({ success: false, error: updateErr.message });
    }

    res.json({ success: true, message: 'Password updated' });
  } catch (err) {
    console.error('Unexpected error in POST /api/settings/change-password', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
