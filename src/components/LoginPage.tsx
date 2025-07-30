import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = React.useCallback(async () => {
    setError('');
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      setError('Invalid username or password');
    } else {
      onLogin(data);
    }
  }, [username, password, onLogin]);

  return (
    <div style={{ maxWidth: 320, margin: '2rem auto', color: 'white' }}>
      <h2>Admin Login</h2>
      <input
        style={inputStyle}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        autoComplete="username"
      />
      <input
        style={inputStyle}
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        autoComplete="current-password"
      />
      <button onClick={handleLogin} style={buttonStyle}>
        Login
      </button>
      {error && <p style={{ color: 'tomato' }}>{error}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  marginBottom: '1rem',
  borderRadius: 4,
  border: '1px solid #ccc',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
};
