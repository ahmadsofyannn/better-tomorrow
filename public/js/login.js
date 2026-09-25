document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');

  // 1. Fitur Toggle Intip / Sembunyikan Password
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePassword.classList.toggle('fa-eye-slash');
      togglePassword.classList.toggle('fa-eye');
    });
  }

  // 2. Submit Form Login ke API Backend Express.js
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = passwordInput.value;

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          // Simpan token/data user ke localStorage
          localStorage.setItem('userToken', data.token);
          localStorage.setItem('userData', JSON.stringify(data.user));
          
          alert('Login Berhasil!');
          window.location.href = 'index.html'; // Pindah ke Dashboard Utama
        } else {
          alert(data.message || 'Login gagal, periksa email dan password!');
        }
      } catch (error) {
        console.error('Error Login:', error);
        alert('Gagal terhubung ke server backend.');
      }
    });
  }
});