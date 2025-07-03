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

  if (loading) return <p style={{ padding: '2rem' }}>Loading actuators...</p>;
  if (error) return <p style={{ padding: '2rem', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Actuator List</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th>Manufacturer</th>
              <th>Model Type</th>
              <th>Rated Torque (Nm)</th>
              <th>Peak Torque (Nm)</th>
              <th>Speed (rpm)</th>
              <th>Voltage (V)</th>
              <th>Peak Torque Density</th>
              <th>Weight (kg)</th>
              <th>Link</th>
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
                <td>{actuator.dc_voltage_v ?? '-'}</td>
                <td>{actuator.peak_torque_density_nm_per_kg ?? '-'}</td>
                <td>{actuator.weight_kg ?? '-'}</td>
                <td>
                  {actuator.link ? (
                    <a href={actuator.link} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
