const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

const bcrypt = require('bcryptjs');

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false,
      error: 'Invalid or expired token' 
    });
  }
};

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    // In development allow any localhost origin
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Routes الأساسية
app.use('/api/therapists', require('./routes/therapists'));
app.use('/api/therapist', require('./routes/therapist'));
app.use('/api/booking', require('./routes/booking'));
// Appointments (routes/appointments.js provides full CRUD: get/post/patch/cancel/reschedule)
app.use('/api/appointments', require('./routes/appointments'));
// Favorites
app.use('/api/favorites', require('./routes/favorites'));
// Settings
app.use('/api/settings', require('./routes/settings'));
// Medical history
app.use('/api/medical-history', require('./routes/medical-history'));
// Treatment plans
app.use('/api/treatment-plans', require('./routes/treatment-plans'));

//   AUTH - تسجيل الدخول والتسجيل
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password } = req.body;
    
    console.log('  تسجيل مريض جديد:', { first_name, email });

    // تشفير كلمة المرور ثم إنشاء مريض في قاعدة البيانات
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: patient, error } = await supabase
      .from('patients')
      .insert([
        {
          first_name,
          last_name, 
          email: String(email).toLowerCase(),
          phone,
          national_id: 'TEMP_' + Date.now(),
          password_hash: hashedPassword
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(' خطأ في إنشاء المريض:', error);
      return res.status(500).json({
        success: false,
        error: 'فشل في إنشاء الحساب'
      });
    }

    // إنشاء token
    const token = jwt.sign(
      {
        id: patient.id,
        email: patient.email,
        first_name: patient.first_name,
        last_name: patient.last_name, 
        role: 'patient'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('  تم إنشاء المريض بنجاح:', patient.id);

    // Persist optional address/address_coords into patient row if provided.
    try {
      const addr = req.body.address;
      const coords = req.body.address_coords;
      if (addr || coords) {
        // If the patients table actually has an `address` column, update it directly.
        if (patient.hasOwnProperty('address')) {
          await supabase.from('patients').update({ address: addr || null, address_coords: coords || null }).eq('id', patient.id);
        } else {
          // Fallback: store address/coords inside `medical_notes` JSON
          let notes = {};
          if (patient.medical_notes) {
            try { notes = typeof patient.medical_notes === 'string' ? JSON.parse(patient.medical_notes) : patient.medical_notes; } catch (e) { notes = {}; }
          }
          if (addr) notes.address = addr;
          if (coords) notes.address_coords = coords;
          await supabase.from('patients').update({ medical_notes: JSON.stringify(notes) }).eq('id', patient.id);
        }
      }
    } catch (e) {
      console.warn('Failed to persist signup address fallback', e?.message || e);
    }

    res.json({
      success: true,
      token: token,
      user: {
        id: patient.id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        role: 'patient'
      }
    });

  } catch (error) {
    console.error(' خطأ غير متوقع في التسجيل:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('  محاولة تسجيل دخول:', email);

    // البحث عن المريض
    // match by lowercased email
    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('email', String(email).toLowerCase())
      .maybeSingle();

    if (error || !patient) {
      return res.status(401).json({
        success: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // تحقق من كلمة المرور باستخدام bcrypt, but tolerate legacy plain-text stored passwords
    const stored = String(patient.password_hash || '');
    let isValid = false;
    try {
      // legacy plain-text fallback
      if (stored === String(password)) isValid = true;
      else isValid = await bcrypt.compare(String(password), stored);
    } catch (e) {
      console.warn('Password compare failed:', e);
      isValid = false;
    }
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
      });
    }

    // If the stored password was plain-text and matched, upgrade it to a bcrypt hash
    try {
      if (stored === String(password)) {
        const newHash = await bcrypt.hash(String(password), 10);
        const up = await supabase.from('patients')
          .update({ password_hash: newHash })
          .eq('id', patient.id)
          .select()
          .single();
        if (up.error) console.warn('Failed to upgrade plaintext password to bcrypt hash', up.error);
        else console.log('Upgraded plaintext password to bcrypt hash for', patient.email, 'result:', up.data || up);
      }
    } catch (e) {
      console.warn('Failed to upgrade plaintext password to bcrypt hash', e?.message || e);
    }

    // إنشاء token
    const token = jwt.sign(
      {
        id: patient.id,
        email: patient.email,
        first_name: patient.first_name,
        last_name: patient.last_name,
        role: 'patient'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('  تسجيل دخول ناجح:', patient.id);
    
    res.json({
      success: true,
      token: token,
      user: {
        id: patient.id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        role: 'patient'
      }
    });

  } catch (error) {
    console.error(' خطأ في تسجيل الدخول:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Appointments are handled by routes/appointments.js mounted earlier.

//   HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'الباك إند يعمل!',
    timestamp: new Date().toISOString()
  });
});

// Root route - friendly HTML page with links to key endpoints
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Awn Backend</title></head>
      <body style="font-family:system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; padding:24px">
        <h1>Awn Backend</h1>
        <p>API is available under <a href="/api">/api</a>.</p>
        <ul>
          <li><a href="/api/health">/api/health</a> - health check (JSON)</li>
          <li><a href="/api/debug/patients">/api/debug/patients</a> - sample patients</li>
          <li><a href="/api/debug/appointments">/api/debug/appointments</a> - sample appointments</li>
        </ul>
      </body>
    </html>
  `);
});

//   DEBUG ENDPOINTS
app.get('/api/debug/patients', async (req, res) => {
  try {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email')
      .limit(5);

    res.json({
      success: true,
      data: patients || [],
      count: patients?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/debug/appointments', async (req, res) => {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, patient_id, date, status')
      .limit(10);

    res.json({
      success: true,
      data: appointments || [],
      count: appointments?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Dev debug: return full patient row by email (do NOT enable in production)
app.get('/api/debug/patient', async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ success: false, error: 'email query required' });
    const { data, error } = await supabase.from('patients').select('*').eq('email', String(email)).single();
    if (error) return res.status(500).json({ success: false, error: error.message });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// DEBUG: list registered routes (useful when diagnosing 404s)
app.get('/api/debug/routes', (req, res) => {
  try {
    const routes = [];
    const stack = app._router && app._router.stack ? app._router.stack : [];
    stack.forEach(layer => {
      try {
        if (layer.route && layer.route.path) {
          const methods = Object.keys(layer.route.methods || {}).map(m => m.toUpperCase()).join(',');
          routes.push({ path: layer.route.path, methods });
        } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
          layer.handle.stack.forEach(r => {
            if (r.route && r.route.path) {
              const methods = Object.keys(r.route.methods || {}).map(m => m.toUpperCase()).join(',');
              routes.push({ path: r.route.path, methods });
            }
          });
        }
      } catch (e) {
        // ignore per-route errors
      }
    });
    res.json({ success: true, routes });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(` الباك إند الشامل شغال على port ${PORT}`);
  console.log(` جاهز للاتصال مع الفرونت إند`);
  console.log(`   POST /api/auth/signup - تسجيل جديد`);
  console.log(`   POST /api/auth/login - تسجيل دخول`);
  console.log(`   GET  /api/appointments - جلب المواعيد`);
  console.log(`   POST /api/appointments - إنشاء موعد`);
  console.log(`   GET  /api/health - فحص الحالة`);
});