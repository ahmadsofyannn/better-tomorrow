document.addEventListener('DOMContentLoaded', () => {
  let drunkGlasses = 0;

  // 1. LOGIKA INTERAKTIF GELAS AIR
  const glassItems = document.querySelectorAll('.glass-item');
  const waterCounterText = document.getElementById('waterCounter');

  glassItems.forEach((glass) => {
    glass.addEventListener('click', () => {
      const clickedIndex = parseInt(glass.getAttribute('data-index'));

      // Jika mengklik gelas yang sudah aktif terakhir, kurangi 1
      if (drunkGlasses === clickedIndex) {
        drunkGlasses = clickedIndex - 1;
      } else {
        drunkGlasses = clickedIndex;
      }

      // Update tampilan warna gelas
      glassItems.forEach((g, idx) => {
        if (idx < drunkGlasses) {
          g.classList.add('active');
        } else {
          g.classList.remove('active');
        }
      });

      // Update teks jumlah air (1 gelas = 250ml)
      const totalMl = drunkGlasses * 250;
      waterCounterText.innerText = `${drunkGlasses} dari 8 Gelas (${totalMl} ml)`;
    });
  });

  // 2. LOGIKA SIMPAN FORM JURNAL
  const journalForm = document.getElementById('journalForm');

  if (journalForm) {
    journalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Ambil Mood
      const selectedMood = document.querySelector('input[name="mood"]:checked')?.value || 'tidak diisi';

      // Ambil Data Lengkap Payload
      const journalPayload = {
        mood: selectedMood,
        water: {
          glasses: drunkGlasses,
          totalMl: drunkGlasses * 250
        },
        workout: {
          durationMinutes: document.getElementById('workoutDuration').value || 0,
          distanceKm: document.getElementById('workoutDistance').value || 0,
          pace: document.getElementById('workoutPace').value || '-'
        },
        sleep: {
          night: {
            start: document.getElementById('nightSleepStart').value || '-',
            end: document.getElementById('nightSleepEnd').value || '-'
          },
          nap: {
            start: document.getElementById('napStart').value || '-',
            end: document.getElementById('napEnd').value || '-'
          }
        },
        nutrition: {
          fruitsAndVeggies: document.getElementById('fruitsVeggiesInput').value || '-'
        },
        notes: document.getElementById('notes').value,
        date: new Date().toISOString()
      };

      console.log('Data Jurnal Siap Kirim:', journalPayload);

      // Kirim Data ke Backend API Express.js
      try {
        const response = await fetch('/api/journal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          },
          body: JSON.stringify(journalPayload)
        });

        const result = await response.json();

        if (response.ok) {
          alert('Catatan harian berhasil disimpan!');
          window.location.href = 'index.html';
        } else {
          alert(result.message || 'Gagal menyimpan catatan harian.');
        }
      } catch (error) {
        console.error('Error simpan jurnal:', error);
        alert('Terjadi kesalahan koneksi saat menyimpan catatan.');
      }
    });
  }
});