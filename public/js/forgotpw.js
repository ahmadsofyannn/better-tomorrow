document.addEventListener('DOMContentLoaded', () => {
  const forgotForm = document.getElementById('forgotPasswordForm');

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = forgotForm.querySelector('.btn-submit');
      const emailInput = document.getElementById('email');
      const email = emailInput ? emailInput.value.trim() : '';

      // Set Loading State pada Tombol
      const originalBtnText = submitBtn ? submitBtn.innerText : 'Send Reset Link';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Sending...';
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
          alert('Tautan instruksi pemulihan kata sandi telah dikirim ke email Anda.');
          window.location.href = 'login.html';
        } else {
          alert(data.message || 'Email tidak ditemukan.');
        }
      } catch (error) {
        console.error('Error Forgot Password:', error);
        alert('Terjadi kesalahan pada server.');
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