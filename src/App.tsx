import { Routes, Route } from 'react-router-dom';
import ActuatorTable from './components/ActuatorTable';
import ActuatorDetail from './components/ActuatorDetail';
import ActuatorForm from './components/ActuatorForm';

export default function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <Routes>
        <Route path="/" element={<ActuatorTable />} />
        <Route path="/actuator/:id" element={<ActuatorDetail />} />
        <Route path="/add-actuator" element={<ActuatorForm />} />
      </Routes>
    </div>
  );
}