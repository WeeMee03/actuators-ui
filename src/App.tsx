import { Routes, Route, useNavigate } from 'react-router-dom';
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

  return (
    <div style={{ padding: '2rem' }}>
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
