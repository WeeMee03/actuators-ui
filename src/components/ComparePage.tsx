import React, { useState, useMemo, useCallback } from 'react';
import type { Actuator } from '../types';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export default function ComparePage({
  actuators,
  setSelected,
}: {
  actuators: Actuator[];
  setSelected: (a: Actuator[]) => void;
}) {
  const [mode, setMode] = useState<'table' | 'radar' | 'bar'>('table');
  const thStyle = {
    padding: '12px',
    backgroundColor: '#334155',
    color: '#f1f5f9',
    textAlign: 'left' as const,
    borderBottom: '1px solid #475569',
    minWidth: '150px',
  };
  const tdLabelStyle = {
    padding: '10px',
    backgroundColor: '#1e293b',
    fontWeight: 600,
    borderBottom: '1px solid #334155',
  };
  const tdStyle = {
    padding: '10px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #334155',
  };

  const fields = [
    { key: 'manufacturer', label: 'Manufacturer', get: (a: Actuator) => a.manufacturer },
    { key: 'model_type', label: 'Model Type', get: (a: Actuator) => a.model_type },
    { key: 'rated_torque_nm', label: 'Rated Torque (Nm)', get: (a: Actuator) => a.rated_torque_nm },
    { key: 'peak_torque_nm', label: 'Peak Torque (Nm)', get: (a: Actuator) => a.peak_torque_nm },
    { key: 'rated_speed_rpm', label: 'Rated Speed (RPM)', get: (a: Actuator) => a.rated_speed_rpm },
    { key: 'overall_diameter_mm', label: 'Diameter (mm)', get: (a: Actuator) => a.overall_diameter_mm },
    { key: 'overall_length_mm', label: 'Length (mm)', get: (a: Actuator) => a.overall_length_mm },
    { key: 'overall_volume_mm3', label: 'Volume (mm³)', get: (a: Actuator) => a.overall_volume_mm3 },
    { key: 'weight_kg', label: 'Weight (kg)', get: (a: Actuator) => a.weight_kg },
    { key: 'peak_torque_density_after_gear_nm_per_kg', label: 'Peak Torque Density (Nm/kg)', get: (a: Actuator) => a.peak_torque_density_after_gear_nm_per_kg },
    { key: 'gear_box', label: 'Gearbox', get: (a: Actuator) => a.gear_box },
    { key: 'gear_ratio', label: 'Gear Ratio', get: (a: Actuator) => a.gear_ratio },
    { key: 'efficiency', label: 'Efficiency', get: (a: Actuator) => a.efficiency },
    { key: 'dc_voltage_v', label: 'Voltage (V)', get: (a: Actuator) => a.dc_voltage_v },
    { key: 'built_in_controller', label: 'Controller Built-in', get: (a: Actuator) => a.built_in_controller ? 'Yes' : 'No' },
    { key: 'rated_torque_before_gear_nm', label: 'Rated Torque Before Gear (Nm)', get: (a: Actuator) => a.rated_torque_before_gear_nm },
    { key: 'peak_torque_before_gear_nm', label: 'Peak Torque Before Gear (Nm)', get: (a: Actuator) => a.peak_torque_before_gear_nm },
    { key: 'peak_over_rated_torque_ratio', label: 'Peak / Rated Torque Ratio', get: (a: Actuator) => a.peak_over_rated_torque_ratio },
    { key: 'rated_speed_before_gear_rpm', label: 'Rated Speed Before Gear (RPM)', get: (a: Actuator) => a.rated_speed_before_gear_rpm },
    { key: 'rated_torque_density_before_gear_nm_per_kg', label: 'Rated Torque Density Before Gear (Nm/kg)', get: (a: Actuator) => a.rated_torque_density_before_gear_nm_per_kg },
    { key: 'rated_power_kw', label: 'Rated Power (kW)', get: (a: Actuator) => a.rated_power_kw },
    { key: 'peak_power_kw', label: 'Peak Power (kW)', get: (a: Actuator) => a.peak_power_kw },
    { key: 'rated_power_density_kw_per_kg', label: 'Rated Power Density (kW/kg)', get: (a: Actuator) => a.rated_power_density_kw_per_kg },
    { key: 'peak_power_density_kw_per_kg', label: 'Peak Power Density (kW/kg)', get: (a: Actuator) => a.peak_power_density_kw_per_kg },
    {
      key: 'link',
      label: 'Link',
      get: (a: Actuator) =>
        a.link ? (
          <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>
            Link
          </a>
        ) : (
          '-'
        ),
    },
  ];

  const [visibleFields, setVisibleFields] = useState<string[]>(fields.map((f) => f.key));
  const [radarFields, setRadarFields] = useState<string[]>([]);
  const numericFields = useMemo(() =>
    fields.filter((f) => actuators.every((a) => typeof f.get(a) === 'number' || f.get(a) == null)),
    [fields, actuators]
  );
  const [barChartField, setBarChartField] = useState(numericFields[0]?.key || '');

  // Weights state for scoring, keyed by numeric field keys
  const [weights, setWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(numericFields.map((f) => [f.key, 0]))
  );

  const toggleField = useCallback((key: string) => {
    setVisibleFields((prev: string[]) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }, []);

  const toggleRadarField = useCallback((key: string) => {
    setRadarFields((prev: string[]) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }, []);

  const removeFromCompare = useCallback((id: string) => {
    setSelected(actuators.filter((a) => a.id !== id));
  }, [setSelected]);

  const barField = useMemo(() => fields.find((f) => f.key === barChartField), [fields, barChartField]);

  const minMaxPerRadarField = useMemo(() => {
    const result: Record<string, { min: number; max: number }> = {};
    radarFields.forEach((key) => {
      const f = numericFields.find((nf) => nf.key === key);
      if (!f) return;
      const values = actuators
        .map((a) => {
          const v = f.get(a);
          return typeof v === 'number' ? v : null;
        })
        .filter((v): v is number => v !== null);
      result[key] = {
        min: values.length ? Math.min(...values) : 0,
        max: values.length ? Math.max(...values) : 0,
      };
    });
    return result;
  }, [radarFields, numericFields, actuators]);

  const radarData = useMemo(() => {
    return radarFields.map((key) => {
      const f = numericFields.find((nf) => nf.key === key);
      if (!f) return null;
      const dataPoint: Record<string, number | string> = { metric: f.label };
      const { min, max } = minMaxPerRadarField[key] ?? { min: 0, max: 0 };
      actuators.forEach((a) => {
        const val = f.get(a);
        if (typeof val === 'number') {
          dataPoint[a.model_type] = max !== min ? (val - min) / (max - min) : 1;
        }
      });
      return dataPoint;
    }).filter((d): d is Record<string, number | string> => d !== null);
  }, [radarFields, numericFields, actuators, minMaxPerRadarField]);

  const barData = useMemo(() => actuators.map((a) => ({
    name: a.model_type,
    value: typeof barField?.get(a) === 'number' ? (barField.get(a) as number) : 0,
  })), [actuators, barField]);

  // Total weight sum for validation
  const totalWeight = useMemo(
    () => Object.values(weights).reduce((a, b) => a + b, 0),
    [weights]
  );

  // Normalized scores per actuator per field (0-1 scale)
  const getNormalizedScores = useMemo(() => {
    const result: Record<string, number>[] = actuators.map(() => ({}));
    numericFields.forEach((field) => {
      const values = actuators.map((a) => {
        const val = field.get(a);
        return typeof val === 'number' ? val : null;
      });
      const min = Math.min(...values.filter((v): v is number => v !== null));
      const max = Math.max(...values.filter((v): v is number => v !== null));

      actuators.forEach((a, idx) => {
        const val = field.get(a);
        if (typeof val === 'number') {
          result[idx][field.key] = max !== min ? (val - min) / (max - min) : 1;
        } else {
          result[idx][field.key] = 0;
        }
      });
    });
    return result;
  }, [actuators, numericFields]);

  // Compute total score out of 100 based on weights and normalized values
  const scores = useMemo(() => {
    return getNormalizedScores.map((scoreMap) => {
      let total = 0;
      numericFields.forEach((f) => {
        const weight = weights[f.key] || 0;
        total += (scoreMap[f.key] || 0) * weight;
      });
      return Math.round(total);
    });
  }, [getNormalizedScores, weights, numericFields]);

  if (actuators.length === 0) {
    return <p style={{ color: '#f1f5f9' }}>No actuators selected. Please select from the table first.</p>;
  }

  return (
    <div style={{ padding: '1rem', color: '#f1f5f9' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Compare Actuators</h2>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setMode('table')}
          style={{
            padding: '8px 18px',
            backgroundColor: mode === 'table' ? '#2563eb' : '#1e293b',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Table
        </button>
        <button
          onClick={() => setMode('radar')}
          style={{
            padding: '8px 18px',
            backgroundColor: mode === 'radar' ? '#2563eb' : '#1e293b',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Radar Chart
        </button>
        <button
          onClick={() => setMode('bar')}
          style={{
            padding: '8px 18px',
            backgroundColor: mode === 'bar' ? '#2563eb' : '#1e293b',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Bar Chart
        </button>
      </div>

      {/* Field selection checkboxes */}
      {mode === 'table' && (
        <div style={{ marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {fields.map((f) => (
            <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="checkbox"
                checked={visibleFields.includes(f.key)}
                onChange={() => toggleField(f.key)}
              />
              {f.label}
            </label>
          ))}
        </div>
      )}

      {/* Radar Chart Section */}
      {mode === 'radar' && (
        <div style={{ flex: '1 1 400px', height: 400, marginBottom: '2rem' }}>
          <h3>Radar Chart</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '0.5rem' }}>
            {numericFields.map((f) => (
              <label key={f.key} style={{ fontSize: '0.8rem' }}>
                <input
                  type="checkbox"
                  checked={radarFields.includes(f.key)}
                  onChange={() => toggleRadarField(f.key)}
                />{' '}
                {f.label}
              </label>
            ))}
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis tick={false} axisLine={false} />
              {actuators.map((a, idx) => (
                <Radar
                  key={a.id}
                  name={a.model_type}
                  dataKey={a.model_type}
                  stroke={`hsl(${(idx * 60) % 360}, 70%, 50%)`}
                  fill={`hsl(${(idx * 60) % 360}, 70%, 50%)`}
                  fillOpacity={0.4}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bar Chart Section */}
      {mode === 'bar' && (
        <div style={{ flex: '1 1 400px', height: 400, marginBottom: '2rem' }}>
          <h3>Bar Chart</h3>
          <label>
            Compare metric:
            <select
              value={barChartField}
              onChange={(e) => setBarChartField(e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            >
              {numericFields.length === 0 ? (
                <option value="" disabled>
                  No numeric fields available
                </option>
              ) : (
                numericFields.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))
              )}
            </select>
          </label>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={barData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#38bdf8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparison Table Section */}
      {mode === 'table' && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={thStyle}>Attribute</th>
                {actuators.map((a) => (
                  <th key={a.id} style={thStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {a.model_type}
                      <button
                        onClick={() => removeFromCompare(a.id)}
                        style={{
                          marginLeft: 8,
                          padding: '2px 6px',
                          backgroundColor: '#ef4444',
                          border: 'none',
                          borderRadius: 4,
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fields
                .filter((f) => visibleFields.includes(f.key))
                .map(({ key, label, get }) => {
                  const values = actuators.map((a) => {
                    const val = get(a);
                    return typeof val === 'number' ? val : null;
                  });

                  const numericValues = values.filter((v): v is number => typeof v === 'number');
                  const highlight = numericValues.length > 1;
                  const max = highlight ? Math.max(...numericValues) : null;
                  const min = highlight ? Math.min(...numericValues) : null;

                  const isNumericField = numericFields.some((nf) => nf.key === key);

                  return (
                    <tr key={key}>
                      <td style={tdLabelStyle}>
                        <strong>{label}</strong>
                        {isNumericField && (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={weights[key] === 0 ? '' : weights[key]}
                            onChange={(e) => {
                              const newVal = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                              setWeights((prev) => ({ ...prev, [key]: newVal }));
                            }}
                            style={{
                              marginLeft: '0.5rem',
                              width: 60,
                              fontSize: '0.85rem',
                              padding: '2px 4px',
                              borderRadius: 4,
                              border: '1px solid #475569',
                              backgroundColor: '#1e293b',
                              color: '#f1f5f9',
                              textAlign: 'center',
                            }}
                            title="Weight (0-100)"
                          />
                        )}
                      </td>
                      {actuators.map((a) => {
                        const value = get(a);
                        const isNumber = typeof value === 'number';
                        let style = { ...tdStyle } as React.CSSProperties;
                        if (highlight && isNumber) {
                          if (value === max) style = { ...style, backgroundColor: '#14532d', color: '#22c55e' } as React.CSSProperties;
                          else if (value === min) style = { ...style, backgroundColor: '#7f1d1d', color: '#ef4444' } as React.CSSProperties;
                        }
                        return (
                          <td key={a.id + key} style={style}>
                            {value ?? '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              {/* Score row */}
              <tr>
                <td style={{ ...tdLabelStyle, fontWeight: 'bold', backgroundColor: '#1e293b' }}>
                  Score (/100)
                </td>
                {actuators.map((a, idx) => (
                  <td key={a.id + '_score'} style={{ ...tdStyle, fontWeight: 'bold', color: '#38bdf8' }}>
                    {totalWeight === 100 ? scores[idx] : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {totalWeight !== 100 && (
            <p style={{ color: '#ef4444', marginTop: '0.5rem' }}>
              The total weight must equal 100 to calculate scores. Current total: {totalWeight}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
