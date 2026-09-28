const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, default: 'user' },
    
    // Field Tambahan untuk OTP
    resetPasswordOTP: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });