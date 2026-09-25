document.addEventListener('DOMContentLoaded', () => {
  const heightInput = document.getElementById('height');
  const weightInput = document.getElementById('weight');
  const ageInput = document.getElementById('age');
  const bmiValueEl = document.getElementById('bmiValue');
  const categoryNameEl = document.getElementById('categoryName');
  const weightDiffEl = document.getElementById('weightDifference');
  const normalRangeEl = document.getElementById('normalWeightRange');
  const gaugeNeedle = document.getElementById('gaugeNeedle');
  const genderBtns = document.querySelectorAll('.gender-btn');
  const refItems = document.querySelectorAll('#refList li');

  // Gender Switch Event
  genderBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      genderBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      calculateBMI();
    });
  });

  // Kalkulasi Otomatis Setiap Input Berubah
  [heightInput, weightInput, ageInput].forEach((input) => {
    if (input) {
      input.addEventListener('input', calculateBMI);
    }
  });

  function calculateBMI() {
    const heightCm = parseFloat(heightInput.value) || 0;
    const weightKg = parseFloat(weightInput.value) || 0;

    if (heightCm <= 0 || weightKg <= 0) return;

    const heightM = heightCm / 100;
    const bmi = (weightKg / (heightM * heightM)).toFixed(1);

    // Hitung Rentang Berat Normal (18.5 - 24.9)
    const minNormalWeight = (18.5 * (heightM * heightM)).toFixed(1);
    const maxNormalWeight = (24.9 * (heightM * heightM)).toFixed(1);

    bmiValueEl.innerText = bmi;
    normalRangeEl.innerText = `${minNormalWeight} - ${maxNormalWeight} kg`;

    // Tentukan Kategori & Selisih Berat
    let category = '';
    let catKey = '';
    let diff = 0;

    if (bmi < 15.0) {
      category = 'Bobot Sangat Rendah';
      catKey = 'very-low';
      diff = (weightKg - minNormalWeight).toFixed(1);
    } else if (bmi <= 16.9) {
      category = 'Sangat Kurang Bobot';
      catKey = 'severe-under';
      diff = (weightKg - minNormalWeight).toFixed(1);
    } else if (bmi <= 18.4) {
      category = 'Kurang Bobot';
      catKey = 'underweight';
      diff = (weightKg - minNormalWeight).toFixed(1);
    } else if (bmi <= 24.9) {
      category = 'Normal (Ideal)';
      catKey = 'normal';
      diff = 0;
    } else if (bmi <= 29.9) {
      category = 'Kelebihan Bobot';
      catKey = 'overweight';
      diff = (weightKg - maxNormalWeight).toFixed(1);
    } else if (bmi <= 34.9) {
      category = 'Obesitas Kelas I';
      catKey = 'obese1';
      diff = (weightKg - maxNormalWeight).toFixed(1);
    } else if (bmi <= 39.9) {
      category = 'Obesitas Kelas II';
      catKey = 'obese2';
      diff = (weightKg - maxNormalWeight).toFixed(1);
    } else {
      category = 'Obesitas Kelas III';
      catKey = 'obese3';
      diff = (weightKg - maxNormalWeight).toFixed(1);
    }

    categoryNameEl.innerText = category;

    // Teks Selisih Berat
    if (diff == 0) {
      weightDiffEl.innerText = 'Ideal';
      weightDiffEl.style.color = '#22c55e';
    } else {
      const sign = diff > 0 ? `+${diff}` : `${diff}`;
      weightDiffEl.innerText = `${sign} kg`;
      weightDiffEl.style.color = bmi < 18.5 ? '#0284c7' : '#ef4444';
    }

    // Sorot Kategori pada Tabel Referensi
    refItems.forEach((li) => {
      if (li.getAttribute('data-cat') === catKey) {
        li.classList.add('active');
      } else {
        li.classList.remove('active');
      }
    });

    // Animasikan Jarum Gauge Meter (-80deg s/d +80deg)
    let angle = -80 + ((bmi - 12) / (35 - 12)) * 160;
    if (angle < -80) angle = -80;
    if (angle > 80) angle = 80;
    gaugeNeedle.style.transform = `rotate(${angle}deg)`;
  }

  // Jalankan kalkulasi pertama kali
  calculateBMI();
});