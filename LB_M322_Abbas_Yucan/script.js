import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, doc } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCRjpvVN3jl3Dgb2vDJfBkSrs__v0PFfFU",
    authDomain: "notlifier.firebaseapp.com",
    projectId: "notlifier",
    storageBucket: "notlifier.firebasestorage.app",
    messagingSenderId: "412522484510",
    appId: "1:412522484510:web:01b254478a75255a4e6f0f",
    measurementId: "G-FNV435S131"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initAuth();
        this.bindThemeToggle();
        this.bindSidebarToggle();
    }

    initAuth() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = user;
                this.showApp();
            } else {
                this.currentUser = null;
                this.showAuth();
            }
        }, (error) => {
            console.error('Auth state change error:', error);
            document.getElementById('auth-message').innerHTML = `<div class="error">Fehler bei der Authentifizierung: ${error.message}</div>`;
        });
    }

    bindThemeToggle() {
        const toggle = document.getElementById('theme-toggle');
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            toggle.innerHTML = `<i class="fas fa-${document.body.classList.contains('dark-mode') ? 'sun' : 'moon'}"></i>`;
        });
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            toggle.innerHTML = `<i class="fas fa-sun"></i>`;
        }
    }

    bindSidebarToggle() {
        const toggle = document.getElementById('sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        toggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    showAuth() {
        // Ensure app container is hidden and auth overlay is shown
        const appContainer = document.getElementById('app-container');
        const authOverlay = document.getElementById('auth-overlay');
        const sidebar = document.querySelector('.sidebar');
        const notesList = document.getElementById('notes-list');
        const noteEditor = document.getElementById('note-editor');
        const noteTitle = document.getElementById('current-note-title');
        const noteCategory = document.getElementById('note-category');
        const deleteBtn = document.getElementById('delete-note-btn');
        const authMessage = document.getElementById('auth-message');

        appContainer.style.display = 'none';
        authOverlay.style.display = 'flex';
        sidebar.classList.remove('open');
        notesList.innerHTML = '';
        noteEditor.innerHTML = '';
        noteTitle.innerHTML = '<i class="fas fa-lightbulb"></i> Willkommen! Erstelle deine erste Notiz.';
        noteCategory.style.display = 'none';
        deleteBtn.style.display = 'none';
        authMessage.innerHTML = '';

        // Rebind auth events to ensure they are active
        this.bindAuthEvents();
    }

    showApp() {
        document.getElementById('auth-overlay').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';
        document.getElementById('user-welcome').textContent = `Hallo, ${this.currentUser.email.split('@')[0]}!`;
        new NoteApp(this.currentUser.uid);
    }

    bindAuthEvents() {
        // Remove existing listeners to prevent duplicates
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const logoutBtn = document.getElementById('logout-btn');

        const newLoginTab = loginTab.cloneNode(true);
        const newRegisterTab = registerTab.cloneNode(true);
        const newLoginForm = loginForm.cloneNode(true);
        const newRegisterForm = registerForm.cloneNode(true);
        const newLogoutBtn = logoutBtn.cloneNode(true);

        loginTab.parentNode.replaceChild(newLoginTab, loginTab);
        registerTab.parentNode.replaceChild(newRegisterTab, registerTab);
        loginForm.parentNode.replaceChild(newLoginForm, loginForm);
        registerForm.parentNode.replaceChild(newRegisterForm, registerForm);
        logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);

        newLoginTab.addEventListener('click', () => this.switchTab('login'));
        newRegisterTab.addEventListener('click', () => this.switchTab('register'));
        newLoginForm.addEventListener('submit', (e) => this.handleLogin(e));
        newRegisterForm.addEventListener('submit', (e) => this.handleRegister(e));
        newLogoutBtn.addEventListener('click', () => this.logout());
    }

    switchTab(tab) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById(tab === 'login' ? 'login-tab' : 'register-tab').classList.add('active');
        document.getElementById('login-form').style.display = tab === 'login' ? 'flex' : 'none';
        document.getElementById('register-form').style.display = tab === 'register' ? 'flex' : 'none';
        document.getElementById('auth-message').innerHTML = '';
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const messageEl = document.getElementById('auth-message');
        const submitBtn = document.querySelector('#login-form .btn-primary');
        submitBtn.disabled = true;
        submitBtn.querySelector('.spinner').style.display = 'inline-block';

        try {
            await signInWithEmailAndPassword(auth, email, password);
            messageEl.innerHTML = '<div class="success">Erfolgreich angemeldet!</div>';
        } catch (error) {
            messageEl.innerHTML = `<div class="error">Fehler: ${error.message}</div>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('.spinner').style.display = 'none';
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const messageEl = document.getElementById('auth-message');
        const submitBtn = document.querySelector('#register-form .btn-primary');
        submitBtn.disabled = true;
        submitBtn.querySelector('.spinner').style.display = 'inline-block';

        if (password.length < 6) {
            messageEl.innerHTML = '<div class="error">Passwort muss mindestens 6 Zeichen lang sein.</div>';
            submitBtn.disabled = false;
            submitBtn.querySelector('.spinner').style.display = 'none';
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            messageEl.innerHTML = '<div class="success">Registrierung erfolgreich! Du kannst dich nun anmelden.</div>';
            this.switchTab('login');
            document.getElementById('login-email').value = email;
            document.getElementById('login-password').value = password;
        } catch (error) {
            messageEl.innerHTML = `<div class="error">Fehler: ${error.message}</div>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.querySelector('.spinner').style.display = 'none';
        }
    }

    async logout() {
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.disabled = true;
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Abmelden <span class="spinner" style="display: inline-block;"></span>';
        const messageEl = document.getElementById('auth-message');

        try {
            await signOut(auth);
            this.currentUser = null;
            messageEl.innerHTML = '<div class="success">Erfolgreich abgemeldet!</div>';
            this.showAuth();
        } catch (error) {
            console.error('Logout error:', error);
            messageEl.innerHTML = `<div class="error">Fehler beim Abmelden: ${error.message}</div>`;
        } finally {
            logoutBtn.disabled = false;
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Abmelden';
        }
    }
}

class NoteApp {
    constructor(userId) {
        this.userId = userId;
        this.notes = [];
        this.currentNoteId = null;
        this.saveTimeout = null;
        this.init();
    }

    init() {
        this.setupFirestoreListener();
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('new-note-btn').addEventListener('click', () => {
            this.createNewNote();
            document.querySelector('.sidebar').classList.remove('open');
        });
        document.getElementById('save-note-btn').addEventListener('click', () => this.saveCurrentNote(true));
        document.getElementById('delete-note-btn').addEventListener('click', () => this.deleteCurrentNote());
        document.getElementById('note-editor').addEventListener('input', () => this.autoSave());
        document.getElementById('search-notes').addEventListener('input', (e) => this.filterNotes(e.target.value));
        document.getElementById('category-filter').addEventListener('change', (e) => this.filterNotesByCategory(e.target.value));
        document.getElementById('note-category').addEventListener('change', () => this.saveCurrentNote(false));
    }

    setupFirestoreListener() {
        const notesQuery = query(collection(db, `users/${this.userId}/notes`), orderBy('createdAt', 'desc'));
        onSnapshot(notesQuery, (snapshot) => {
            this.notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.renderNotesList();
            if (this.notes.length > 0 && !this.currentNoteId) {
                this.loadNote(this.notes[0].id);
            } else if (this.notes.length === 0) {
                this.setEmptyState();
            }
        }, (error) => {
            console.error('Firestore listener error:', error);
            document.getElementById('auth-message').innerHTML = `<div class="error">Fehler beim Laden der Notizen: ${error.message}</div>`;
        });
    }

    async createNewNote() {
        try {
            const newNote = {
                title: `Notiz ${this.notes.length + 1}`,
                content: '',
                category: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, `users/${this.userId}/notes`), newNote);
            this.loadNote(docRef.id);
        } catch (error) {
            console.error('Error creating note:', error);
            document.getElementById('auth-message').innerHTML = `<div class="error">Fehler beim Erstellen der Notiz: ${error.message}</div>`;
        }
    }

    renderNotesList(filteredNotes = this.notes, searchQuery = '') {
        const list = document.getElementById('notes-list');
        list.innerHTML = '';
        filteredNotes.forEach(note => {
            const item = document.createElement('div');
            item.className = `note-item ${this.currentNoteId === note.id ? 'active' : ''}`;
            const title = searchQuery ? 
                note.title.replace(new RegExp(searchQuery, 'gi'), match => `<mark>${match}</mark>`) :
                note.title;
            item.innerHTML = `
                <div class="note-item-icon">${note.title.charAt(0).toUpperCase()}</div>
                <div class="note-item-title">${title}${note.category ? ` <small>(${note.category})</small>` : ''}</div>
            `;
            item.addEventListener('click', () => {
                this.loadNote(note.id);
                document.querySelector('.sidebar').classList.remove('open');
            });
            list.appendChild(item);
        });
    }

    filterNotes(query) {
        const filtered = this.notes.filter(note => 
            note.title.toLowerCase().includes(query.toLowerCase()) ||
            note.content.toLowerCase().includes(query.toLowerCase())
        );
        const category = document.getElementById('category-filter').value;
        this.renderNotesList(category ? filtered.filter(note => note.category === category) : filtered, query);
    }

    filterNotesByCategory(category) {
        const searchQuery = document.getElementById('search-notes').value;
        const filtered = category ? 
            this.notes.filter(note => note.category === category) : 
            this.notes;
        this.renderNotesList(filtered, searchQuery);
    }

    loadNote(id) {
        const note = this.notes.find(n => n.id === id);
        if (!note) return;

        this.currentNoteId = id;
        document.getElementById('current-note-title').innerHTML = `<i class="fas fa-edit"></i> ${note.title}`;
        const editor = document.getElementById('note-editor');
        editor.innerHTML = note.content;
        const categorySelect = document.getElementById('note-category');
        categorySelect.value = note.category || '';
        categorySelect.style.display = 'block';
        document.getElementById('delete-note-btn').style.display = 'flex';
        this.renderNotesList();
    }

    async saveCurrentNote(manual = false) {
        if (!this.currentNoteId) return;
        const note = this.notes.find(n => n.id === this.currentNoteId);
        if (note) {
            const content = document.getElementById('note-editor').innerHTML;
            const firstLine = content.replace(/<[^>]*>/g, '').trim().substring(0, 50) || `Notiz ${this.notes.indexOf(note) + 1}`;
            const category = document.getElementById('note-category').value;
            const saveIndicator = document.getElementById('save-indicator');
            saveIndicator.classList.add('active');
            try {
                await updateDoc(doc(db, `users/${this.userId}/notes`, this.currentNoteId), {
                    title: firstLine,
                    content: content,
                    category: category,
                    updatedAt: new Date().toISOString()
                });
                setTimeout(() => saveIndicator.classList.remove('active'), 1500);
            } catch (error) {
                console.error('Error saving note:', error);
                document.getElementById('auth-message').innerHTML = `<div class="error">Fehler beim Speichern: ${error.message}</div>`;
            }
        }
    }

    autoSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveCurrentNote(false), 1000);
    }

    async deleteCurrentNote() {
        if (!this.currentNoteId || !confirm('Notiz wirklich löschen?')) return;
        try {
            await deleteDoc(doc(db, `users/${this.userId}/notes`, this.currentNoteId));
            this.currentNoteId = null;
            document.getElementById('delete-note-btn').style.display = 'none';
            document.getElementById('note-category').style.display = 'none';
            this.setEmptyState();
        } catch (error) {
            console.error('Error deleting note:', error);
            document.getElementById('auth-message').innerHTML = `<div class="error">Fehler beim Löschen: ${error.message}</div>`;
        }
    }

    setEmptyState() {
        document.getElementById('current-note-title').innerHTML = '<i class="fas fa-lightbulb"></i> Willkommen! Erstelle deine erste Notiz.';
        document.getElementById('note-editor').innerHTML = '';
        document.getElementById('note-category').style.display = 'none';
        document.getElementById('delete-note-btn').style.display = 'none';
    }
}

// Initialize Auth
new AuthManager();