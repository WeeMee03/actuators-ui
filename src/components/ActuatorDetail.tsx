import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Actuator } from '../types';

export default function ActuatorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [actuator, setActuator] = useState<Actuator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActuator() {
      const { data, error } = await supabase
        .from('actuators')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching actuator:', error);
      } else {
        setActuator(data);
      }
      setLoading(false);
    }

    fetchActuator();
  }, [id]);

  if (loading) return <p style={styles.loading}>Loading actuator...</p>;
  if (!actuator) return <p style={styles.loading}>Actuator not found.</p>;

  const entries = Object.entries(actuator)
    .filter(([key]) => key !== 'id' && key !== 'manufacturer' && key !== 'model_type' && key !== 'created_at')
    .map(([key, value]) => ({
      label: formatKey(key),
      value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value ?? '-',
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
                {row.map((item, j) => (
                  <Fragment key={j}>
                    <td style={styles.cellLabel}>{item.label}</td>
                    <td style={styles.cellValue}>{item.value}</td>
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
    </div>
  );
}

import { Fragment } from 'react';

function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
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
    borderRadius: '6px',
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
    borderRadius: '12px',
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
};