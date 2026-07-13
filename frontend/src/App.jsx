import React, { useState, useEffect } from 'react';
import './App.css';

// Dynamically sets the backend URL based on Render environment variable or falls back to production link
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://devdiary-backend-betk.onrender.com";

export default function App() {
  const [view, setView] = useState('login'); // active states: login, signup, dashboard
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [notes, setNotes] = useState([]);
  const [publicNotes, setPublicNotes] = useState([]);

  // State variables for form control inputs
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [noteForm, setNoteForm] = useState({ title: '', content: '' });

  const handleAuthInput = (e) => setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  const handleNoteInput = (e) => setNoteForm({ ...noteForm, [e.target.name]: e.target.value });

  // Combined function handling backend Login and Sign Up endpoints
  const handleAuthSubmit = async (endpoint) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();

      if (res.ok) {
        if (endpoint === 'login') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('username', data.username);
          setToken(data.token);
          setUsername(data.username);
          setView('dashboard');
        } else {
          alert('Registration successful! Turning over to login panel.');
          setView('login');
        }
      } else {
        alert(data.message || 'Authentication lifecycle error');
      }
    } catch (err) {
      alert('Cannot establish backend pipeline link.');
    }
  };

  // RESTful GET Route: Protected user notes data
  const fetchUserNotes = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setNotes(data);
    } catch (err) {
      console.error("Error fetching private logs:", err);
    }
  };

  // RESTful GET Route: Public exposed notes data accessible without token
  const fetchPublicNotes = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes/public`);
      const data = await res.json();
      if (res.ok) setPublicNotes(data);
    } catch (err) {
      console.error("Error fetching public feed:", err);
    }
  };

  // RESTful POST Route: Protected creation route
  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(noteForm)
      });
      if (res.ok) {
        setNoteForm({ title: '', content: '' });
        fetchUserNotes();
      } else {
        const errorData = await res.json();
        alert(errorData.message);
      }
    } catch (err) {
      alert("Failed to save log entry.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setUsername('');
    setNotes([]);
    setView('login');
  };

  // Watch view states to pull relevant model collections
  useEffect(() => {
    fetchPublicNotes();
    if (token) {
      setView('dashboard');
      fetchUserNotes();
    }
  }, [token]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>DevDiary Hub</h1>
          <p className="app-subtext">Track your bugs, document your wins, and share knowledge.</p>
        </div>
      </header>

      {view === 'login' && (
        <section className="auth-panel card">
          <h2>Account Authentication</h2>
          <div className="form-grid">
            <input
              className="input-field"
              name="email"
              type="email"
              placeholder="Email Address"
              value={authForm.email}
              onChange={handleAuthInput}
            />
            <input
              className="input-field"
              name="password"
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={handleAuthInput}
            />
            <button className="primary-button" onClick={() => handleAuthSubmit('login')}>Sign In</button>
          </div>
          <p className="caption-text">
            New user? <button className="link-button" onClick={() => setView('signup')}>Create account here</button>
          </p>
        </section>
      )}

      {view === 'signup' && (
        <section className="auth-panel card">
          <h2>System Registration</h2>
          <div className="form-grid">
            <input
              className="input-field"
              name="username"
              type="text"
              placeholder="Username"
              value={authForm.username}
              onChange={handleAuthInput}
            />
            <input
              className="input-field"
              name="email"
              type="email"
              placeholder="Email Address"
              value={authForm.email}
              onChange={handleAuthInput}
            />
            <input
              className="input-field"
              name="password"
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={handleAuthInput}
            />
            <button className="primary-button" onClick={() => handleAuthSubmit('signup')}>Register Base Identity</button>
          </div>
          <p className="caption-text">
            Existing identity? <button className="link-button" onClick={() => setView('login')}>Return to login</button>
          </p>
        </section>
      )}

      {view === 'dashboard' && (
        <main className="dashboard-layout">
          <section className="profile-badge card">
            <div>
              <p className="badge-label">Logged in as Developer</p>
              <p className="badge-username">{username}</p>
            </div>
            <button className="secondary-button" onClick={handleLogout}>Logout</button>
          </section>

          <section className="card note-form-card">
            <div className="section-header">
              <h2>Log a New Feature or Bug Fix</h2>
            </div>
            <form onSubmit={handleCreateNote} className="form-grid">
              <input
                className="input-field"
                name="title"
                type="text"
                placeholder="Bug Title or Feature Name (e.g., Fix JWT expiration crash)"
                value={noteForm.title}
                onChange={handleNoteInput}
                required
              />
              <textarea
                className="textarea-field"
                name="content"
                placeholder="Provide details: Root cause, solution implemented, or useful code snippets..."
                value={noteForm.content}
                onChange={handleNoteInput}
                required
              />
              <button type="submit" className="primary-button">Save to Dev Log</button>
            </form>
          </section>

          <section className="card terminal-log-card">
            <div className="section-header">
              <h2>Your Private Engineering Logs</h2>
            </div>
            {notes.length === 0 ? (
              <p className="empty-state">No private logs have been saved under this token yet. Start tracking fixes and features now.</p>
            ) : (
              <div className="terminal-feed">
                {notes.map((note) => (
                  <article key={note.id} className="log-entry">
                    <div className="log-meta">{note.title}</div>
                    <pre>{note.content}</pre>
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      <section className="public-feed card">
        <div className="section-header">
          <h2>Community Tech Share (Public Feed)</h2>
        </div>
        <p className="section-subtext">Recent updates shared publicly by developers.</p>
        {publicNotes.length === 0 ? (
          <p className="empty-state">No public logs are available yet. Contributions will appear here once users share them.</p>
        ) : (
          <div className="feed-list">
            {publicNotes.map((note) => (
              <div key={note.id} className="feed-item">
                <span className="feed-title">{note.title}</span>
                <span className="feed-meta">User ID: {note.user_id}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
