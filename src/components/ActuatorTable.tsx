import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Actuator } from '../types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function ActuatorTable({
  isAdmin,
  loggedIn,
  selected,
  setSelected,
}: {
  isAdmin: boolean;
  loggedIn: boolean;
  selected: Actuator[];
  setSelected: (a: Actuator[]) => void;
}) {
  const [actuators, setActuators] = useState<Actuator[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [ranges, setRanges] = useState<Record<string, { min: string; max: string }>>({});
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const [allOptionalHeaders, setAllOptionalHeaders] = useState<{ label: string; key: string }[]>([]);
  const [visibleOptionalFields, setVisibleOptionalFields] = useState<string[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchActuatorsAndColumns() {
      const { data, error } = await supabase
        .from('actuators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching actuators:', error);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const firstRow = data[0];
        const excludedKeys = ['id', 'created_at', 'manufacturer', 'model_type'];

        const generatedHeaders = Object.keys(firstRow)
          .filter(k => !excludedKeys.includes(k))
          .map(k => ({
            label: formatLabel(k),
            key: k,
          }));

        setAllOptionalHeaders(generatedHeaders);
        setVisibleOptionalFields(generatedHeaders.map(h => h.key));
      }

      setActuators(data ?? []);
      setLoading(false);
    }

    fetchActuatorsAndColumns();
  }, []);

  function formatLabel(key: string) {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  const selectAllFields = () => {
    setVisibleOptionalFields(allOptionalHeaders.map(h => h.key));
  };

  const clearAllFields = () => {
    setVisibleOptionalFields([]);
  };

  const headers = useMemo(() => {
    let baseHeaders: { label: string; key: string }[] = [];

    if (isAdmin || loggedIn) {
      baseHeaders = [
        { label: 'Restricted ID', key: 'restricted_id' },
        { label: 'Manufacturer', key: 'manufacturer' },
        { label: 'Model Type', key: 'model_type' },
        ...allOptionalHeaders.filter(h => visibleOptionalFields.includes(h.key)),
      ];
    } else {
      baseHeaders = [
        { label: 'Restricted ID', key: 'restricted_id' },
        ...allOptionalHeaders.filter(h => visibleOptionalFields.includes(h.key)),
      ];
    }

    return baseHeaders;
  }, [allOptionalHeaders, visibleOptionalFields, isAdmin, loggedIn]);

  const toggleSelect = useCallback(
    (actuator: Actuator) => {
      const isSelected = selected.some(a => a.id === actuator.id);
      setSelected(isSelected ? selected.filter(a => a.id !== actuator.id) : [...selected, actuator]);
    },
    [selected, setSelected]
  );

  const toggleVisibleField = (key: string) => {
    if (visibleOptionalFields.includes(key)) {
      setVisibleOptionalFields(visibleOptionalFields.filter(k => k !== key));
    } else {
      setVisibleOptionalFields([...visibleOptionalFields, key]);
    }
  };

  const matchesFilter = (value: any, filter: string, key?: string) => {
    if (!filter) return true;
    if (key === 'built_in_controller') {
      if (filter === 'true') return value === true;
      if (filter === 'false') return value === false;
      return true;
    }
    return value?.toString().toLowerCase().includes(filter.toLowerCase());
  };

  const matchesRange = (value: any, range: { min: string; max: string }) => {
    if (value == null || isNaN(value)) return false;
    const num = Number(value);
    const min = range.min ? Number(range.min) : -Infinity;
    const max = range.max ? Number(range.max) : Infinity;
    return num >= min && num <= max;
  };

  const filteredActuators = useMemo(() => {
    const processed = actuators.map((a, index) => ({
      ...a,
      restricted_id: `ACT-${String(index + 1).padStart(3, '0')}`,
    }));

    return [...processed]
      .filter(a =>
        headers.every(({ key }) => {
          const value = (a as any)[key];
          if (ranges[key]) return matchesRange(value, ranges[key]);
          return matchesFilter(value, filters[key] ?? '', key);
        })
      )
      .sort((a, b) => {
        const valA = (a as any)[sortKey];
        const valB = (b as any)[sortKey];
        if (valA == null) return sortAsc ? -1 : 1;
        if (valB == null) return sortAsc ? 1 : -1;
        if (typeof valA === 'number' && typeof valB === 'number') return sortAsc ? valA - valB : valB - valA;
        return sortAsc ? valA.toString().localeCompare(valB.toString()) : valB.toString().localeCompare(valA.toString());
      });
  }, [actuators, headers, filters, ranges, sortKey, sortAsc]);

  const exportToExcel = () => {
    const dataToExport = filteredActuators.map(a => {
      const row: Record<string, any> = {};
      headers.forEach(h => {
        if (h.key === 'restricted_id' || h.key === 'manufacturer' || h.key === 'model_type' || visibleOptionalFields.includes(h.key)) {
          const val = (a as any)[h.key];
          row[h.label] =
            h.key === 'built_in_controller'
              ? val === true
                ? 'Yes'
                : val === false
                ? 'No'
                : '-'
              : val ?? '-';
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Actuators');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'actuators.xlsx');
  };

  if (loading) return <p>Loading actuators...</p>;

  return (
    <div style={{ padding: 24, background: '#0f172a', borderRadius: 12, boxShadow: '0 0 12px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {isAdmin && (
          <button onClick={() => navigate('/add-actuator')} style={{ ...selectButtonStyle, backgroundColor: '#2563eb' }}>
            + Add Actuator
          </button>
        )}
        <button onClick={exportToExcel} style={{ ...selectButtonStyle, backgroundColor: '#f59e0b' }}>
          Export Excel
        </button>
      </div>

      {/* Field selector UI */}
      <fieldset style={fieldsetStyle}>
        <legend style={{ color: '#e0e7ff', fontWeight: 600, fontSize: '1.1rem' }}>
          Toggle fields to display
        </legend>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12, marginTop: 8 }}>
          <button onClick={selectAllFields} type="button" style={selectButtonStyle}>
            Select All
          </button>
          <button onClick={clearAllFields} type="button" style={clearButtonStyle}>
            Clear All
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {allOptionalHeaders.map(({ label, key }) => (
            <label key={key} style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={visibleOptionalFields.includes(key)}
                onChange={() => toggleVisibleField(key)}
                style={checkboxStyle}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Table with horizontal scroll */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
          <thead>
            <tr>
              <th style={thStyle}>Compare</th>
              {headers.map(({ label, key }) => {
                const firstValue = (actuators[0] as any)?.[key];
                let filterElement: React.ReactNode = null;

                if (key === 'built_in_controller') {
                  filterElement = (
                    <select
                      value={filters[key] ?? ''}
                      onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                      style={headerFilterSelectStyle}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">All</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  );
                } else if (typeof firstValue === 'string' && key !== 'model_type') {
                  const uniqueVals = Array.from(new Set(actuators.map((a) => (a as any)[key] ?? ''))).filter(Boolean);
                  filterElement = (
                    <select
                      value={filters[key] ?? ''}
                      onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                      style={headerFilterSelectStyle}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">All</option>
                      {uniqueVals.map((val) => (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      ))}
                    </select>
                  );
                } else if (typeof firstValue === 'number') {
                  filterElement = (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                      <input
                        type="number"
                        placeholder="Min"
                        value={ranges[key]?.min ?? ''}
                        onChange={(e) =>
                          setRanges({ ...ranges, [key]: { ...ranges[key], min: e.target.value } })
                        }
                        style={{ ...headerFilterInputStyle, width: 50 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={ranges[key]?.max ?? ''}
                        onChange={(e) =>
                          setRanges({ ...ranges, [key]: { ...ranges[key], max: e.target.value } })
                        }
                        style={{ ...headerFilterInputStyle, width: 50 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  );
                } else {
                  filterElement = (
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={filters[key] ?? ''}
                      onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                      style={headerFilterInputStyle}
                      onClick={(e) => e.stopPropagation()}
                    />
                  );
                }

                return (
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
                    style={{ ...thStyle, cursor: 'pointer', verticalAlign: 'top' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#475569')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f172a')}
                  >
                    <div>
                      {label} {sortKey === key ? (sortAsc ? '▲' : '▼') : ''}
                    </div>
                    <div>{filterElement}</div>
                  </th>
                );
              })}
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
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = i % 2 === 0 ? '#1e293b' : '#0f172a')
                }
              >
                <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
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
                        : val ?? '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Styles ----------
const fieldsetStyle: React.CSSProperties = {
  border: '1px solid #475569',
  borderRadius: 8,
  padding: '16px 20px',
  marginBottom: 24,
  backgroundColor: '#1e293b',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: '0.9rem',
  cursor: 'pointer',
  color: '#e0e7ff',
  userSelect: 'none',
};

const checkboxStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  cursor: 'pointer',
};

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

const headerFilterInputStyle: React.CSSProperties = {
  marginTop: 4,
  padding: '4px 6px',
  backgroundColor: '#1e293b',
  color: '#f1f5f9',
  border: '1px solid #475569',
  borderRadius: 4,
  fontSize: '0.75rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const headerFilterSelectStyle: React.CSSProperties = {
  marginTop: 4,
  padding: '4px 6px',
  backgroundColor: '#1e293b',
  color: '#f1f5f9',
  border: '1px solid #475569',
  borderRadius: 4,
  fontSize: '0.75rem',
  outline: 'none',
  cursor: 'pointer',
  width: '100%',
  boxSizing: 'border-box',
};

const selectButtonStyle: React.CSSProperties = {
  backgroundColor: '#22c55e',
  color: 'white',
  padding: '6px 14px',
  borderRadius: 6,
  border: 'none',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer',
  userSelect: 'none',
};

const clearButtonStyle: React.CSSProperties = {
  backgroundColor: '#ef4444',
  color: 'white',
  padding: '6px 14px',
  borderRadius: 6,
  border: 'none',
  fontWeight: 600,
  fontSize: '0.85rem',
  cursor: 'pointer',
  userSelect: 'none',
};
