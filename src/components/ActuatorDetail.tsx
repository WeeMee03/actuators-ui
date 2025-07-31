import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Actuator } from '../types';

export default function ActuatorDetail({ isAdmin }: { isAdmin: boolean }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actuator, setActuator] = useState<Actuator | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Partial<Actuator>>({});
  const [formulas, setFormulas] = useState<{ field_name: string; formula: string }[]>([]);

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
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState('');

  // Fetch actuator data
  useEffect(() => {
    async function fetchActuator() {
      setLoading(true);
      if (!id) {
        console.error('Invalid actuator ID:', id);
        setActuator(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('actuators')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('Supabase error:', error, 'ID:', id);
        setActuator(null);
      } else if (!data) {
        console.warn('No actuator found for ID:', id);
        setActuator(null);
      } else {
        setActuator(data);
        setForm(data);
      }
      setLoading(false);
    }
    fetchActuator();
  }, [id]);

  // Fetch formulas for legend
  useEffect(() => {
    async function fetchFormulas() {
      const { data, error } = await supabase
        .from('formulas')
        .select('field_name, formula')
        .eq('is_active', true);
      if (error) {
        console.error('Failed to fetch formulas:', error.message);
      } else if (data) {
        setFormulas(data);
      }
    }
    fetchFormulas();
  }, []);

  const handleChange = React.useCallback(
    (key: string, value: any) => {
      setForm((f) => ({
        ...f,
        [key]: numberFields.includes(key) ? (value === '' ? null : Number(value)) : value,
      }));
      setSuccess('');
    },
    [numberFields]
  );

  if (loading || !actuator) {
    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', color: 'white' }}>
        <button onClick={() => navigate(-1)} style={backButtonStyle}>
          ← Back
        </button>
        <h2>{loading ? 'Loading actuator...' : 'Actuator not found.'}</h2>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    const { error } = await supabase.from('actuators').update(form).eq('id', id);
    setSaving(false);
    if (error) {
      alert('Failed to update actuator.');
      console.error(error);
    } else {
      setActuator(form as Actuator);
      setEditMode(false);
      setSuccess('Actuator updated successfully!');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this actuator?')) return;
    setDeleting(true);
    const { error } = await supabase.from('actuators').delete().eq('id', id);
    setDeleting(false);
    if (error) {
      alert('Failed to delete actuator.');
      console.error(error);
    } else {
      navigate('/');
    }
  };

  return (
    <div
      style={{
        padding: '2rem 3vw',
        maxWidth: '100%',
        margin: '0 auto',
        color: 'white',
        boxSizing: 'border-box',
        minWidth: 0,
      }}
    >
      <button onClick={() => navigate(-1)} style={backButtonStyle}>
        ← Back
      </button>
      <h2>
        {actuator.manufacturer ?? 'Unknown'} - {actuator.model_type}
      </h2>

      {/* Flex container */}
      <div
        style={{
          display: 'flex',
          gap: '2rem',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: details table */}
        <div style={{ flex: '1 1 600px', minWidth: 0 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: '#222',
              color: 'white',
            }}
          >
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 8, background: '#333' }}>Field</th>
                <th style={{ textAlign: 'left', padding: 8, background: '#333' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(editMode ? form : actuator)
                .filter(([key]) => key !== 'id' && key !== 'created_at')
                .map(([key, value]) => (
                  <tr key={key}>
                    <td style={{ fontWeight: 'bold', padding: 8, borderBottom: '1px solid #444' }}>
                      {formatKey(key)}
                    </td>
                    <td style={{ padding: 8, borderBottom: '1px solid #444' }}>
                      {editMode ? (
                        numberFields.includes(key) ? (
                          <input
                            type="number"
                            value={typeof value === 'boolean' ? (value ? '1' : '0') : value ?? ''}
                            onChange={(e) => handleChange(key, e.target.value)}
                            style={inputStyle}
                          />
                        ) : (
                          <input
                            type="text"
                            value={typeof value === 'boolean' ? String(value) : value ?? ''}
                            onChange={(e) => handleChange(key, e.target.value)}
                            style={inputStyle}
                          />
                        )
                      ) : value === true ? (
                        'Yes'
                      ) : value === false ? (
                        'No'
                      ) : value === null || value === undefined ? (
                        '-'
                      ) : (
                        value
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          <div style={{ marginTop: '1rem' }}>
            {success && <p style={{ color: '#22c55e', fontWeight: 'bold' }}>{success}</p>}
            {editMode ? (
              <>
                <button onClick={handleSave} style={saveButtonStyle} disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditMode(false)} style={cancelButtonStyle} disabled={saving}>
                  Cancel
                </button>
              </>
            ) : isAdmin ? (
              <>
                <button onClick={() => setEditMode(true)} style={editButtonStyle}>
                  Edit
                </button>
                <button onClick={handleDelete} style={deleteButtonStyle} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            ) : (
              <p style={{ fontStyle: 'italic', color: 'gray' }}>Read-only access</p>
            )}
          </div>
        </div>

        {/* Right: formula legend */}
        <div
          style={{
            flex: '0 0 320px',
            padding: '1rem',
            backgroundColor: '#111',
            borderRadius: 8,
            maxHeight: 600,
            overflowY: 'auto',
            color: '#ddd',
          }}
        >
          <h3 style={{ marginBottom: 12, borderBottom: '1px solid #333', paddingBottom: 6 }}>
            Formula Legend
          </h3>
          {formulas.length === 0 ? (
            <p>No active formulas found.</p>
          ) : (
            <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
              {formulas.map(({ field_name, formula }) => (
                <li key={field_name} style={{ marginBottom: 8 }}>
                  <code style={{ fontWeight: 'bold' }}>{formatKey(field_name)}</code>: <code>{formula}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function formatKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const backButtonStyle: React.CSSProperties = {
  marginBottom: 16,
  padding: '0.5rem 1rem',
  backgroundColor: '#1e3a8a',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 6,
  borderRadius: 4,
  border: '1px solid #ccc',
};

const saveButtonStyle: React.CSSProperties = {
  marginRight: 8,
  padding: '0.5rem 1rem',
  backgroundColor: '#22c55e',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const cancelButtonStyle: React.CSSProperties = {
  marginRight: 8,
  padding: '0.5rem 1rem',
  backgroundColor: '#6b7280',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const editButtonStyle: React.CSSProperties = {
  marginRight: 8,
  padding: '0.5rem 1rem',
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};

const deleteButtonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  backgroundColor: '#ef4444',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};
