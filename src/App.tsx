import React, { useState } from 'react';
import { Routes, Route, useNavigate, Link, Navigate } from 'react-router-dom';
import CompareTabView from './components/CompareTabView';
import ActuatorDetail from './components/ActuatorDetail';
import ActuatorForm from './components/ActuatorForm';
import LoginPage from './components/LoginPage';
import FormulaAdminPage from './components/FormulaAdminPage';

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

  // Define the max width for the content inside nav and center it
  const contentMaxWidth = 1200;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'sans-serif' }}>
      {/* Nav bar full width background */}
      <header
        style={{
          width: '100vw',
          backgroundColor: '#1e293b',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        }}
      >
        {/* Centered container inside nav */}
        <div
          style={{
            maxWidth: contentMaxWidth,
            margin: '0 auto',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Link to="/" style={{ color: 'skyblue', fontWeight: 'bold', fontSize: '1.2rem', textDecoration: 'none' }}>
            Actuator Database
          </Link>
          <nav>
            {isAdmin && (
              <Link
                to="/admin-formulas"
                style={{ marginRight: '1rem', color: 'lightgreen', textDecoration: 'none' }}
              >
                Edit Formulas
              </Link>
            )}
            {user ? (
              <>
                <span style={{ marginRight: '1rem' }}>Logged in as: {user.username}</span>
                <button onClick={handleLogout} style={buttonStyle}>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" style={buttonStyle}>
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main content area with full width and horizontal scroll */}
      <main
        style={{
          width: '100vw',
          overflowX: 'auto',
          padding: '1rem',
          minHeight: 'calc(100vh - 56px)', // Adjust for nav height
          boxSizing: 'border-box',
        }}
      >
        <Routes>
          <Route path="/" element={<CompareTabView isAdmin={isAdmin} />} />
          <Route path="/actuator/:id" element={<ActuatorDetail isAdmin={isAdmin} />} />
          <Route
            path="/add-actuator"
            element={isAdmin ? <ActuatorForm isAdmin={isAdmin} /> : <AccessDenied />}
          />
          <Route
            path="/admin-formulas"
            element={isAdmin ? <FormulaAdminPage /> : <AccessDenied />}
          />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/compare" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AccessDenied() {
  return <p style={{ color: 'tomato' }}>Access denied. You must be an admin to access this page.</p>;
}

const buttonStyle: React.CSSProperties = {
  padding: '0.4rem 0.8rem',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  textDecoration: 'none',
};
