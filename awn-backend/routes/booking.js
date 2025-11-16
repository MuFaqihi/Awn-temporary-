const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// تحسين: إضافة middleware للتحقق من البيانات
const validateBooking = (req, res, next) => {
  const {
    therapist_id,
    patient_name,
    patient_email,
    patient_phone,
    booking_date,
    booking_time,
    session_type
  } = req.body;

  const requiredFields = {
    therapist_id: 'معرف المعالج',
    patient_name: 'اسم المريض', 
    patient_email: 'البريد الإلكتروني',
    patient_phone: 'رقم الهاتف',
    booking_date: 'تاريخ الحجز',
    booking_time: 'وقت الحجز',
    session_type: 'نوع الجلسة'
  };

  const missingFields = [];
  for (const [field, name] of Object.entries(requiredFields)) {
    if (!req.body[field]) {
      missingFields.push(name);
    }
  }

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false, //   إضافة success: false
      error: 'بيانات ناقصة',
      details: `الحقول التالية مطلوبة: ${missingFields.join(', ')}`
    });
  }

  // تحقق من صحة البريد الإلكتروني
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(patient_email)) {
    return res.status(400).json({
      success: false, //   إضافة success: false
      error: 'بريد إلكتروني غير صالح'
    });
  }

  //   تحقق من صحة التاريخ والوقت
  const bookingDateTime = new Date(`${booking_date}T${booking_time}`);
  if (isNaN(bookingDateTime.getTime())) {
    return res.status(400).json({
      success: false,
      error: 'تاريخ أو وقت غير صالح'
    });
  }

  //   تحقق من أن الحجز في المستقبل
  if (bookingDateTime < new Date()) {
    return res.status(400).json({
      success: false,
      error: 'لا يمكن الحجز في وقت ماضي'
    });
  }

  next();
};

const checkAvailability = async (req, res, next) => {
  try {
    const { therapist_id, booking_date, booking_time } = req.body;

    console.log('  التحقق من التوفر:', { therapist_id, booking_date, booking_time });

    // استعلام أكثر دقة
    const { data: existingBooking, error } = await supabase
      .from('bookings')
      .select('id, status, user_name')
      .eq('therapist_id', therapist_id)
      .eq('booking_date', booking_date)
      .eq('booking_time', booking_time)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      console.error(' خطأ في الاستعلام:', error);
      // إذا كان الخطأ "لا توجد بيانات"، هذا طبيعي يعني الوقت متاح
      if (error.code === 'PGRST116') {
        return next();
      }
      throw error;
    }

    console.log('  النتائج:', existingBooking);

    // إذا وجدنا حجوزات موجودة
    if (existingBooking && existingBooking.length > 0) {
      return res.status(409).json({
        success: false, //   إضافة success: false
        error: 'هذا الموعد محجوز مسبقاً',
        details: 'يرجى اختيار وقت آخر',
        existingBookings: existingBooking
      });
    }

    // إذا لم توجد حجوزات، تابع
    next();
  } catch (error) {
    console.error('  خطأ في التحقق من التوفر:', error);
    res.status(500).json({
      success: false, //   إضافة success: false
      error: 'فشل في التحقق من توفر الموعد',
      details: error.message
    });
  }
};

// POST /api/bookings - إنشاء حجز جديد
router.post('/', validateBooking, checkAvailability, async (req, res) => {
  try {
    const {
      therapist_id,
      patient_national_id,
      patient_name,
      patient_email,
      patient_phone,
      patient_date_of_birth,
      booking_date,
      booking_time,
      session_type,
      session_duration = 60,
      notes
    } = req.body;

    console.log('  إنشاء حجز جديد:', { therapist_id, patient_name, booking_date, booking_time });

    //   التحقق من وجود المعالج
    const { data: therapist, error: therapistError } = await supabase
      .from('therapists')
      .select('id, name_ar, name_en')
      .eq('id', therapist_id)
      .single();

    if (therapistError || !therapist) {
      return res.status(404).json({
        success: false,
        error: 'المعالج غير موجود'
      });
    }

    // إنشاء الحجز الجديد
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([
        {
          therapist_id,
          patient_national_id,
          user_name: patient_name,
          user_email: patient_email ? String(patient_email).toLowerCase() : null,
          user_phone: patient_phone,
          patient_date_of_birth,
          booking_date,
          booking_time,
          session_type,
          session_duration,
          notes,
          status: 'pending'
        }
      ])
      .select(`
        *,
        therapists:therapist_id (
          name_ar,
          name_en,
          role_ar,
          role_en
        )
      `)
      .single();

    if (error) {
      console.error(' خطأ في إنشاء الحجز:', error);
      return res.status(500).json({
        success: false,
        error: 'فشل في إنشاء الحجز',
        details: error.message
      });
    }

    console.log('  تم إنشاء الحجز بنجاح (بانتظار الموافقة):', booking.id);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحجز بنجاح وجاري انتظار موافقة المعالج',
      data: {
        booking_id: booking.id,
        status: booking.status,
        therapist: booking.therapists,
        booking_details: {
          date: booking.booking_date,
          time: booking.booking_time,
          session_type: booking.session_type
        }
      },
      next_steps: 'سيتم التواصل معك بعد موافقة المعالج'
    });

  } catch (error) {
    console.error('  خطأ في الخادم:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إنشاء الحجز',
      details: 'حدث خطأ غير متوقع'
    });
  }
});

// PUT /api/bookings/:id/confirm - تأكيد الحجز
router.put('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { therapist_id } = req.body;

    console.log('  محاولة تأكيد الحجز:', id);

    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('status, therapist_id')
      .eq('id', id)
      .single();

    if (checkError || !existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'الحجز غير موجود'
      });
    }

    //   التحقق من أن المعالج هو صاحب الحجز
    if (existingBooking.therapist_id !== therapist_id) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح لك بتأكيد هذا الحجز'
      });
    }

    if (existingBooking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن تأكيد هذا الحجز',
        details: `الحجز حالياً ${existingBooking.status}`
      });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        confirmed_at: new Date(),
        confirmed_by: therapist_id
      })
      .eq('id', id)
      .select(`
        *,
        therapists:therapist_id (
          name_ar,
          name_en
        )
      `)
      .single();

    if (error) throw error;

    console.log('  تم تأكيد الحجز بنجاح:', id);

    res.json({
      success: true,
      message: 'تم تأكيد الحجز بنجاح',
      data: booking
    });

  } catch (error) {
    console.error(' خطأ في تأكيد الحجز:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في تأكيد الحجز'
    });
  }
});

// PUT /api/bookings/:id/cancel - إلغاء الحجز
router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellation_reason, cancelled_by } = req.body;

    console.log('  محاولة إلغاء الحجز:', id);

    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', id)
      .single();

    if (checkError || !existingBooking) {
      return res.status(404).json({
        success: false,
        error: 'الحجز غير موجود'
      });
    }

    if (existingBooking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'الحجز ملغى بالفعل'
      });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date(),
        cancellation_reason,
        cancelled_by
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log('  تم إلغاء الحجز بنجاح:', id);

    res.json({
      success: true,
      message: 'تم إلغاء الحجز بنجاح',
      data: booking
    });

  } catch (error) {
    console.error(' خطأ في إلغاء الحجز:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إلغاء الحجز'
    });
  }
});

// GET /api/bookings/availability - التحقق من التوفر
router.get('/availability', async (req, res) => {
  try {
    const { therapist_id, date } = req.query;

    if (!therapist_id || !date) {
      return res.status(400).json({ 
        success: false,
        error: 'معرف المعالج والتاريخ مطلوبان' 
      });
    }

    //   التحقق من صحة التاريخ
    const checkDate = new Date(date);
    if (isNaN(checkDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'تاريخ غير صالح'
      });
    }

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('booking_time, status, user_name')
      .eq('therapist_id', therapist_id)
      .eq('booking_date', date)
      .in('status', ['pending', 'confirmed']);

    if (error) throw error;

    const bookedTimes = bookings.map(b => ({
      time: b.booking_time,
      status: b.status,
      patient: b.user_name
    }));

    //   إضافة أوقات أكثر مرونة
    const allTimes = [
      '08:00', '09:00', '10:00', '11:00', '12:00', 
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
    ];
    
    const availableTimes = allTimes.filter(time => 
      !bookedTimes.some(booked => booked.time === time)
    );

    res.json({ 
      success: true,
      data: {
        availableTimes, 
        bookedTimes,
        therapist_id,
        date,
        totalAvailable: availableTimes.length,
        totalBooked: bookedTimes.length
      }
    });

  } catch (error) {
    console.error(' Error checking availability:', error);
    res.status(500).json({ 
      success: false,
      error: 'فشل في التحقق من المواعيد' 
    });
  }
});

// GET /api/bookings/patient/:email - الحصول على حجوزات المريض
router.get('/patient/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { status } = req.query;

    const lookupEmail = String(email).toLowerCase();
    let query = supabase
      .from('bookings')
      .select(`
        *,
        therapists:therapist_id (
          name_ar,
          name_en,
          role_ar,
          role_en,
          avatar_url
        )
      `)
      .eq('user_email', lookupEmail)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: bookings, error } = await query;

    if (error) throw error;

    res.json({ 
      success: true,
      data: { 
        bookings,
        total: bookings.length 
      } 
    });

  } catch (error) {
    console.error(' Error fetching bookings:', error);
    res.status(500).json({ 
      success: false,
      error: 'فشل في جلب الحجوزات' 
    });
  }
});

// GET /api/bookings/therapist/:id - حجوزات المعالج
router.get('/therapist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('bookings')
      .select(`
        *,
        therapists:therapist_id (
          name_ar,
          name_en
        )
      `, { count: 'exact' })
      .eq('therapist_id', id)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    if (status) query = query.eq('status', status);
    if (date) query = query.eq('booking_date', date);

    //   إضافة pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: bookings, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: { 
        bookings,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error(' Error fetching therapist bookings:', error);
    res.status(500).json({ 
      success: false,
      error: 'فشل في جلب الحجوزات' 
    });
  }
});

// PUT /api/bookings/:id/reschedule - إعادة الجدولة
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      new_booking_date, 
      new_booking_time, 
      reschedule_reason,
      therapist_id 
    } = req.body;

    console.log('  محاولة إعادة جدولة الحجز:', id);

    // التحقق من الحجز الأصلي
    const { data: originalBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !originalBooking) {
      return res.status(404).json({
        success: false,
        error: 'الحجز غير موجود'
      });
    }

    // التحقق من التوفر
    const availabilityCheck = await checkAvailabilityHelper(
      therapist_id, 
      new_booking_date, 
      new_booking_time
    );
    
    if (!availabilityCheck.available) {
      return res.status(409).json({
        success: false,
        error: 'الموعد الجديد محجوز مسبقاً',
        details: 'يرجى اختيار وقت آخر'
      });
    }

    // إنشاء حجز جديد
    const { data: newBooking, error: createError } = await supabase
      .from('bookings')
      .insert([
        {
          therapist_id: originalBooking.therapist_id,
          patient_national_id: originalBooking.patient_national_id,
          user_name: originalBooking.user_name,
          user_email: originalBooking.user_email,
          user_phone: originalBooking.user_phone,
          patient_date_of_birth: originalBooking.patient_date_of_birth,
          booking_date: new_booking_date,
          booking_time: new_booking_time,
          session_type: originalBooking.session_type,
          session_duration: originalBooking.session_duration,
          status: 'pending',
          rescheduled_from: id,
          notes: `إعادة جدولة - السبب: ${reschedule_reason}`
        }
      ])
      .select()
      .single();

    if (createError) throw createError;

    // تحديث الحجز الأصلي
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date(),
        cancellation_reason: `تم إعادة الجدولة - ${reschedule_reason}`,
        rescheduled_to: newBooking.id
      })
      .eq('id', id);

    if (updateError) throw updateError;

    console.log('  تم إعادة الجدولة بنجاح:', { from: id, to: newBooking.id });

    res.json({
      success: true,
      message: 'تم إعادة جدولة الحجز بنجاح',
      data: {
        original_booking: { id, status: 'cancelled' },
        new_booking: newBooking,
        reschedule_details: {
          from: `${originalBooking.booking_date} ${originalBooking.booking_time}`,
          to: `${new_booking_date} ${new_booking_time}`,
          reason: reschedule_reason
        }
      }
    });

  } catch (error) {
    console.error(' خطأ في إعادة الجدولة:', error);
    res.status(500).json({
      success: false,
      error: 'فشل في إعادة جدولة الحجز'
    });
  }
});

// دالة مساعدة للتحقق من التوفر
async function checkAvailabilityHelper(therapist_id, date, time) {
  const { data: existingRows, error } = await supabase
    .from('bookings')
    .select('id, user_name')
    .eq('therapist_id', therapist_id)
    .eq('booking_date', date)
    .eq('booking_time', time)
    .in('status', ['pending', 'confirmed']);

  if (error) {
    // If PostgREST returns PGRST116 it means 0 rows; treat as available
    if (error.code === 'PGRST116') {
      return { available: true, existingBooking: null };
    }
    throw error;
  }

  return {
    available: !(Array.isArray(existingRows) && existingRows.length > 0),
    existingBooking: Array.isArray(existingRows) && existingRows.length > 0 ? existingRows[0] : null
  };
}

module.exports = router;