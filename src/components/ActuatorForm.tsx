import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Actuator } from '../types';

export default function ActuatorForm({ isAdmin }: { isAdmin: boolean }) {
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<Actuator>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      alert('Access denied. Admins only.');
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const fields: { label: string; key: keyof Actuator }[] = [
    { label: 'Manufacturer', key: 'manufacturer' },
    { label: 'Model Type', key: 'model_type' },
    { label: 'Overall Diameter (mm)', key: 'overall_diameter_mm' },
    { label: 'Overall Length (mm)', key: 'overall_length_mm' },
    { label: 'Gear Box', key: 'gear_box' },
    { label: 'Gear Ratio', key: 'gear_ratio' },
    { label: 'Rated Torque (Nm)', key: 'rated_torque_nm' },
    { label: 'Peak Torque (Nm)', key: 'peak_torque_nm' },
    { label: 'Rated Speed (rpm)', key: 'rated_speed_rpm' },
    { label: 'Efficiency', key: 'efficiency' },
    { label: 'Weight (kg)', key: 'weight_kg' },
    { label: 'Built-in Controller', key: 'built_in_controller' },
    { label: 'DC Voltage (V)', key: 'dc_voltage_v' },
    { label: 'Link', key: 'link' },
  ];

  const numberFields = [
    'overall_diameter_mm',
    'overall_length_mm',
    'gear_ratio',
    'rated_torque_nm',
    'peak_torque_nm',
    'rated_speed_rpm',
    'efficiency',
    'weight_kg',
    'dc_voltage_v',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from('actuators').insert([form]);
    setLoading(false);

    if (error) {
      setError('Failed to insert actuator.');
      console.error(error);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', color: 'white', padding: '2rem' }}>
      <h2>Add New Actuator</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        {fields.map(({ label, key }) => (
          <label key={key} style={{ display: 'flex', flexDirection: 'column' }}>
            {label}
            {key === 'built_in_controller' ? (
              <select
                value={
                  form[key] === true
                    ? 'true'
                    : form[key] === false
                    ? 'false'
                    : ''
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    [key]:
                      e.target.value === 'true'
                        ? true
                        : e.target.value === 'false'
                        ? false
                        : null,
                  })
                }
                style={inputStyle}
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : key === 'gear_box' ? (
              <select
                value={form[key] ?? ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select Gear Box</option>
                <option value="harmonic">Harmonic</option>
                <option value="planetary">Planetary</option>
              </select>
            ) : (
              <input
                type={numberFields.includes(key) ? 'number' : 'text'}
                value={form[key] ?? ''}
                onChange={(e) => {
                  const val = numberFields.includes(key)
                    ? e.target.value === ''
                      ? null
                      : Number(e.target.value)
                    : e.target.value;
                  setForm({ ...form, [key]: val });
                }}
                style={inputStyle}
              />
            )}
          </label>
        ))}

        {error && <p style={{ color: 'tomato' }}>{error}</p>}

        <div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'wait' : 'pointer',
              fontWeight: 'bold',
            }}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              marginLeft: 8,
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 4,
  border: '1px solid #ccc',
  backgroundColor: '#292929',
  color: 'white',
};
