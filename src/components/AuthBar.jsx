// src/components/AuthBar.jsx
import React, { useState } from 'react';
import { register, login, logout } from '../utils/sync.js';

export default function AuthBar() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: '', password: '' });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="p-2 border-b flex gap-2 items-center">
      {!user ? (
        <>
          <input
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
          />
          <button
            onClick={async () => {
              try {
                await register(form.username, form.password);
                alert('Registered!');
              } catch (err) {
                alert('Registration failed: ' + err.message);
              }
            }}
          >
            Register
          </button>
          <button
            onClick={async () => {
              try {
                const u = await login(form.username, form.password);
                setUser(u);
              } catch (err) {
                alert('Login failed: ' + err.message);
              }
            }}
          >
            Login
          </button>
        </>
      ) : (
        <>
          <span>Welcome {user.username}</span>
          <button
            onClick={async () => {
              await logout();
              setUser(null);
            }}
          >
            Logout
          </button>
        </>
      )}
    </div>
  );
}
