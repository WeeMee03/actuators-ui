import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import ActuatorTable from './components/ActuatorTable';
import ActuatorDetail from './components/ActuatorDetail';
import ActuatorForm from './components/ActuatorForm';
import LoginPage from './components/LoginPage';

export default function App() {
  const [user, setUser] = useState<any>(null); // {username, is_admin, ...}
  const isAdmin = user?.is_admin ?? false;
  const navigate = useNavigate();

  // Called by LoginPage on successful login
  function handleLogin(userData: any) {
    setUser(userData);
    navigate('/'); // redirect to main page after login
  }

  // Logout handler
  function handleLogout() {
    setUser(null);
    navigate('/login');
  }

  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      {/* Simple top nav bar */}
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

      {/* Page routes */}
      <Routes>
        <Route path="/" element={<ActuatorTable isAdmin={isAdmin} />} />
        <Route path="/actuator/:id" element={<ActuatorDetail isAdmin={isAdmin} />} />
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
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
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
