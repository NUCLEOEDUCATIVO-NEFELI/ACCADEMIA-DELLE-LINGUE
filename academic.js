// Accademia delle Lingue - Sistema di Gestione

// Configurazione
const CONFIG = {
    APP_NAME: 'Accademia delle Lingue',
    VERSION: '2.0.0',
    STORAGE_KEY: 'accademia_data',
    CURRENT_USER: null
};

// Database simulato
let db = {
    users: [],
    scores: [],
    sessions: [],
    requests: []
};

// Inizializzazione
document.addEventListener('DOMContentLoaded', function() {
    initDatabase();
    checkAuth();
    setupEventListeners();
});

// Database Functions
function initDatabase() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (stored) {
        db = JSON.parse(stored);
    } else {
        // Utente admin di default
        db.users.push({
            id: 'admin001',
            email: 'admin@accademia.it',
            password: 'Admin2024!',
            name: 'Amministratore',
            role: 'admin',
            created: new Date().toISOString()
        });
        saveDatabase();
    }
}

function saveDatabase() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(db));
}

// Autenticazione
function checkAuth() {
    const user = sessionStorage.getItem('currentUser');
    if (user) {
        CONFIG.CURRENT_USER = JSON.parse(user);
        updateUI();
    } else {
        // Se non siamo nella pagina di login, redirect
        if (!window.location.href.includes('login') && 
            !window.location.href.includes('richiesta')) {
            window.location.href = 'pages/login.html';
        }
    }
}

function login(email, password) {
    const user = db.users.find(u => u.email === email && u.password === password);
    if (user) {
        CONFIG.CURRENT_USER = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));

        // Registra sessione
        db.sessions.push({
            userId: user.id,
            loginTime: new Date().toISOString(),
            ip: 'localhost'
        });
        saveDatabase();

        return { success: true, user: user };
    }
    return { success: false, error: 'Credenziali non valide' };
}

function logout() {
    sessionStorage.removeItem('currentUser');
    CONFIG.CURRENT_USER = null;
    window.location.href = 'pages/login.html';
}

function registerRequest(requestData) {
    db.requests.push({
        id: 'req_' + Date.now(),
        ...requestData,
        status: 'pending',
        created: new Date().toISOString()
    });
    saveDatabase();
    return true;
}

// Gestione Punteggi
function saveScore(moduleId, moduleName, score, maxScore, timeSpent) {
    if (!CONFIG.CURRENT_USER) return false;

    const scoreData = {
        id: 'score_' + Date.now(),
        userId: CONFIG.CURRENT_USER.id,
        userEmail: CONFIG.CURRENT_USER.email,
        userName: CONFIG.CURRENT_USER.name,
        moduleId: moduleId,
        moduleName: moduleName,
        score: score,
        maxScore: maxScore,
        percentage: Math.round((score / maxScore) * 100),
        timeSpent: timeSpent,
        completedAt: new Date().toISOString()
    };

    db.scores.push(scoreData);
    saveDatabase();

    // Invia email (simulato)
    sendScoreEmail(scoreData);

    return true;
}

function getUserScores(userId) {
    return db.scores.filter(s => s.userId === userId);
}

function getAllScores() {
    return db.scores;
}

// Export Excel
function exportToExcel(data, filename) {
    // Crea CSV
    let csv = '';

    if (data.length === 0) {
        alert('Nessun dato da esportare');
        return;
    }

    // Header
    const headers = Object.keys(data[0]);
    csv += headers.join(';') + '\n';

    // Dati
    data.forEach(row => {
        const values = headers.map(h => {
            let val = row[h];
            if (typeof val === 'string' && val.includes(';')) {
                val = '"' + val + '"';
            }
            return val;
        });
        csv += values.join(';') + '\n';
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename + '.csv';
    link.click();
}

function exportScores() {
    const scores = getAllScores();
    if (scores.length === 0) {
        alert('Nessun punteggio registrato');
        return;
    }

    const formatted = scores.map(s => ({
        'Data': new Date(s.completedAt).toLocaleString('it-IT'),
        'Studente': s.userName,
        'Email': s.userEmail,
        'Modulo': s.moduleName,
        'Livello': s.moduleId.includes('a1') ? 'A1' : 'A2',
        'Punteggio': s.score,
        'Max': s.maxScore,
        'Percentuale': s.percentage + '%',
        'Tempo (min)': Math.round(s.timeSpent / 60)
    }));

    exportToExcel(formatted, 'punteggi_accademia_' + new Date().toISOString().split('T')[0]);
}

function exportUsers() {
    const users = db.users.filter(u => u.role !== 'admin');
    if (users.length === 0) {
        alert('Nessun utente registrato');
        return;
    }

    const formatted = users.map(u => ({
        'ID': u.id,
        'Nome': u.name,
        'Email': u.email,
        'Ruolo': u.role,
        'Data Registrazione': new Date(u.created).toLocaleString('it-IT')
    }));

    exportToExcel(formatted, 'utenti_accademia_' + new Date().toISOString().split('T')[0]);
}

// Email Simulation
function sendScoreEmail(scoreData) {
    console.log('Email inviata a:', scoreData.userEmail);
    console.log('Oggetto: Risultato modulo ' + scoreData.moduleName);
    console.log('Punteggio:', scoreData.percentage + '%');
    // In produzione qui ci sarebbe una chiamata API al server email
}

// Password Generator
function generatePassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

// UI Updates
function updateUI() {
    if (CONFIG.CURRENT_USER) {
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        if (userNameEl) userNameEl.textContent = CONFIG.CURRENT_USER.name;
        if (userRoleEl) userRoleEl.textContent = CONFIG.CURRENT_USER.role === 'admin' ? 'Amministratore' : 'Studente';
    }
}

// Event Listeners
function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Form login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const result = login(email, password);

            if (result.success) {
                window.location.href = '../index.html';
            } else {
                showAlert('error', result.error);
            }
        });
    }

    // Form richiesta accesso
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = {
                name: document.getElementById('reqName').value,
                email: document.getElementById('reqEmail').value,
                institution: document.getElementById('reqInstitution').value,
                motivation: document.getElementById('reqMotivation').value
            };

            if (registerRequest(formData)) {
                showAlert('success', 'Richiesta inviata con successo! Riceverai una risposta via email.');
                requestForm.reset();
            }
        });
    }

    // Admin: Genera password
    const genPassBtn = document.getElementById('generatePassword');
    if (genPassBtn) {
        genPassBtn.addEventListener('click', function() {
            const password = generatePassword();
            document.getElementById('generatedPassword').textContent = password;
        });
    }

    // Admin: Export punteggi
    const exportScoresBtn = document.getElementById('exportScores');
    if (exportScoresBtn) {
        exportScoresBtn.addEventListener('click', exportScores);
    }

    // Admin: Export utenti
    const exportUsersBtn = document.getElementById('exportUsers');
    if (exportUsersBtn) {
        exportUsersBtn.addEventListener('click', exportUsers);
    }
}

// Alert
function showAlert(type, message) {
    const alertBox = document.getElementById('alertBox');
    if (alertBox) {
        alertBox.className = 'alert alert-' + type;
        alertBox.innerHTML = type === 'success' ? '✅ ' + message : '❌ ' + message;
        alertBox.style.display = 'flex';
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
}

// Navigation
function showDashboard() {
    document.getElementById('dashboard-view').classList.remove('hidden');
    document.querySelectorAll('.game-container').forEach(el => el.classList.remove('active'));
    updateNav('dashboard');
}

function loadGame(gameId) {
    document.getElementById('dashboard-view').classList.add('hidden');
    document.querySelectorAll('.game-container').forEach(el => el.classList.remove('active'));
    document.getElementById(gameId).classList.add('active');
    updateNav(gameId);
}

function updateNav(activeId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.getElementById('nav-' + activeId);
    if (navItem) navItem.classList.add('active');
}

// Admin Functions
function loadAdminData() {
    if (!CONFIG.CURRENT_USER || CONFIG.CURRENT_USER.role !== 'admin') {
        window.location.href = '../index.html';
        return;
    }

    // Carica statistiche
    document.getElementById('totalUsers').textContent = db.users.length;
    document.getElementById('totalScores').textContent = db.scores.length;
    document.getElementById('pendingRequests').textContent = db.requests.filter(r => r.status === 'pending').length;

    // Carica tabella punteggi
    const scoresTable = document.getElementById('scoresTable');
    if (scoresTable) {
        const tbody = scoresTable.querySelector('tbody');
        tbody.innerHTML = db.scores.map(s => `
            <tr>
                <td>${new Date(s.completedAt).toLocaleDateString('it-IT')}</td>
                <td>${s.userName}</td>
                <td>${s.moduleName}</td>
                <td>${s.score}/${s.maxScore}</td>
                <td>${s.percentage}%</td>
            </tr>
        `).join('');
    }
}

// Modulo completato - chiamato dalle pagine dei giochi
function moduleCompleted(moduleId, moduleName, score, maxScore) {
    const timeSpent = 1200; // 20 minuti default, da calcolare reale
    saveScore(moduleId, moduleName, score, maxScore, timeSpent);

    // Mostra conferma
    if (confirm('Modulo completato! Punteggio: ' + score + '/' + maxScore + '\n\nVuoi tornare alla dashboard?')) {
        showDashboard();
    }
}
