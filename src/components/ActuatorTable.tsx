import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Actuator } from '../types';

export default function ActuatorTable() {
  const [actuators, setActuators] = useState<Actuator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    manufacturer: '',
    model_type: '',
    overall_diameter_mm: '',
    overall_length_mm: '',
    gear_box: '',
    gear_ratio: '',
    rated_torque_nm: '',
    peak_torque_nm: '',
    rated_speed_rpm: '',
    efficiency: '',
    weight_kg: '',
    built_in_controller: '',
    dc_voltage_v: '',
    peak_torque_density_after_gear_nm_per_kg: '',
  });

  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const navigate = useNavigate();

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

  const matchesFilter = (value: any, filter: string) => {
    if (!filter) return true;
    return value?.toString().toLowerCase().includes(filter.toLowerCase());
  };

  const filteredActuators = [...actuators]
    .filter((a) =>
      Object.entries(filters).every(([key, filter]) =>
        matchesFilter((a as any)[key], filter)
      )
    )
    .sort((a, b) => {
      const valA = (a as any)[sortKey];
      const valB = (b as any)[sortKey];

      if (valA == null) return sortAsc ? -1 : 1;
      if (valB == null) return sortAsc ? 1 : -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }

      return sortAsc
        ? valA.toString().localeCompare(valB.toString())
        : valB.toString().localeCompare(valA.toString());
    });

  const headers = [
    { label: 'Manufacturer', key: 'manufacturer' },
    { label: 'Model', key: 'model_type' },
    { label: 'Diameter (mm)', key: 'overall_diameter_mm' },
    { label: 'Length (mm)', key: 'overall_length_mm' },
    { label: 'Gearbox', key: 'gear_box' },
    { label: 'Gear Ratio', key: 'gear_ratio' },
    { label: 'Rated Torque (Nm)', key: 'rated_torque_nm' },
    { label: 'Peak Torque (Nm)', key: 'peak_torque_nm' },
    { label: 'Speed (rpm)', key: 'rated_speed_rpm' },
    { label: 'Efficiency', key: 'efficiency' },
    { label: 'Weight (kg)', key: 'weight_kg' },
    { label: 'Built-in Controller', key: 'built_in_controller' },
    { label: 'Voltage (V)', key: 'dc_voltage_v' },
    { label: 'Peak Torque Density (nm/kg)', key: 'peak_torque_density_after_gear_nm_per_kg' },
    { label: 'Link', key: 'link' },
  ];

  const getUniqueValues = (key: keyof Actuator) => {
    const values = actuators.map(a => a[key]).filter(v => v !== null && v !== undefined);
    return Array.from(new Set(values));
  };

  if (loading) return <p>Loading actuators...</p>;

  return (
    <div style={{
      overflowX: 'auto',
      padding: '24px',
      background: '#222',
      borderRadius: '12px',
      boxShadow: '0 2px 8px #0003',
      maxWidth: '100%',
    }}>
      {/* Add Actuator Button */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => navigate('/add-actuator')}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
          }}
          aria-label="Add new actuator"
        >
          + Add Actuator
        </button>
      </div>

      <table style={{
        minWidth: 'max-content',
        borderCollapse: 'collapse',
        borderRadius: '8px',
        boxShadow: '0 1px 4px #0002',
      }}>
        <thead>
          <tr style={stickyHeaderStyle}>
            {headers.map(h => (
              <th
                key={h.key}
                onClick={() => {
                  if (sortKey === h.key) {
                    setSortAsc(!sortAsc);
                  } else {
                    setSortKey(h.key);
                    setSortAsc(true);
                  }
                }}
                style={{
                  ...thStyle,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {h.label}
                {sortKey === h.key && (sortAsc ? ' ▲' : ' ▼')}
              </th>
            ))}
          </tr>
          <tr style={{ backgroundColor: '#1e1e1e' }}>
            {headers.map(h => {
              const val = (filters as any)[h.key];
              if (h.key === 'link') return <td key={h.key} style={tdStyle}></td>;

              const isDropdown = ['manufacturer', 'gear_box', 'built_in_controller'].includes(h.key);

              return (
                <td key={h.key} style={tdStyle}>
                  {isDropdown ? (
                    <select
                      value={val}
                      onChange={(e) =>
                        setFilters({ ...filters, [h.key]: e.target.value })
                      }
                      style={filterInputStyle}
                    >
                      <option value="">All</option>
                      {h.key === 'built_in_controller' ? (
                        <>
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </>
                      ) : (
                        getUniqueValues(h.key as keyof Actuator).map(option => (
                          <option key={option?.toString()} value={option?.toString()}>
                            {option?.toString()}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={val}
                      onChange={(e) =>
                        setFilters({ ...filters, [h.key]: e.target.value })
                      }
                      style={filterInputStyle}
                    />
                  )}
                </td>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {filteredActuators.map((a, i) => (
            <tr
              key={a.id ?? i}
              onClick={() => navigate(`/actuator/${a.id}`)}
              style={{
                background: i % 2 === 0 ? '#333' : '#292929',
                transition: 'background 0.2s',
                cursor: 'pointer',
              }}
            >
              {headers.map((h) => {
                let value = (a as any)[h.key];
                if (h.key === 'built_in_controller') {
                  value = value === true ? 'Yes' : value === false ? 'No' : '-';
                } else if (h.key === 'link') {
                  value = value ?? '-';
                } else {
                  value = value ?? '-';
                }
                return <td key={h.key} style={tdStyle}>{value}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Styles
const thStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  fontWeight: 600,
  color: 'white',
  borderBottom: '1px solid #444',
  backgroundColor: '#1e3a8a',
  top: 0,
  position: 'sticky',
  zIndex: 1,
};

const stickyHeaderStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)',
  position: 'sticky',
  top: 0,
  zIndex: 2,
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
  color: 'white',
  borderBottom: '1px solid #444',
  textAlign: 'left',
};

const filterInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px',
  borderRadius: '4px',
  background: '#292929',
  color: 'white',
  border: '1px solid #444',
};