import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Actuator } from '../types';
import { useNavigate } from 'react-router-dom';
import { calculateDerivedFields } from '../lib/calculateDerived';

export default function ActuatorForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState<Partial<Actuator>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const derived = calculateDerivedFields(form);
    const completeForm = { ...form, ...derived };

    const { error } = await supabase.from('actuators').insert([completeForm]);
    setLoading(false);

    if (error) {
        setError('Failed to insert actuator.');
        console.error(error);
    } else {
        navigate('/');
    }
    };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Add New Actuator</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {fields.map((field) => (
          <div key={field.key} style={styles.formGroup}>
            <label style={styles.label}>{field.label}</label>
            {field.key === 'built_in_controller' ? (
              <select
                style={styles.input}
                value={form[field.key] === true ? 'true' : form[field.key] === false ? 'false' : ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    [field.key]: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null,
                  })
                }
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : field.key === 'gear_box' ? (
              <select
                style={styles.input}
                value={form[field.key] ?? ''}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              >
                <option value="">Select Gear Box</option>
                <option value="harmonic">Harmonic</option>
                <option value="planetary">Planetary</option>
              </select>
            ) : (
              <input
                type={numberFields.includes(field.key) ? 'number' : 'text'}
                style={styles.input}
                value={form[field.key] ?? ''}
                onChange={(e) => {
                  const val = numberFields.includes(field.key)
                    ? e.target.value === '' ? null : Number(e.target.value)
                    : e.target.value;
                  setForm({ ...form, [field.key]: val });
                }}
              />
            )}
          </div>
        ))}
      </form>

      {error && <p style={styles.error}>{error}</p>}

      <div style={styles.buttonRow}>
        <button type="submit" disabled={loading} onClick={handleSubmit} style={styles.button}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            ...styles.button,
            backgroundColor: '#6b7280',
            marginLeft: '1rem',
          }}
        >
          Back
        </button>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '2rem',
    maxWidth: '100%',
    margin: '0 auto',
    color: 'white',
    minHeight: '100vh',
  },
  title: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    background: '#1e1e1e',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 0 10px #0006',
    width: '100%',
    boxSizing: 'border-box',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  label: {
    marginBottom: '0.5rem',
    fontWeight: 600,
    color: '#60a5fa',
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid #444',
    background: '#292929',
    color: 'white',
    boxSizing: 'border-box',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '2rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  error: {
    color: 'tomato',
    textAlign: 'center',
    marginTop: '1rem',
  },
};
