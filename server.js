const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurasi Sesi Login (Session)
app.use(session({
    secret: 'better-tomorrow-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // Sesi berlaku 1 hari
}));

// 1. Koneksi Database MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/better_tomorrow';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Terhubung ke MongoDB Database'))
    .catch(err => console.error('❌ Gagal Koneksi DB:', err));

// 2. Mongoose Schemas & Models

// Schema Pengguna (User)
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// Schema Catatan Kesehatan (Tergantung ke userId)
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

// Kombinasi userId + dayNumber harus unik agar tidak ada dayNumber ganda per user
HealthDaySchema.index({ userId: 1, dayNumber: 1 }, { unique: true });

const HealthDay = mongoose.model('HealthDay', HealthDaySchema);

// Middleware Proteksi Rute (Harus Login)
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'Akses ditolak. Silakan login terlebih dahulu.' });
    }
    next();
};

// --- REST API ENDPOINTS ---

// A. AUTENTIKASI (REGISTER, LOGIN, LOGOUT, ME)

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
        res.status(500).json({ error: err.message });
    }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'Username atau Password salah' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Username atau Password salah' });

        req.session.userId = user._id;
        req.session.username = user.username;

        res.json({ message: 'Login berhasil', username: user.username });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

// B. DATA KESEHATAN (DIPROTEKSI DENGAN USER ID)

// GET: Ambil Semua Hari Milik User yang Sedang Login
app.get('/api/health', requireAuth, async (req, res) => {
    try {
        const days = await HealthDay.find({ userId: req.session.userId }).sort({ dayNumber: 1 });
        res.json(days);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET: Ambil Detail 1 Hari
app.get('/api/health/:dayNumber', requireAuth, async (req, res) => {
    try {
        const day = await HealthDay.findOne({ userId: req.session.userId, dayNumber: req.params.dayNumber });
        if (!day) return res.status(404).json({ message: 'Hari tidak ditemukan' });
        res.json(day);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST: Tambah Hari Baru
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

// PUT: Update Data Hari
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

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});