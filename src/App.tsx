import React, { useState } from 'react';
import { Routes, Route, useNavigate, Link, Navigate } from 'react-router-dom';
import CompareTabView from './components/CompareTabView';
import ActuatorDetail from './components/ActuatorDetail';
import ActuatorForm from './components/ActuatorForm';
import LoginPage from './components/LoginPage';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const isAdmin = user?.is_admin ?? false;
  const navigate = useNavigate();

  const handleLogin = React.useCallback((userData: any) => {
    setUser(userData);
    navigate('/');
  }, [navigate]);

  const handleLogout = React.useCallback(() => {
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      {/* Top nav bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <Link to="/" style={{ color: 'skyblue', fontWeight: 'bold' }}>Actuator Database</Link>
        <div>
          {user ? (
            <>
              <span style={{ marginRight: '1rem' }}>Logged in as: {user.username}</span>
              <button onClick={handleLogout} style={buttonStyle}>Logout</button>
            </>
          ) : (
            <Link to="/login" style={buttonStyle}>Login</Link>
          )}
        </div>
      </div>

      {/* Routes */}
      <Routes>
        {/* Main page shows the table + compare tabs */}
        <Route path="/" element={<CompareTabView isAdmin={isAdmin} />} />

        {/* Detail page */}
        <Route path="/actuator/:id" element={<ActuatorDetail isAdmin={isAdmin} />} />

        {/* Add actuator page for admins */}
        <Route
          path="/add-actuator"
          element={
            isAdmin ? (
              <ActuatorForm isAdmin={isAdmin} />
            ) : (
              <p style={{ color: 'tomato' }}>
                Access denied. You must be an admin to add actuators.
              </p>
            )
          }
        />

        {/* Login page */}
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />

        {/* Redirect old /compare route to / */}
        <Route path="/compare" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  textDecoration: 'none',
  cursor: 'pointer',
};
