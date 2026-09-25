document.addEventListener('DOMContentLoaded', () => {
  const planForm = document.getElementById('planForm');
  const planResult = document.getElementById('planResult');

  if (planForm) {
    planForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const goalSelect = document.getElementById('goalSelect');
      const activitySelect = document.getElementById('activitySelect');
      const dietSelect = document.getElementById('dietSelect');
      const submitBtn = planForm.querySelector('button[type="submit"]');

      const goal = goalSelect.value;
      const activity = activitySelect.value;
      const diet = dietSelect.value;

      // 1. Indikator Loading pada Tombol
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Merancang Program...';

      try {
        // 2. Kirim Pilihan Pengguna ke Backend Express (/api/generate-plan)
        const response = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ goal, activity, diet })
        });

        const data = await response.json();

        if (response.ok && data.success && data.plan) {
          const plan = data.plan;

          // 3. Update Target Aksi dari Hasil AI
          document.getElementById('targetWater').innerText = plan.waterGlasses || '8 Gelas (2000 ml)';
          document.getElementById('targetCalories').innerText = plan.calories || '2000 kcal / hari';
          document.getElementById('targetWorkout').innerText = plan.workout || '30 Menit Cardio';
          document.getElementById('targetSleep').innerText = plan.sleep || '7 - 8 Jam';

          // 4. Update Menu Makanan dari Hasil AI
          if (plan.meals) {
            if (plan.meals.breakfast) {
              document.getElementById('breakfastTitle').innerText = plan.meals.breakfast.title || '-';
              document.getElementById('breakfastDesc').innerText = plan.meals.breakfast.desc || '-';
              document.getElementById('breakfastCal').innerText = plan.meals.breakfast.cal || '-';
            }

            if (plan.meals.lunch) {
              document.getElementById('lunchTitle').innerText = plan.meals.lunch.title || '-';
              document.getElementById('lunchDesc').innerText = plan.meals.lunch.desc || '-';
              document.getElementById('lunchCal').innerText = plan.meals.lunch.cal || '-';
            }

            if (plan.meals.dinner) {
              document.getElementById('dinnerTitle').innerText = plan.meals.dinner.title || '-';
              document.getElementById('dinnerDesc').innerText = plan.meals.dinner.desc || '-';
              document.getElementById('dinnerCal').innerText = plan.meals.dinner.cal || '-';
            }
          }

          // 5. Tampilkan Hasil dan Scroll Halus
          planResult.classList.remove('hidden');
          planResult.scrollIntoView({ behavior: 'smooth' });
        } else {
          alert(data.error || 'Gagal merancang program. Silakan coba lagi.');
        }
      } catch (error) {
        console.error('Error generating plan:', error);
        alert('Terjadi kesalahan koneksi ke server. Pastikan backend berjalan!');
      } finally {
        // Restore Tombol ke Keadaan Semula
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
});