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

useEffect(() => {
  async function fetchActuator() {
    setLoading(true);
    // Validate id
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

  const handleChange = React.useCallback((key: string, value: any) => {
    setForm((f) => ({
      ...f,
      [key]: numberFields.includes(key) ? (value === '' ? null : Number(value)) : value,
    }));
    setSuccess('');
  }, [numberFields]);

  if (loading || !actuator) {
    return (
      <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', color: 'white' }}>
        <button onClick={() => navigate(-1)} style={backButtonStyle}>
          ← Back
        </button>
        <h2>
          {loading ? 'Loading actuator...' : 'Actuator not found.'}
        </h2>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setSuccess('');
    const { error } = await supabase.from('actuators').update(form).eq('id', Number(id));
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
    const { error } = await supabase.from('actuators').delete().eq('id', Number(id));
    setDeleting(false);
    if (error) {
      alert('Failed to delete actuator.');
      console.error(error);
    } else {
      navigate('/');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: '0 auto', color: 'white' }}>
      <button onClick={() => navigate(-1)} style={backButtonStyle}>
        ← Back
      </button>
      <h2>
        {actuator.manufacturer ?? 'Unknown'} - {actuator.model_type}
      </h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#222', color: 'white' }}>
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
                <td style={{ fontWeight: 'bold', padding: 8, borderBottom: '1px solid #444' }}>{formatKey(key)}</td>
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
                  ) : (
                    value === true
                      ? 'Yes'
                      : value === false
                      ? 'No'
                      : value === null || value === undefined
                      ? '-'
                      : value
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
  );
}

function formatKey(key: string) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
