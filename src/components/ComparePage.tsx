import type { Actuator } from '../types';

export default function ComparePage({
  actuators,
  setSelected,
}: {
  actuators: Actuator[];
  setSelected: (a: Actuator[]) => void;
}) {
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

  const removeFromCompare = (id: string) => {
    setSelected(actuators.filter((a) => a.id !== id));
  };

  if (actuators.length === 0) {
    return <p style={{ color: '#f1f5f9' }}>No actuators selected. Please select from the table first.</p>;
  }

  return (
    <div style={{ padding: '1rem', color: '#f1f5f9' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Compare Actuators</h2>

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
            {[
              { label: 'Manufacturer', get: (a: Actuator) => a.manufacturer },
              { label: 'Rated Torque (Nm)', get: (a: Actuator) => a.rated_torque_nm },
              { label: 'Peak Torque (Nm)', get: (a: Actuator) => a.peak_torque_nm },
              { label: 'Rated Speed (RPM)', get: (a: Actuator) => a.rated_speed_rpm },
              { label: 'Diameter (mm)', get: (a: Actuator) => a.overall_diameter_mm },
              { label: 'Length (mm)', get: (a: Actuator) => a.overall_length_mm },
              { label: 'Weight (kg)', get: (a: Actuator) => a.weight_kg },
              { label: 'Torque Density (Nm/kg)', get: (a: Actuator) => a.peak_torque_density_after_gear_nm_per_kg },
              { label: 'Gearbox', get: (a: Actuator) => a.gear_box },
              { label: 'Gear Ratio', get: (a: Actuator) => a.gear_ratio },
              { label: 'Efficiency', get: (a: Actuator) => a.efficiency },
              { label: 'Voltage (V)', get: (a: Actuator) => a.dc_voltage_v },
              { label: 'Controller Built-in', get: (a: Actuator) => a.built_in_controller ? 'Yes' : 'No' },
              {
                label: 'Datasheet Link',
                get: (a: Actuator) =>
                  a.link ? (
                    <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>
                      Link
                    </a>
                  ) : (
                    '-'
                  ),
              },
            ].map(({ label, get }) => (
              <tr key={label}>
                <td style={tdLabelStyle}><strong>{label}</strong></td>
                {actuators.map((a) => (
                  <td key={a.id + label} style={tdStyle}>{get(a)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
