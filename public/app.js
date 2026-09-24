const API_BASE_URL = '/api/health';
const AUTH_API_URL = '/api/auth';

let daysList = [];
let selectedDayNumber = null;
let currentDayData = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
    setupEventListeners();
});

function setupEventListeners() {
    // Auth Tabs
    document.getElementById('tab-login').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('tab-register').addEventListener('click', () => switchAuthTab('register'));

    // Auth Forms
    document.getElementById('form-login').addEventListener('submit', handleLogin);
    document.getElementById('form-register').addEventListener('submit', handleRegister);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Dashboard Events
    document.getElementById('btn-add-day').addEventListener('click', addNewDay);
    document.getElementById('btn-back').addEventListener('click', showPage1);
    
    // Form Detail Events
    document.getElementById('btn-add-food').addEventListener('click', addFood);
    document.getElementById('btn-save-steps').addEventListener('click', saveSteps);
    document.getElementById('btn-add-workout').addEventListener('click', addWorkout);
    document.getElementById('btn-save-journal').addEventListener('click', saveJournal);

    ['check-shower', 'check-teeth', 'check-skincare'].forEach(id => {
        document.getElementById(id).addEventListener('change', saveHabits);
    });
}

// --- AUTHENTICATION LOGIC ---

async function checkAuthSession() {
    try {
        const res = await fetch(`${AUTH_API_URL}/me`);
        const data = await res.json();
        if (data.loggedIn) {
            currentUser = data.username;
            showDashboard();
        } else {
            showAuthPage();
        }
    } catch (err) {
        showAuthPage();
    }
}

function switchAuthTab(tab) {
    if (tab === 'login') {
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('tab-register').classList.remove('active');
        document.getElementById('form-login').classList.remove('hidden');
        document.getElementById('form-register').classList.add('hidden');
    } else {
        document.getElementById('tab-register').classList.add('active');
        document.getElementById('tab-login').classList.remove('active');
        document.getElementById('form-register').classList.remove('hidden');
        document.getElementById('form-login').classList.add('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${AUTH_API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            currentUser = data.username;
            showDashboard();
        } else {
            alert(data.error || 'Login gagal');
        }
    } catch (err) {
        alert('Terjadi kesalahan jaringan');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const res = await fetch(`${AUTH_API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (res.ok) {
            currentUser = data.username;
            showDashboard();
        } else {
            alert(data.error || 'Registrasi gagal');
        }
    } catch (err) {
        alert('Terjadi kesalahan jaringan');
    }
}

async function handleLogout() {
    try {
        await fetch(`${AUTH_API_URL}/logout`, { method: 'POST' });
        currentUser = null;
        showAuthPage();
    } catch (err) {
        console.error('Gagal logout');
    }
}

// --- NAVIGATION LOGIC ---

function showAuthPage() {
    document.getElementById('page-auth').classList.add('active');
    document.getElementById('page-1').classList.remove('active');
    document.getElementById('page-2').classList.remove('active');
    document.getElementById('user-bar').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('page-auth').classList.remove('active');
    document.getElementById('user-bar').classList.remove('hidden');
    document.getElementById('user-display-name').innerText = currentUser;
    showPage1();
}

function showPage1() {
    document.getElementById('page-1').classList.add('active');
    document.getElementById('page-2').classList.remove('active');
    fetchDaysList();
}

function showPage2(dayNumber) {
    selectedDayNumber = dayNumber;
    document.getElementById('current-day-title').innerText = `Form Detail: Hari Ke-${dayNumber}`;
    document.getElementById('page-1').classList.remove('active');
    document.getElementById('page-2').classList.add('active');
    fetchDayDetail(dayNumber);
}

// --- HEALTH DATA API CALLS ---

async function fetchDaysList() {
    try {
        const response = await fetch(API_BASE_URL);
        if (response.status === 401) return showAuthPage();
        daysList = await response.json();
        renderPage1();
    } catch (err) {
        console.error("Gagal mengambil daftar hari:", err);
    }
}

async function fetchDayDetail(dayNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/${dayNumber}`);
        if (response.status === 401) return showAuthPage();
        currentDayData = await response.json();
        renderPage2();
    } catch (err) {
        console.error("Gagal mengambil detail hari:", err);
    }
}

async function addNewDay() {
    const nextDayNum = daysList.length + 1;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
        await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dayNumber: nextDayNum, date: todayStr })
        });
        fetchDaysList();
    } catch (err) {
        console.error("Gagal menambah hari baru:", err);
    }
}

async function syncDataToBackend() {
    try {
        await fetch(`${API_BASE_URL}/${selectedDayNumber}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentDayData)
        });
        renderPage2();
    } catch (err) {
        console.error("Gagal menyimpan data:", err);
    }
}

// --- RENDER UI ---

function renderPage1() {
    const container = document.getElementById('days-container');
    container.innerHTML = '';

    if (daysList.length === 0) {
        container.innerHTML = `<p class="subtitle">Belum ada hari tersimpan. Klik "+ Tambah Hari Baru" untuk mulai!</p>`;
        return;
    }

    daysList.forEach(item => {
        const totalCal = (item.foods || []).reduce((acc, f) => acc + f.cal, 0);
        const card = document.createElement('div');
        card.className = 'day-card';
        card.onclick = () => showPage2(item.dayNumber);
        
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3>Hari Ke-${item.dayNumber}</h3>
                <small class="subtitle">${item.date}</small>
            </div>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid var(--border);">
            <div style="font-size: 0.88rem; display:grid; gap: 6px;">
                <span><i class="fa-solid fa-utensils text-orange"></i> Makanan: <b>${totalCal}</b> kcal</span>
                <span><i class="fa-solid fa-shoe-prints text-green"></i> Langkah: <b>${(item.steps || 0).toLocaleString()}</b></span>
                <span><i class="fa-solid fa-droplet text-blue"></i> Air Minum: <b>${item.water || 0}/8 Gelas</b></span>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderPage2() {
    if (!currentDayData) return;

    document.getElementById('current-date').value = currentDayData.date;

    // Foods
    const foodList = document.getElementById('food-list');
    foodList.innerHTML = '';
    let totalCal = 0;
    (currentDayData.foods || []).forEach((f, idx) => {
        totalCal += f.cal;
        foodList.innerHTML += `<li><span>${f.name}</span><span><b>${f.cal}</b> kcal <i class="fa-solid fa-xmark text-orange" style="cursor:pointer;" onclick="deleteFood(${idx})"></i></span></li>`;
    });
    document.getElementById('total-cal').innerText = totalCal;
    let calPct = Math.min(Math.round((totalCal / 2000) * 100), 100);
    document.getElementById('cal-pct').innerText = calPct + '%';
    document.getElementById('cal-bar').style.width = calPct + '%';

    // Steps
    const steps = currentDayData.steps || 0;
    document.getElementById('step-input').value = steps || '';
    document.getElementById('total-steps').innerText = steps.toLocaleString();
    let stepPct = Math.min(Math.round((steps / 10000) * 100), 100);
    document.getElementById('step-pct').innerText = stepPct + '%';
    document.getElementById('step-bar').style.width = stepPct + '%';

    // Workouts
    const workoutList = document.getElementById('workout-list');
    workoutList.innerHTML = '';
    (currentDayData.workouts || []).forEach((w, idx) => {
        workoutList.innerHTML += `<li><span>${w.name}</span><span><b>${w.min}</b> Mnt <i class="fa-solid fa-xmark text-orange" style="cursor:pointer;" onclick="deleteWorkout(${idx})"></i></span></li>`;
    });

    // Water
    const waterContainer = document.getElementById('water-container');
    waterContainer.innerHTML = '';
    for (let i = 1; i <= 8; i++) {
        const filled = i <= (currentDayData.water || 0) ? 'filled' : '';
        waterContainer.innerHTML += `<div class="glass ${filled}" onclick="setWater(${i})"><i class="fa-solid fa-droplet"></i></div>`;
    }

    // Habits
    document.getElementById('check-shower').checked = currentDayData.habits?.shower || false;
    document.getElementById('check-teeth').checked = currentDayData.habits?.teeth || false;
    document.getElementById('check-skincare').checked = currentDayData.habits?.skincare || false;

    // Journal
    document.getElementById('sleep-hours').value = currentDayData.sleep || '';
    document.getElementById('daily-notes').value = currentDayData.notes || '';
}

// Action Handlers
function addFood() {
    const name = document.getElementById('food-name').value.trim();
    const cal = parseInt(document.getElementById('food-cal').value);
    if (!name || isNaN(cal)) return alert('Harap masukan nama dan kalori makanan!');

    currentDayData.foods.push({ name, cal });
    document.getElementById('food-name').value = '';
    document.getElementById('food-cal').value = '';
    syncDataToBackend();
}

function deleteFood(index) {
    currentDayData.foods.splice(index, 1);
    syncDataToBackend();
}

function saveSteps() {
    currentDayData.steps = parseInt(document.getElementById('step-input').value) || 0;
    syncDataToBackend();
}

function addWorkout() {
    const name = document.getElementById('workout-name').value.trim();
    const min = parseInt(document.getElementById('workout-min').value);
    if (!name || isNaN(min)) return alert('Harap masukan jenis dan menit olahraga!');

    currentDayData.workouts.push({ name, min });
    document.getElementById('workout-name').value = '';
    document.getElementById('workout-min').value = '';
    syncDataToBackend();
}

function deleteWorkout(index) {
    currentDayData.workouts.splice(index, 1);
    syncDataToBackend();
}

function setWater(count) {
    currentDayData.water = (currentDayData.water === count) ? count - 1 : count;
    syncDataToBackend();
}

function saveHabits() {
    currentDayData.habits = {
        shower: document.getElementById('check-shower').checked,
        teeth: document.getElementById('check-teeth').checked,
        skincare: document.getElementById('check-skincare').checked
    };
    syncDataToBackend();
}

function saveJournal() {
    currentDayData.sleep = document.getElementById('sleep-hours').value;
    currentDayData.notes = document.getElementById('daily-notes').value;
    syncDataToBackend();
}