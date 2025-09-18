// script.js - Erweiterte Funktionalität: Demo Login/Register, verbesserte Autosave ohne Message, Suche, User-spezifische Speicherung

class AuthManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('notlifier-users')) || {};
        this.currentUser = localStorage.getItem('notlifier-current-user');
        this.initAuth();
    }

    initAuth() {
        if (this.currentUser) {
            this.showApp();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        document.getElementById('app-container').style.display = 'none';
        document.getElementById('auth-overlay').style.display = 'flex';
        this.bindAuthEvents();
    }

    showApp() {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('user-welcome').textContent = `Hallo, ${this.currentUser}!`;
        // Initialisiere NoteApp mit User
        new NoteApp(this.currentUser);
    }

    bindAuthEvents() {
        // Tabs
        document.getElementById('login-tab').addEventListener('click', () => this.switchTab('login'));
        document.getElementById('register-tab').addEventListener('click', () => this.switchTab('register'));

        // Forms
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    }

    switchTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById(tab === 'login' ? 'login-tab' : 'register-tab').classList.add('active');
        document.getElementById('login-form').style.display = tab === 'login' ? 'flex' : 'none';
        document.getElementById('register-form').style.display = tab === 'register' ? 'flex' : 'none';
        document.getElementById('auth-message').innerHTML = '';
    }

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const messageEl = document.getElementById('auth-message');

        if (this.users[username] && this.users[username] === password) {
            localStorage.setItem('notlifier-current-user', username);
            this.currentUser = username;
            messageEl.innerHTML = '<div class="success">Erfolgreich angemeldet!</div>';
            setTimeout(() => this.showApp(), 1000);
        } else {
            messageEl.innerHTML = '<div class="error">Ungültiger Benutzername oder Passwort.</div>';
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('register-username').value.trim();
        const password = document.getElementById('register-password').value;
        const email = document.getElementById('register-email').value.trim();
        const messageEl = document.getElementById('auth-message');

        if (this.users[username]) {
            messageEl.innerHTML = '<div class="error">Benutzername bereits vergeben.</div>';
            return;
        }

        if (password.length < 4) {
            messageEl.innerHTML = '<div class="error">Passwort muss mindestens 4 Zeichen lang sein.</div>';
            return;
        }

        this.users[username] = password;
        localStorage.setItem('notlifier-users', JSON.stringify(this.users));
        messageEl.innerHTML = '<div class="success">Registrierung erfolgreich! Du kannst dich nun anmelden.</div>';
        this.switchTab('login');
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = password;
    }

    logout() {
        localStorage.removeItem('notlifier-current-user');
        this.currentUser = null;
        this.showAuth();
    }
}

class NoteApp {
    constructor(username) {
        this.username = username;
        this.notesKey = `notlifier-notes-${username}`;
        this.notes = JSON.parse(localStorage.getItem(this.notesKey)) || [];
        this.currentNoteId = null;
        this.saveTimeout = null;
        this.init();
    }

    init() {
        this.renderNotesList();
        this.bindEvents();
        if (this.notes.length > 0) {
            this.loadNote(this.notes[0].id);
        } else {
            this.setEmptyState();
        }
    }

    bindEvents() {
        document.getElementById('new-note-btn').addEventListener('click', () => this.createNewNote());
        document.getElementById('save-note-btn').addEventListener('click', () => this.saveCurrentNote(true));
        document.getElementById('delete-note-btn').addEventListener('click', () => this.deleteCurrentNote());
        document.getElementById('note-editor').addEventListener('input', () => this.autoSave());
        document.getElementById('search-notes').addEventListener('input', (e) => this.filterNotes(e.target.value));
    }

    createNewNote() {
        const id = Date.now();
        const newNote = {
            id,
            title: `Notiz ${this.notes.length + 1}`,
            content: '',
            createdAt: new Date().toISOString()
        };
        this.notes.unshift(newNote);
        this.saveToStorage();
        this.renderNotesList();
        this.loadNote(id);
    }

    renderNotesList(filteredNotes = this.notes) {
        const list = document.getElementById('notes-list');
        list.innerHTML = '';
        filteredNotes.forEach(note => {
            const item = document.createElement('div');
            item.className = `note-item ${this.currentNoteId === note.id ? 'active' : ''}`;
            item.innerHTML = `
                <div class="note-item-icon">${note.title.charAt(0).toUpperCase()}</div>
                <div class="note-item-title">${note.title}</div>
            `;
            item.addEventListener('click', () => this.loadNote(note.id));
            list.appendChild(item);
        });
    }

    filterNotes(query) {
        const filtered = this.notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        );
        this.renderNotesList(filtered);
    }

    loadNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        this.currentNoteId = id;
        document.getElementById('current-note-title').innerHTML = `<i class="fas fa-edit"></i> ${note.title}`;
        const editor = document.getElementById('note-editor');
        editor.innerHTML = note.content;
        document.getElementById('delete-note-btn').style.display = 'flex';
        this.renderNotesList();
    }

    saveCurrentNote(manual = false) {
        if (!this.currentNoteId) return;
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (note) {
            note.content = document.getElementById('note-editor').innerHTML;
            const firstLine = note.content.replace(/<[^>]*>/g, '').trim().substring(0, 50) || `Notiz ${this.notes.indexOf(note) + 1}`;
            note.title = firstLine;
            this.saveToStorage();
            this.renderNotesList();
            // Keine Message mehr, weder auto noch manual
        }
    }

    autoSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveCurrentNote(false), 1000);
    }

    deleteCurrentNote() {
        if (!this.currentNoteId || !confirm('Notiz wirklich löschen?')) return;
        this.notes = this.notes.filter(n => n.id !== this.currentNoteId);
        this.saveToStorage();
        this.currentNoteId = null;
        document.getElementById('delete-note-btn').style.display = 'none';
        this.setEmptyState();
        this.renderNotesList();
    }

    setEmptyState() {
        document.getElementById('current-note-title').innerHTML = '<i class="fas fa-lightbulb"></i> Willkommen! Erstelle deine erste Notiz.';
        document.getElementById('note-editor').innerHTML = '';
        document.getElementById('delete-note-btn').style.display = 'none';
    }

    saveToStorage() {
        localStorage.setItem(this.notesKey, JSON.stringify(this.notes));
    }
}

// Initialisiere Auth
new AuthManager();