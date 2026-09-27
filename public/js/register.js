document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signupForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');

  // 1. Fitur Toggle Intip / Sembunyikan Password
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      
      if (togglePassword.classList.contains('fa-lock')) {
        togglePassword.classList.remove('fa-lock');
        togglePassword.classList.add('fa-lock-open');
      } else if (togglePassword.classList.contains('fa-lock-open')) {
        togglePassword.classList.remove('fa-lock-open');
        togglePassword.classList.add('fa-lock');
      } else {
        togglePassword.classList.toggle('fa-eye-slash');
        togglePassword.classList.toggle('fa-eye');
      }
    });
  }

  // 2. Submit Form Signup ke API Backend Express.js
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = signupForm.querySelector('.btn-submit');
      const fullNameInput = document.getElementById('fullName');
      const emailInput = document.getElementById('email');
      const confirmPasswordInput = document.getElementById('confirmPassword');

      const fullName = fullNameInput ? fullNameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';

      // Validasi Konfirmasi Password jika elemennya tersedia di HTML
      if (confirmPasswordInput) {
        const confirmPassword = confirmPasswordInput.value;
        if (password !== confirmPassword) {
          alert('Kata sandi dan konfirmasi kata sandi tidak cocok!');
          return;
        }
      }

      // Set Loading State pada Tombol
      const originalBtnText = submitBtn ? submitBtn.innerText : 'Sign up';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Memproses...';
      }

      try {
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fullName, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          alert('Pendaftaran berhasil! Silakan login.');
          window.location.href = 'login.html';
        } else {
          alert(data.message || 'Gagal mendaftar. Silakan coba lagi.');
        }
      } catch (error) {
        console.error('Error Register:', error);
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