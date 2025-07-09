import { Fragment, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Actuator } from '../types';

export default function ActuatorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actuator, setActuator] = useState<Actuator | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Actuator>>({});

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
    'peak_torque_density_after_gear_nm_per_kg',
  ];

  useEffect(() => {
    async function fetchActuator() {
      setLoading(true);
      const { data, error } = await supabase
        .from('actuators')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching actuator:', error);
        setActuator(null);
      } else {
        setActuator(data);
        setForm(data);
      }
      setLoading(false);
    }

    if (id) fetchActuator();
  }, [id]);

  if (loading) return <p style={styles.loading}>Loading actuator...</p>;
  if (!actuator) return <p style={styles.loading}>Actuator not found.</p>;

  const handleChange = (key: keyof Actuator, value: any) => {
    setForm((f) => ({
      ...f,
      [key]: numberFields.includes(key) ? (value === '' ? null : Number(value)) : value,
    }));
  };

  const handleSave = async () => {
    const { error } = await supabase.from('actuators').update(form).eq('id', id);
    if (error) {
      alert('Failed to update actuator.');
      console.error(error);
    } else {
      setActuator(form as Actuator);
      setEditMode(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this actuator?')) return;
    const { error } = await supabase.from('actuators').delete().eq('id', id);
    if (error) {
      alert('Failed to delete actuator.');
      console.error(error);
    } else {
      navigate('/');
    }
  };

  const entries = Object.entries(editMode ? form : actuator)
    .filter(([key]) => key !== 'id' && key !== 'created_at')
    .map(([key, value]) => ({
      label: formatKey(key),
      value:
        editMode
          ? key === 'built_in_controller'
            ? value === true
              ? 'true'
              : value === false
              ? 'false'
              : ''
            : value ?? ''
          : typeof value === 'boolean'
          ? value
            ? 'Yes'
            : 'No'
          : value ?? '-',
      key,
    }));

  const groupedRows = [];
  for (let i = 0; i < entries.length; i += 2) {
    groupedRows.push(entries.slice(i, i + 2));
  }

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>
        ← Back
      </button>

      <h2 style={styles.title}>
        {actuator.manufacturer ?? 'Unknown Manufacturer'} – {actuator.model_type}
      </h2>

      <div style={styles.card}>
        <table style={styles.table}>
          <tbody>
            {groupedRows.map((row, i) => (
              <tr key={i}>
                {row.map(({ label, value, key }) => (
                  <Fragment key={key}>
                    <td style={styles.cellLabel}>{label}</td>
                    <td style={styles.cellValue}>
                      {editMode ? (
                        key === 'built_in_controller' ? (
                          <select
                            value={value === null || value === undefined ? '' : String(value)}
                            onChange={(e) =>
                              handleChange(key as keyof Actuator, e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)
                            }
                            style={styles.input}
                          >
                            <option value="">Select</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        ) : numberFields.includes(key) ? (
                          <input
                            type="number"
                            value={value === null || value === undefined ? '' : String(value)}
                            onChange={(e) => handleChange(key as keyof Actuator, e.target.value)}
                            style={styles.input}
                          />
                        ) : (
                          <input
                            type="text"
                            value={value === null || value === undefined ? '' : String(value)}
                            onChange={(e) => handleChange(key as keyof Actuator, e.target.value)}
                            style={styles.input}
                          />
                        )
                      ) : (
                        value
                      )}
                    </td>
                  </Fragment>
                ))}
                {row.length < 2 && (
                  <>
                    <td style={styles.cellLabel}></td>
                    <td style={styles.cellValue}></td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        {editMode ? (
          <>
            <button onClick={handleSave} style={styles.saveButton}>
              Save
            </button>
            <button onClick={() => setEditMode(false)} style={styles.cancelButton}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditMode(true)} style={styles.editButton}>
              Edit
            </button>
            <button onClick={handleDelete} style={styles.deleteButton}>
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Unit labels map
const unitsMap: { [key: string]: string } = {
  overall_diameter_mm: '(mm)',
  overall_length_mm: '(mm)',
  overall_volume_mm3: '(mm³)',
  gear_ratio: '',
  rated_torque_nm: '(Nm)',
  peak_torque_nm: '(Nm)',
  rated_torque_before_gear: '(Nm)',
  peak_torque_before_gear: '(Nm)',
  peak_over_rated_torque_ratio: '',
  rated_speed_rpm: '(rpm)',
  rated_speed_before_gear: '(rpm)',
  rated_power_kw: '(kW)',
  peak_power_kw: '(kW)',
  rated_power_density_kw_per_kg: '(kW/kg)',
  peak_power_density_kw_per_kg: '(kW/kg)',
  rated_torque_density_before_gear_per_kg: '(Nm/kg)',
  peak_torque_density_after_gear_nm_per_kg: '(Nm/kg)',
  weight_kg: '(kg)',
  dc_voltage_v: '(V)',
  efficiency: '(%)',
};

function formatKey(key: string): string {
  const unit = unitsMap[key] ?? '';
  const words = key
    .replace(/_/g, ' ')
    .split(' ')
    .filter(word => !['mm', 'nm', 'kg', 'rpm', 'v', 'kw', 'mm3', 'per'].includes(word.toLowerCase()))
    .map(word => word.charAt(0).toUpperCase() + word.slice(1));
  return `${words.join(' ')}${unit ? ` ${unit}` : ''}`;
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '2rem',
    color: 'white',
    maxWidth: 900,
    margin: '0 auto',
  },
  loading: {
    padding: '2rem',
    color: 'white',
  },
  backButton: {
    background: '#1e3a8a',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    marginBottom: '1.5rem',
  },
  card: {
    background: '#1e1e1e',
    padding: '1.5rem',
    borderRadius: 12,
    boxShadow: '0 0 10px #0006',
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  cellLabel: {
    fontWeight: 600,
    color: '#60a5fa',
    padding: '0.75rem',
    width: '20%',
    verticalAlign: 'top',
    borderBottom: '1px solid #333',
  },
  cellValue: {
    color: '#ddd',
    padding: '0.75rem',
    width: '30%',
    borderBottom: '1px solid #333',
  },
  input: {
    width: '100%',
    padding: '0.5rem',
    borderRadius: 6,
    border: '1px solid #444',
    background: '#292929',
    color: 'white',
    boxSizing: 'border-box',
  },
  editButton: {
    padding: '0.75rem 1.5rem',
    marginRight: '1rem',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
  },
  saveButton: {
    padding: '0.75rem 1.5rem',
    marginRight: '1rem',
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    marginRight: '1rem',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
  },
  deleteButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 600,
  },
};