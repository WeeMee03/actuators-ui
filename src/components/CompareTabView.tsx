import { useState } from 'react';
import ActuatorTable from './ActuatorTable';
import ComparePage from './ComparePage';
import type { Actuator } from '../types';

export default function CompareTabView({ isAdmin }: { isAdmin: boolean }) {
  const [selected, setSelected] = useState<Actuator[]>([]);
  const [tab, setTab] = useState<'table' | 'compare'>('table');

  return (
    <div style={{ padding: '1rem' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: '1rem' }}>
        <button
          onClick={() => setTab('table')}
          style={{
            padding: '10px 16px',
            marginRight: '0.5rem',
            backgroundColor: tab === 'table' ? '#3b82f6' : '#1e293b',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Actuator Table
        </button>
        <button
          onClick={() => setTab('compare')}
          style={{
            padding: '10px 16px',
            backgroundColor: tab === 'compare' ? '#3b82f6' : '#1e293b',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          Compare Selected ({selected.length})
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ display: tab === 'table' ? 'block' : 'none' }}>
        <ActuatorTable
          isAdmin={isAdmin}
          selected={selected}
          setSelected={setSelected}
        />
      </div>

      <div style={{ display: tab === 'compare' ? 'block' : 'none' }}>
        <ComparePage actuators={selected} setSelected={setSelected} />
      </div>
    </div>
  );
}
