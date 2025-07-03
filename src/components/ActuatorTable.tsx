import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Actuator } from '../types';

export default function ActuatorTable() {
  const [actuators, setActuators] = useState<Actuator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActuators() {
      const { data, error } = await supabase
        .from('actuators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching actuators:', error);
        setActuators([]);
      } else {
        setActuators(data ?? []);
      }
      setLoading(false);
    }

    fetchActuators();
  }, []);

  if (loading) return <p>Loading actuators...</p>;

  return (
    <div className="overflow-x-auto p-4">
      <table className="table-auto w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Manufacturer</th>
            <th className="border p-2">Model</th>
            <th className="border p-2">Torque (Nm)</th>
            <th className="border p-2">Peak Density</th>
            <th className="border p-2">Voltage (V)</th>
            <th className="border p-2">Weight (kg)</th>
            <th className="border p-2">Link</th>
          </tr>
        </thead>
        <tbody>
          {actuators.map((a, i) => (
            <tr key={a.id ?? i} className="odd:bg-white even:bg-gray-50">
              <td className="border p-2">{a.manufacturer ?? '-'}</td>
              <td className="border p-2">{a.model_type ?? '-'}</td>
              <td className="border p-2">{a.rated_torque_nm ?? '-'}</td>
              <td className="border p-2">{a.peak_torque_density_nm_per_kg ?? '-'}</td>
              <td className="border p-2">{a.dc_voltage_v ?? '-'}</td>
              <td className="border p-2">{a.weight_kg ?? '-'}</td>
              <td className="border p-2">
                {a.link ? <a href={a.link} className="text-blue-600 underline" target="_blank" rel="noreferrer">Link</a> : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
