import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Actuator } from '../types';

export default function ActuatorTable({
  isAdmin,
  selected,
  setSelected,
}: {
  isAdmin: boolean;
  selected: Actuator[];
  setSelected: (a: Actuator[]) => void;
}) {
  const [actuators, setActuators] = useState<Actuator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchActuators() {
      const { data, error } = await supabase.from('actuators').select('*').order('created_at', { ascending: false });
      if (error) console.error('Error:', error);
      setActuators(data ?? []);
      setLoading(false);
    }
    fetchActuators();
  }, []);

  const toggleSelect = React.useCallback((actuator: Actuator) => {
    const isSelected = selected.some((a) => a.id === actuator.id);
    setSelected(
      isSelected ? selected.filter((a) => a.id !== actuator.id) : [...selected, actuator]
    );
  }, [selected, setSelected]);

  const matchesFilter = (value: any, filter: string) => {
    if (!filter) return true;
    return value?.toString().toLowerCase().includes(filter.toLowerCase());
  };

  const headers = [
    { label: 'Manufacturer', key: 'manufacturer' },
    { label: 'Model Type', key: 'model_type' },
    { label: 'Rated Torque (Nm)', key: 'rated_torque_nm' },
    { label: 'Peak Torque (Nm)', key: 'peak_torque_nm' },
    { label: 'Rated Speed (RPM)', key: 'rated_speed_rpm' },
    { label: 'Diameter (mm)', key: 'overall_diameter_mm' },
    { label: 'Length (mm)', key: 'overall_length_mm' },
    { label: 'Gearbox', key: 'gear_box' },
    { label: 'Gear Ratio', key: 'gear_ratio' },
    { label: 'Efficiency', key: 'efficiency' },
    { label: 'Weight (kg)', key: 'weight_kg' },
    { label: 'DC Voltage (V)', key: 'dc_voltage_v' },
    { label: 'Peak Torque Density (Nm/kg)', key: 'peak_torque_density_after_gear_nm_per_kg' },
    { label: 'Built-in Controller', key: 'built_in_controller' },
    { label: 'Link', key: 'link' },
  ];

  const filteredActuators = React.useMemo(() => {
    return [...actuators]
      .filter((a) =>
        headers.every(({ key }) => matchesFilter((a as any)[key], filters[key] ?? ''))
      )
      .sort((a, b) => {
        const valA = (a as any)[sortKey];
        const valB = (b as any)[sortKey];
        if (valA == null) return sortAsc ? -1 : 1;
        if (valB == null) return sortAsc ? 1 : -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc ? valA.toString().localeCompare(valB.toString()) : valB.toString().localeCompare(valA.toString());
      });
  }, [actuators, headers, filters, sortKey, sortAsc]);

  if (loading) return <p>Loading actuators...</p>;

  return (
    <div
      style={{
        padding: 24,
        overflowX: 'auto',
        background: '#0f172a',
        borderRadius: 12,
        boxShadow: '0 0 12px rgba(0, 0, 0, 0.3)',
      }}
    >
      {isAdmin && (
        <button
          onClick={() => navigate('/add-actuator')}
          style={{
            marginBottom: '1rem',
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            borderRadius: 6,
            border: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          + Add Actuator
        </button>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>Compare</th>
            {headers.map(({ label, key }) => (
              <th
                key={key}
                onClick={() => {
                  if (sortKey === key) {
                    setSortAsc(!sortAsc);
                  } else {
                    setSortKey(key);
                    setSortAsc(true);
                  }
                }}
                style={{ ...thStyle, cursor: 'pointer' }}
              >
                {label} {sortKey === key ? (sortAsc ? '▲' : '▼') : ''}
              </th>
            ))}
          </tr>
          <tr>
            <td style={tdStyle}></td>
            {headers.map(({ key }) => (
              <td key={key} style={tdStyle}>
                {key === 'built_in_controller' ? (
                  <select
                    value={filters[key] ?? ''}
                    onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Filter..."
                    value={filters[key] ?? ''}
                    onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                    style={inputStyle}
                  />
                )}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredActuators.map((a, i) => (
            <tr
              key={a.id}
              onClick={() => navigate(`/actuator/${a.id}`)}
              style={{
                backgroundColor: i % 2 === 0 ? '#1e293b' : '#0f172a',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#334155')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#1e293b' : '#0f172a')}
            >
              <td
                style={tdStyle}
                onClick={(e) => e.stopPropagation()} // prevent row navigation
              >
                <input
                  type="checkbox"
                  checked={selected.some((x) => x.id === a.id)}
                  onChange={() => toggleSelect(a)}
                />
              </td>
              {headers.map(({ key }) => {
                const val = (a as any)[key];
                return (
                  <td key={key} style={tdStyle}>
                    {key === 'built_in_controller'
                      ? val === true
                        ? 'Yes'
                        : val === false
                        ? 'No'
                        : '-'
                      : key === 'link' && val
                      ? (
                        <a
                          href={val}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#3b82f6', textDecoration: 'underline' }}
                        >
                          Link
                        </a>
                      )
                      : val ?? '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  color: '#f9fafb',
  backgroundColor: '#0f172a',
  borderBottom: '2px solid #334155',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  zIndex: 1,
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  color: '#e2e8f0',
  borderBottom: '1px solid #334155',
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  backgroundColor: '#1e293b',
  color: '#f1f5f9',
  border: '1px solid #475569',
  borderRadius: 4,
  fontSize: '0.75rem',
};