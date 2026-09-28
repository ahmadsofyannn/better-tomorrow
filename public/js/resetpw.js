// Otomatis isi input email jika tersimpan dari halaman forgotpw.html
document.addEventListener('DOMContentLoaded', () => {
  const savedEmail = localStorage.getItem('resetEmail');
  if (savedEmail) {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.value = savedEmail;
    }
  }
});

// Fungsi untuk mengirimkan data Reset Password ke backend
async function resetPassword() {
  const email = document.getElementById('email').value.trim();
  const otp = document.getElementById('otp').value.trim();
  const newPassword = document.getElementById('newPassword').value;
  const messageEl = document.getElementById('message');

  // Validasi Input Sederhana
  if (!email || !otp || !newPassword) {
    messageEl.style.color = '#ef4444';
    messageEl.innerText = '❌ Semua field wajib diisi!';
    return;
  }

  if (otp.length < 6) {
    messageEl.style.color = '#ef4444';
    messageEl.innerText = '❌ Kode OTP harus berisi 6 digit angka.';
    return;
  }

  messageEl.style.color = '#6366f1';
  messageEl.innerText = '⏳ Memperbarui password...';

  try {
    const res = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });

    const data = await res.json();

    if (res.ok) {
      // Hapus email sementara dari localStorage setelah sukses
      localStorage.removeItem('resetEmail');
      
      messageEl.style.color = '#10b981';
      messageEl.innerText = '✅ ' + data.message;

      // Tunggu 1.5 detik lalu arahkan ke halaman login
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
    } else {
      messageEl.style.color = '#ef4444';
      messageEl.innerText = '❌ ' + (data.message || 'Gagal memperbarui password.');
    }
  } catch (err) {
    console.error('Error Reset Password:', err);
    messageEl.style.color = '#ef4444';
    messageEl.innerText = '❌ Terjadi kesalahan koneksi server.';
  }
}