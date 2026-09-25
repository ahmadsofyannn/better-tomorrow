// Memeriksa status login dan memperbarui UI Navbar
function updateAuthUI() {
  const token = localStorage.getItem('userToken');
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const loginBtn = document.querySelector('.nav-btn-login');

  if (token && loginBtn) {
    // Ubah tombol "Masuk" menjadi nama user & fungsi Logout
    loginBtn.textContent = userData.name ? `Halo, ${userData.name.split(' ')[0]}` : 'Keluar';
    loginBtn.href = '#';
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Apakah Anda yakin ingin keluar?')) {
        logout();
      }
    });
  }
}

// Fungsi Helper Logout
function logout() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('userData');
  window.location.href = 'login.html';
}

// Jalankan saat halaman siap
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
});