require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Inisialisasi Express & Port
const app = express();
const PORT = process.env.PORT || 3000;

// 2. Inisialisasi Transporter Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 3. Inisialisasi Gemini AI SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Middleware Global
app.use(cors());
app.use(express.json());

// Konfigurasi Sesi Login (Session)
app.use(session({
    secret: process.env.SESSION_SECRET || 'better-tomorrow-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Sesi berlaku 1 hari
}));

// =============================================================
// ROUTING HALAMAN PERTAMA (LOGIN AS DEFAULT) & PROTEKSI FILE
// =============================================================

// Route Utama (http://localhost:3000/) -> Langsung Buka Login
app.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/index.html'); // Jika sudah login, langsung ke Dashboard
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Middleware Proteksi Halaman HTML Internal
const protectedPages = ['/index.html', '/journal.html', '/plan.html', '/assistant.html', '/bmi.html'];
app.use((req, res, next) => {
  if (protectedPages.includes(req.path) && !req.session.userId) {
    return res.redirect('/login.html');
  }
  next();
});

// Serving Static Files (CSS, JS, Images, & Public HTMLs)
app.use(express.static(path.join(__dirname, 'public')));

// =============================================================
// KONEKSI DATABASE & MONGOOSE SCHEMAS
// =============================================================

// String Koneksi MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Terhubung ke MongoDB Database'))
    .catch(err => console.error('❌ Gagal Koneksi DB:', err));

// Model User (Gunakan import jika dari file eksternal, atau definisikan dengan aman)
let User;
try {
    User = require('./models/user');
} catch (e) {
    const UserSchema = new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        email:    { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role:     { type: String, default: 'user' },
        resetPasswordOTP: { type: String, default: null },
        resetPasswordExpires: { type: Date, default: null }
    }, { timestamps: true });

    User = mongoose.models.User || mongoose.model('User', UserSchema);
}

// Schema HealthDay / Journal
const HealthDaySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dayNumber: { type: Number, required: true },
    date: { type: String, required: true },
    foods: [{ name: String, cal: Number }],
    steps: { type: Number, default: 0 },
    workouts: [{ name: String, min: Number }],
    water: { type: Number, default: 0 },
    habits: {
        shower: { type: Boolean, default: false },
        teeth: { type: Boolean, default: false },
        skincare: { type: Boolean, default: false }
    },
    sleep: { type: String, default: '' },
    notes: { type: String, default: '' }
}, { timestamps: true });

HealthDaySchema.index({ userId: 1, dayNumber: 1 }, { unique: true });
const HealthDay = mongoose.models.HealthDay || mongoose.model('HealthDay', HealthDaySchema);

// Middleware Proteksi API (Harus Login)
const requireAuth = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Akses ditolak. Silakan login terlebih dahulu.' });
    }
    next();
};

// =============================================================
// A. AUTENTIKASI (REGISTER, LOGIN, LOGOUT, ME, FORGOT/RESET PASSWORD)
// =============================================================

// Register User Baru
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username atau Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        req.session.userId = newUser._id;
        req.session.username = newUser.username;

        res.status(201).json({ message: 'Registrasi berhasil', username: newUser.username });
    } catch (err) {
        console.error("❌ Detail Error Registrasi:", err);
        res.status(500).json({ error: err.message });
    }
});

// Handler fungsi login
const handleLogin = async (req, res) => {
    try {
        // Ambil input dari req.body (bisa dikirim sebagai 'username', 'email', atau 'loginInput')
        const loginInput = req.body.username || req.body.email || req.body.loginInput;
        const password = req.body.password;

        if (!loginInput || !password) {
            return res.status(400).json({ error: 'Username/Email dan Password wajib diisi' });
        }

        // Cari user di database yang match dengan Username ATAU Email
        const user = await User.findOne({
            $or: [
                { username: loginInput },
                { email: loginInput }
            ]
        });

        if (!user) {
            return res.status(400).json({ error: 'Username/Email atau Password salah' });
        }

        // Bandingkan password yang diinput dengan password terenkripsi di DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Username/Email atau Password salah' });
        }

        // Simpan data sesi login
        req.session.userId = user._id;
        req.session.username = user.username;

        console.log(`✅ User ${user.username} berhasil login.`);
        res.json({ message: 'Login berhasil', username: user.username });
    } catch (err) {
        console.error("❌ Detail Error Login:", err);
        res.status(500).json({ error: err.message });
    }
};

// Menerima dua route (dengan/tanpa /auth/) agar kompatibel dengan frontend
app.post('/api/login', handleLogin);
app.post('/api/auth/login', handleLogin);

// Logout User
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Gagal logout' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Logout berhasil' });
    });
});

// Cek Status Sesi User Saat Ini
app.get('/api/auth/me', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

// Endpoint Minta Kode OTP Lupa Password
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Email tidak ditemukan' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const mailOptions = {
      from: `"Better Tomorrow Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Kode Verifikasi Lupa Password',
      text: `Kode OTP pemulihan password Anda adalah: ${otp}. Berlaku selama 10 menit.`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Kode OTP berhasil dikirim ke email.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengirim email verifikasi.' });
  }
});

// Endpoint Reset Password dengan OTP
app.post('/api/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Kode OTP tidak valid atau sudah kadaluwarsa' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordOTP = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password berhasil diperbarui!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui password.' });
  }
});

// =============================================================
// B. AI INTEGRATION (GEMINI API ASSISTANT & PLAN GENERATOR)
// =============================================================

// Endpoint Chat AI Assistant
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `Anda adalah 'Better Tomorrow AI', asisten kesehatan personal yang ramah, suportif, dan informatif.
Jawablah pertanyaan/keluhan pengguna berikut dengan bahasa Indonesia yang santun, empatik, dan praktis:
"${message}"`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.json({ reply: responseText });
  } catch (error) {
    console.error('Error /api/chat:', error);
    return res.status(500).json({ error: 'Gagal memproses permintaan AI Assistant.' });
  }
});

// Endpoint Smart Health Plan Generator
app.post('/api/generate-plan', async (req, res) => {
  try {
    const { goal, activity, diet } = req.body;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' } 
    });

    const prompt = `Buatkan program kesehatan harian terstruktur berdasarkan kriteria berikut:
- Target Utama (Goal): ${goal}
- Tingkat Aktivitas: ${activity}
- Tipe Diet: ${diet}

Berikan output HANYA dalam format JSON murni dengan struktur persis seperti ini:
{
  "waterGlasses": "8 Gelas (2000 ml)",
  "calories": "2,000 kcal / hari",
  "workout": "30 Menit Cardio / Jalan Cepat",
  "sleep": "7 - 8 Jam",
  "meals": {
    "breakfast": { "title": "Nama Sarapan", "desc": "Deskripsi bahan dan porsi", "cal": "350 kcal" },
    "lunch": { "title": "Nama Makan Siang", "desc": "Deskripsi bahan dan porsi", "cal": "600 kcal" },
    "dinner": { "title": "Nama Makan Malam", "desc": "Deskripsi bahan dan porsi", "cal": "450 kcal" }
  }
}`;

    const result = await model.generateContent(prompt);
    const planData = JSON.parse(result.response.text());

    return res.json({ success: true, plan: planData });
  } catch (error) {
    console.error('Error /api/generate-plan:', error);
    return res.status(500).json({ error: 'Gagal merancang program sehat via AI.' });
  }
});

// =============================================================
// C. DATA KESEHATAN JOURNAL (DIPROTEKSI REQUIREAUTH)
// =============================================================

app.get('/api/health', requireAuth, async (req, res) => {
    try {
        const days = await HealthDay.find({ userId: req.session.userId }).sort({ dayNumber: 1 });
        res.json(days);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/health/:dayNumber', requireAuth, async (req, res) => {
    try {
        const day = await HealthDay.findOne({ userId: req.session.userId, dayNumber: req.params.dayNumber });
        if (!day) return res.status(404).json({ message: 'Hari tidak ditemukan' });
        res.json(day);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/health', requireAuth, async (req, res) => {
    try {
        const newDay = new HealthDay({
            ...req.body,
            userId: req.session.userId
        });
        await newDay.save();
        res.status(201).json(newDay);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.put('/api/health/:dayNumber', requireAuth, async (req, res) => {
    try {
        const updated = await HealthDay.findOneAndUpdate(
            { userId: req.session.userId, dayNumber: req.params.dayNumber },
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Fallback Route jika endpoint/page tidak ditemukan
app.get('*', (req, res) => {
  if (req.session.userId) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server Better Tomorrow berjalan di http://localhost:${PORT}`);
});