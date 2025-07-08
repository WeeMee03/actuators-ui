import { Routes, Route } from 'react-router-dom';
import ActuatorTable from './components/ActuatorTable';
import ActuatorDetail from './components/ActuatorDetail'; // you'll create this file

export default function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <Routes>
        <Route path="/" element={<ActuatorTable />} />
        <Route path="/actuator/:id" element={<ActuatorDetail />} />
      </Routes>
    </div>
  );
}