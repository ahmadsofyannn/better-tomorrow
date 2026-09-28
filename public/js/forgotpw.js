document.addEventListener('DOMContentLoaded', () => {
  const forgotForm = document.getElementById('forgotPasswordForm');

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = forgotForm.querySelector('.btn-submit');
      const emailInput = document.getElementById('email');
      const email = emailInput ? emailInput.value.trim() : '';

      if (!email) {
        alert('Silakan masukkan email Anda.');
        return;
      }

      // Set Loading State pada Tombol
      const originalBtnText = submitBtn ? submitBtn.innerText : 'Kirim Kode OTP';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Mengirim...';
      }

      try {
        const response = await fetch('/api/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          // 1. Simpan email ke localStorage agar otomatis terisi di resetpw.html
          localStorage.setItem('resetEmail', email);

          alert('✅ Kode OTP pemulihan kata sandi telah dikirim ke email Anda!');

          // 2. Arahkan langsung ke halaman resetpw.html
          window.location.href = '/resetpw.html';
        } else {
          alert('❌ ' + (data.message || 'Email tidak ditemukan.'));
        }
      } catch (error) {
        console.error('Error Forgot Password:', error);
        alert('❌ Terjadi kesalahan pada server.');
      } finally {
        // Kembalikan status tombol
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalBtnText;
        }
      }
    });
  }
});