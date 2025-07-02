import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';
import { Actuator } from './types';

function App() {
  const [actuators, setActuators] = useState<Actuator[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActuators() {
      setLoading(true);
      const { data, error } = await supabase
        .from<Actuator>('actuators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setActuators(data || []);
      }
      setLoading(false);
    }

    fetchActuators();
  }, []);

  if (loading) return <p>Loading actuators...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Actuator List</h1>
      <table border={1} cellPadding={8}>
        <thead>
          <tr>
            <th>Manufacturer</th>
            <th>Model Type</th>
            <th>Rated Torque (Nm)</th>
            <th>Peak Torque (Nm)</th>
            <th>Speed (rpm)</th>
          </tr>
        </thead>
        <tbody>
          {actuators.map((actuator) => (
            <tr key={actuator.id}>
              <td>{actuator.manufacturer}</td>
              <td>{actuator.model_type}</td>
              <td>{actuator.rated_torque_nm ?? '-'}</td>
              <td>{actuator.peak_torque_nm ?? '-'}</td>
              <td>{actuator.rated_speed_rpm ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
