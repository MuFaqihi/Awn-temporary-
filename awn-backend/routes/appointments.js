const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticateToken } = require('../utils/jwt');

// Log registered route methods for debugging (module load time)
try {
  const registered = (router.stack || []).map(s => s.route && Object.keys(s.route.methods).join(',')).filter(Boolean);
  console.log('Appointments route loaded, registered methods:', registered);
} catch (e) {
  console.warn('Could not enumerate appointments router stack at load time', e?.message || e);
}

// GET /api/appointments - جلب مواعيد المستخدم من الجدول الصحيح
router.get('/', authenticateToken, async (req, res) => {
  try {
    //   التصحيح: استخدام req.user.id بدلاً من req.user.userId
    const patientId = req.user.id; // "PAT_1763027253059"
    const userEmail = req.user.email ? String(req.user.email).toLowerCase() : null; // normalize email
    
    console.log('  جلب مواعيد للمستخدم:', { 
      patientId, 
      userEmail, 
      fullUser: req.user 
    });

    // Fetch both appointments (structured) and bookings (request-based) and merge
    console.log('  جلب مواعيد المستخدم من appointments و bookings...');
    const aQuery = supabase
      .from('appointments')
      .select('*, therapists(id, name_ar, name_en, avatar_url)')
      .eq('patient_id', patientId)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    const bQuery = supabase
      .from('bookings')
      .select('*, therapists:therapist_id(name_ar,name_en,avatar_url)')
      .eq('user_email', userEmail)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    // run queries in parallel but destructure responses for clarity
    const [aRes, bRes] = await Promise.all([aQuery, bQuery]);

    const aData = aRes && aRes.data ? aRes.data : [];
    const aError = aRes && aRes.error ? aRes.error : null;
    const bData = bRes && bRes.data ? bRes.data : [];
    const bError = bRes && bRes.error ? bRes.error : null;

    // counts/debugging removed

    const apptsFromAppointments = (!aError && Array.isArray(aData)) ? aData.map(r => ({
      id: r.id,
      source: 'appointments',
      patient_id: r.patient_id,
      therapist_id: r.therapist_id,
      date: r.date,
      time: r.time,
      kind: r.kind,
      status: r.status,
      note: r.patient_notes || r.notes || r.note || null,
      meet_link: r.meet_link,
      created_at: r.created_at,
      therapists: r.therapists || null
    })) : [];

    const apptsFromBookings = (!bError && Array.isArray(bData)) ? bData.map(r => ({
      id: r.id,
      source: 'bookings',
      therapist_id: r.therapist_id,
      user_name: r.user_name,
      user_email: r.user_email,
      date: r.booking_date,
      time: r.booking_time,
      kind: r.session_type,
      status: r.status,
      note: r.notes || r.note || null,
      created_at: r.created_at,
      therapists: r.therapists || r.therapist || null
    })) : [];

    // If no bookings found with exact match, try a case-insensitive match as a fallback
    if ((!bError) && Array.isArray(bData) && bData.length === 0 && userEmail) {
      try {
        console.log('  no exact-match bookings found; trying case-insensitive fallback...');
        const bFallback = await supabase
          .from('bookings')
          .select('*, therapists:therapist_id(name_ar,name_en,avatar_url)')
          .ilike('user_email', userEmail)
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true });

        if (bFallback && bFallback.data && Array.isArray(bFallback.data) && bFallback.data.length > 0) {
          // fallback result will be merged below if found
          // replace apptsFromBookings with fallback mapping
          appointments = [...apptsFromAppointments, ...bFallback.data.map(r => ({
            id: r.id,
            source: 'bookings',
            therapist_id: r.therapist_id,
            user_name: r.user_name,
            user_email: r.user_email,
            date: r.booking_date,
            time: r.booking_time,
            kind: r.session_type,
            status: r.status,
            note: r.notes || r.note || null,
            created_at: r.created_at,
            therapists: r.therapists || r.therapist || null
          }))];

          // sort again after replacement
          appointments.sort((x, y) => {
            const dx = new Date(x.date + 'T' + (x.time || '00:00')).getTime();
            const dy = new Date(y.date + 'T' + (y.time || '00:00')).getTime();
            return dx - dy;
          });
        }
      } catch (fbErr) {
        console.warn('  fallback bookings query failed:', fbErr?.message || fbErr);
      }
    }

    // merge and sort by date/time ascending
    let appointments = [...apptsFromAppointments, ...apptsFromBookings];
    appointments.sort((x, y) => {
      const dx = new Date(x.date + 'T' + (x.time || '00:00')).getTime();
      const dy = new Date(y.date + 'T' + (y.time || '00:00')).getTime();
      return dx - dy;
    });

    console.log(`  الإجمالي: ${appointments.length} موعد/حجز`);
    
    res.json({
      success: true,
      data: appointments,
      count: appointments.length,
      debug: {
        patientIdUsed: patientId,
        userEmailUsed: userEmail,
        source: appointments.length > 0 ? 
          (appointments[0].patient_id ? 'appointments' : 'bookings') : 'none'
      }
    });

  } catch (error) {
    console.error(' خطأ غير متوقع:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// POST /api/appointments - إنشاء موعد جديد
router.post('/', authenticateToken, async (req, res) => {
  try {
    //   التصحيح: استخدام req.user.id بدلاً من req.user.userId
    const patientId = req.user.id;
    const { therapistId, date, time, kind, note } = req.body;

    console.log('  إنشاء موعد جديد:', { 
      patientId, 
      therapistId, 
      date, 
      time, 
      kind 
    });

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id: patientId, //   التصحيح: patient_id بدلاً من user_id
          therapist_id: therapistId,
          date,
          time,
          kind,
          patient_notes: note,
          status: 'upcoming'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(' خطأ في إنشاء الموعد:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    console.log('  تم إنشاء الموعد بنجاح:', appointment.id);
    res.status(201).json({
      success: true,
      data: appointment,
      message: 'تم إنشاء الموعد بنجاح'
    });
  } catch (error) {
    console.error(' خطأ غير متوقع:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// إعادة جدولة
router.patch('/:id/reschedule', authenticateToken, async (req, res) => {
  try {
    const patientId = req.user.id;
    const appointmentId = req.params.id;
    const { date, time, kind, note } = req.body;

    console.log('  إعادة جدولة الموعد:', { patientId, appointmentId });
    // First try to update an appointment row (appointments table)
    const updatePayload = { updated_at: new Date().toISOString() };
    if (date !== undefined) updatePayload.date = date;
    if (time !== undefined) updatePayload.time = time;
    if (kind !== undefined) updatePayload.kind = kind;
    if (note !== undefined) updatePayload.patient_notes = note;

    // SELECT first to avoid PostgREST 'single object' coercion errors
    const { data: apptSelectRows, error: apptSelectErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('patient_id', patientId);

    if (apptSelectErr) {
      console.error(' خطأ في جلب الموعد قبل إعادة الجدولة:', apptSelectErr);
    }

    if (Array.isArray(apptSelectRows) && apptSelectRows.length > 0) {
      // perform update without .select()
      const { error: updateErr } = await supabase
        .from('appointments')
        .update(updatePayload)
        .eq('id', appointmentId)
        .eq('patient_id', patientId);

      if (updateErr) {
        console.error(' خطأ أثناء تحديث الموعد:', updateErr);
        return res.status(500).json({ success: false, error: updateErr.message || String(updateErr) });
      }

      const appointment = { ...apptSelectRows[0], ...updatePayload };
      return res.json({ success: true, data: appointment, message: 'تمت إعادة الجدولة بنجاح' });
    }

    // If no appointment row was updated, try bookings table (match by user email)
    const userEmail = req.user.email ? String(req.user.email).toLowerCase() : null;
    if (!userEmail) return res.status(404).json({ success: false, error: 'الموعد غير موجود' });

    // fetch existing booking to populate rescheduled_from if needed
    const { data: existingBooking, error: existingBookingErr } = await supabase.from('bookings').select('*').eq('id', appointmentId).maybeSingle();
    console.log('  (debug) existingBooking:', existingBooking ? true : false, 'err:', existingBookingErr && existingBookingErr.code ? existingBookingErr.code : existingBookingErr);

    const bookingUpdate = { updated_at: new Date().toISOString() };
    if (date !== undefined) bookingUpdate.booking_date = date;
    if (time !== undefined) bookingUpdate.booking_time = time;
    if (kind !== undefined) bookingUpdate.session_type = kind;
    if (note !== undefined) bookingUpdate.notes = note;
    if (existingBooking && (date || time)) {
      // store the original booking id as rescheduled_from (was incorrectly using booking_date)
      bookingUpdate.rescheduled_from = existingBooking.id || null;
    }

    // bookings fallback - SELECT first, then update without .select()
    const { data: bookingSelectRows, error: bookingSelectErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', appointmentId)
      .eq('user_email', userEmail);

    if (bookingSelectErr) {
      console.error(' خطأ في جلب الحجز قبل إعادة الجدولة:', bookingSelectErr);
    }

    if (!Array.isArray(bookingSelectRows) || bookingSelectRows.length === 0) {
      return res.status(404).json({ success: false, error: 'الموعد غير موجود' });
    }

    const { error: bookingUpdateErr } = await supabase
      .from('bookings')
      .update(bookingUpdate)
      .eq('id', appointmentId)
      .eq('user_email', userEmail);

    if (bookingUpdateErr) {
      console.error(' خطأ في إعادة الجدولة (bookings - update):', bookingUpdateErr);
      return res.status(500).json({ success: false, error: bookingUpdateErr.message || String(bookingUpdateErr) });
    }

    const booking = { ...bookingSelectRows[0], ...bookingUpdate };
    return res.json({ success: true, data: booking, message: 'تمت إعادة جدولة الحجز بنجاح' });
  } catch (error) {
    console.error(' خطأ غير متوقع في إعادة الجدولة:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// إلغاء موعد
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    //   التصحيح: استخدام req.user.id بدلاً من req.user.userId
    const patientId = req.user.id;
    const appointmentId = req.params.id;

    console.log('  إلغاء الموعد:', { patientId, appointmentId });
    // First try appointments table: SELECT then UPDATE without .select()
    const { data: apptRows, error: apptRowsErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('patient_id', patientId);

    if (apptRowsErr) console.error(' خطأ في جلب الموعد قبل الإلغاء:', apptRowsErr);

    if (Array.isArray(apptRows) && apptRows.length > 0) {
      const { error: apptUpdateErr } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', appointmentId)
        .eq('patient_id', patientId);

      if (apptUpdateErr) {
        console.error(' خطأ أثناء إلغاء الموعد:', apptUpdateErr);
        return res.status(500).json({ success: false, error: apptUpdateErr.message || String(apptUpdateErr) });
      }

      return res.json({ success: true, data: { ...apptRows[0], status: 'cancelled' }, message: 'تم إلغاء الموعد بنجاح' });
    }

    // Fallback to bookings table (match by user email)
    const userEmail = req.user.email ? String(req.user.email).toLowerCase() : null;
    if (!userEmail) return res.status(404).json({ success: false, error: 'الموعد غير موجود' });

    const cancelPayload = { status: 'cancelled', updated_at: new Date().toISOString(), cancelled_at: new Date().toISOString() };
    if (req.body.cancellation_reason) cancelPayload.cancellation_reason = req.body.cancellation_reason;

    const { data: bookingSelectRows, error: bookingSelectErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', appointmentId)
      .eq('user_email', userEmail);

    if (bookingSelectErr) {
      console.error(' خطأ في جلب الحجز قبل الإلغاء:', bookingSelectErr);
    }

    if (!Array.isArray(bookingSelectRows) || bookingSelectRows.length === 0) return res.status(404).json({ success: false, error: 'الموعد غير موجود' });

    const { error: bookingUpdateErr } = await supabase
      .from('bookings')
      .update(cancelPayload)
      .eq('id', appointmentId)
      .eq('user_email', userEmail);

    if (bookingUpdateErr) {
      console.error(' خطأ في الإلغاء (bookings - update):', bookingUpdateErr);
      return res.status(500).json({ success: false, error: bookingUpdateErr.message || String(bookingUpdateErr) });
    }

    return res.json({ success: true, data: { ...bookingSelectRows[0], ...cancelPayload }, message: 'تم إلغاء الحجز بنجاح' });

  } catch (error) {
    console.error(' خطأ غير متوقع:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// إرسال تقييم
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    //   التصحيح: استخدام req.user.id بدلاً من req.user.userId
    const patientId = req.user.id;
    const appointmentId = req.params.id;
    const { ratings, feedbackText, overall } = req.body;

    console.log('  إرسال تقييم:', { patientId, appointmentId });

    const { data: appointmentRows, error } = await supabase
      .from('appointments')
      .update({
        rating: overall,
        feedback_text: feedbackText,
        feedback_ratings: ratings,
        feedback_submitted_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .eq('patient_id', patientId) //   التصحيح: patient_id بدلاً من user_id
      .select();

    if (error) {
      console.error(' خطأ في إرسال التقييم:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    if (!Array.isArray(appointmentRows) || appointmentRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'الموعد غير موجود' 
      });
    }
    const appointment = appointmentRows[0];

    res.json({
      success: true,
      data: appointment,
      message: 'تم إرسال التقييم بنجاح'
    });

  } catch (error) {
    console.error(' خطأ غير متوقع:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// GET /api/appointments/debug/me - للتحقق من بيانات الـ token
router.get('/debug/me', authenticateToken, async (req, res) => {
  try {
    console.log('  بيانات الـ JWT token:', req.user);
    res.json({
      success: true,
      user: req.user,
      message: 'بيانات المستخدم من الـ token'
    });
  } catch (error) {
    console.error(' خطأ في جلب بيانات المستخدم:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب البيانات'
    });
  }
});

// GET /api/appointments/debug/all - جلب جميع المواعيد للاختبار
router.get('/debug/all', async (req, res) => {
  try {
    console.log('  جلب جميع المواعيد للتحقق...');

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.error(' خطأ في جلب المواعيد:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    console.log(`  تم العثور على ${appointments?.length || 0} موعد للاختبار`);
    
    res.json({
      success: true,
      data: appointments || [],
      count: appointments?.length || 0,
      message: `بيانات اختبار - ${appointments?.length || 0} موعد`
    });

  } catch (error) {
    console.error('  خطأ في الخادم:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب البيانات'
    });
  }
});

// POST /api/appointments/test - إنشاء موعد اختبار (بدون مصادقة)
router.post('/test', async (req, res) => {
  try {
    const { therapistId, date, time, kind, note, userId } = req.body;

    console.log('  إنشاء موعد اختبار:', { userId, therapistId, date, time });

    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id: userId || 'PAT_1763027253059',
          therapist_id: therapistId || (await supabase.from('therapists').select('id').limit(1).single()).data?.id,
          date: date || '2024-01-25',
          time: time || '14:00',
          kind: kind || 'online',
          patient_notes: note || 'جلسة اختبار',
          status: 'upcoming'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(' خطأ في إنشاء الموعد:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }

    console.log('  تم إنشاء موعد الاختبار بنجاح:', appointment.id);
    res.status(201).json({
      success: true,
      data: appointment,
      message: 'تم إنشاء موعد الاختبار بنجاح'
    });

  } catch (error) {
    console.error(' خطأ غير متوقع:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router; 