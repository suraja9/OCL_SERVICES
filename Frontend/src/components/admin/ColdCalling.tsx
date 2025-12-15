import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';

type ColdCallingStatus = '' | 'done' | 'pending' | 'notWorking';

interface ColdCallingRow {
  _id?: string;
  concernName: string;
  companyName: string;
  destination: string;
  phone1: string;
  phone2: string;
  sujata: string;
  followUpDate: string;
  rating: string;
  broadcast: string;
  backgroundColor?: string;
  rowNumber?: number;
  status?: ColdCallingStatus;
}

const defaultTabs = [
  'Master',
  '5 Star',
  '4 Star',
  '3 Star',
  'Red Zone',
  'Scrap',
  'Enq',
  'Enq-Oct',
  'Enq-Nov',
];

const columns = [
  { key: 'concernName', label: 'A: Concern Name', width: 200 },
  { key: 'companyName', label: 'B: Company Name', width: 200 },
  { key: 'destination', label: 'C: Destination', width: 150 },
  { key: 'phone1', label: 'D: Phone 1', width: 150 },
  { key: 'phone2', label: 'E: Phone 2', width: 150 },
  { key: 'sujata', label: 'F: Sujata', width: 150 },
  { key: 'followUpDate', label: 'G: FU Dt:', width: 120 },
  { key: 'rating', label: 'H: Rating', width: 120 },
  { key: 'broadcast', label: 'I: Broadcast', width: 120 },
];

const statusOptions: {
  value: ColdCallingStatus;
  label: string;
  colorClass: string;
  symbol: string;
  description: string;
}[] = [
  { value: 'done', label: 'Done', colorClass: 'bg-green-500', symbol: '✓', description: 'Call done' },
  { value: 'pending', label: 'Pending', colorClass: 'bg-yellow-400', symbol: '•', description: 'Follow-up pending' },
  { value: 'notWorking', label: 'Not Working', colorClass: 'bg-red-500', symbol: '×', description: 'Number not working' },
];

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

const ColdCalling = () => {
  const [tabs, setTabs] = useState<string[]>(defaultTabs);
  const [activeTab, setActiveTab] = useState<string>(defaultTabs[0]);
  const [rows, setRows] = useState<ColdCallingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('adminToken') || localStorage.getItem('officeToken');

  // Fetch data for active tab
  const fetchData = useCallback(async (tabName: string) => {
    if (!token) {
      console.error('No token found');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/cold-calling/${encodeURIComponent(tabName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const result = await response.json();
      if (result.success) {
        setRows(result.data || []);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab) {
      fetchData(activeTab);
    }
  }, [activeTab, fetchData]);

  // Save changes
  const saveChanges = useCallback(async () => {
    if (!token || !hasChanges) return;

    setSaving(true);
    try {
      const updatePromises = rows.map((row, index) => {
        if (!row._id) {
          // Create new row
          return fetch(`${API_BASE}/api/cold-calling`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              tabName: activeTab,
              ...row,
              rowNumber: index + 1,
            }),
          });
        } else {
          // Update existing row
          return fetch(`${API_BASE}/api/cold-calling/${row._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...row,
              rowNumber: index + 1,
            }),
          });
        }
      });

      await Promise.all(updatePromises);
      setHasChanges(false);
      await fetchData(activeTab);
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [rows, activeTab, token, hasChanges, fetchData]);

  // Handle cell edit
  const startEditing = (rowIndex: number, columnKey: string) => {
    const row = rows[rowIndex];
    setEditingCell({ rowIndex, columnKey });
    setEditValue(row[columnKey as keyof ColdCallingRow] as string || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const finishEditing = (newValue?: string) => {
    if (!editingCell) return;

    const { rowIndex, columnKey } = editingCell;
    const newRows = [...rows];
    const oldValue = newRows[rowIndex][columnKey as keyof ColdCallingRow] as string || '';
    const finalValue = newValue !== undefined ? newValue : editValue;
    
    if (finalValue !== oldValue) {
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        [columnKey]: finalValue,
      };
      setRows(newRows);
      setHasChanges(true);
    }

    setEditingCell(null);
    setEditValue('');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Add new row
  const addRow = useCallback(() => {
    const newRow: ColdCallingRow = {
      concernName: '',
      companyName: '',
      destination: '',
      phone1: '',
      phone2: '',
      sujata: '',
      followUpDate: '',
      rating: '',
      broadcast: '',
      status: '',
    };
    setRows((prev) => [...prev, newRow]);
    setHasChanges(true);
  }, []);
  const handleStatusChange = useCallback(
    (rowIndex: number, value: ColdCallingStatus) => {
      let didChange = false;
      setRows((prev) => {
        if (!prev[rowIndex] || prev[rowIndex].status === value) {
          return prev;
        }
        didChange = true;
        const updated = [...prev];
        updated[rowIndex] = {
          ...updated[rowIndex],
          status: value,
        };
        return updated;
      });
      if (didChange) {
        setHasChanges(true);
      }
    },
    [],
  );


  // Delete row
  const deleteRow = async (rowIndex: number) => {
    const row = rows[rowIndex];
    if (!row._id) {
      // Just remove from local state if not saved
      const newRows = rows.filter((_, i) => i !== rowIndex);
      setRows(newRows);
      setHasChanges(true);
      return;
    }

    if (!token) return;

    if (!window.confirm('Are you sure you want to delete this row?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/cold-calling/${row._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const newRows = rows.filter((_, i) => i !== rowIndex);
        setRows(newRows);
        await fetchData(activeTab);
      } else {
        throw new Error('Failed to delete row');
      }
    } catch (error) {
      console.error('Error deleting row:', error);
      alert('Failed to delete row. Please try again.');
    }
  };

  // Handle tab change
  const handleTabChange = (tabName: string): void => {
    if (tabName === activeTab) {
      return;
    }

    if (hasChanges) {
      const shouldDiscard = window.confirm('You have unsaved changes. Do you want to discard them?');
      if (!shouldDiscard) {
        return;
      }
      setHasChanges(false);
    }
    setActiveTab(tabName);
  };

  // Add new tab
  const handleAddTab = () => {
    const newTab = window.prompt('Enter a name for the new tab');
    if (!newTab) {
      return;
    }
    const formatted = newTab.trim();
    if (!formatted) {
      return;
    }

    if (tabs.some((tab) => tab.toLowerCase() === formatted.toLowerCase())) {
      window.alert('A tab with that name already exists.');
      return;
    }

    setTabs((prev) => [...prev, formatted]);
    setHasChanges(false);
    setActiveTab(formatted);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && editingCell) {
        cancelEditing();
      } else if (e.key === 'Enter' && editingCell) {
        finishEditing();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveChanges();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, saveChanges]);

  return (
    <div className="flex h-full flex-col bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-300 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={addRow}
            className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </button>
          <button
            onClick={saveChanges}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save'}
          </button>
          {hasChanges && (
            <span className="text-xs text-orange-600">Unsaved changes</span>
          )}
        </div>
      </div>

      {/* Spreadsheet */}
      <div
        ref={tableRef}
        className="flex-1 overflow-auto bg-white"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e8eaed 0px, transparent 0px),
            linear-gradient(to bottom, #e8eaed 0px, transparent 0px)
          `,
          backgroundSize: '40px 25px',
        }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="inline-block min-w-full">
            {/* Column Headers */}
            <div className="sticky top-0 z-10 flex border-b border-gray-400 bg-[#f8f9fa]">
              <div className="sticky left-0 z-20 w-10 border-r border-gray-400 bg-[#f8f9fa]"></div>
              <div
                className="flex items-center border-r border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700"
                style={{ width: 150, minWidth: 150 }}
              >
                Status
              </div>
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center border-r border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700"
                  style={{ width: col.width, minWidth: col.width }}
                >
                  {col.label}
                </div>
              ))}
            </div>

            {/* Rows */}
            {rows.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-gray-500">
                No data. Click "Add Row" to start.
              </div>
            ) : (
              rows.map((row, rowIndex) => (
                <div
                  key={row._id || rowIndex}
                  className="flex border-b border-gray-200 hover:bg-blue-50"
                  style={{
                    backgroundColor: row.backgroundColor || 'white',
                  }}
                >
                  {/* Row Number */}
                  <div className="sticky left-0 z-10 flex w-10 items-center justify-center border-r border-gray-300 bg-white text-xs text-gray-600">
                    {rowIndex + 1}
                  </div>
                  <div
                    className="flex items-center border-r border-gray-200 px-2 py-1"
                    style={{ width: 150, minWidth: 150 }}
                  >
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      {statusOptions.map((option) => (
                        <label
                          key={option.value || 'none'}
                          className="flex cursor-pointer items-center select-none"
                          title={option.description}
                        >
                          <input
                            type="radio"
                            name={`status-${rowIndex}`}
                            value={option.value}
                            checked={row.status === option.value}
                            onChange={() => handleStatusChange(rowIndex, option.value)}
                            className="sr-only"
                          />
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-white text-xs font-semibold ${
                              row.status === option.value
                                ? option.colorClass
                                : 'bg-white text-gray-500'
                            }`}
                          >
                            {option.symbol}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Cells */}
                  {columns.map((col) => {
                    const isEditing =
                      editingCell?.rowIndex === rowIndex &&
                      editingCell?.columnKey === col.key;
                    const cellValue = row[col.key as keyof ColdCallingRow] as string || '';
                    const isBroadcast = col.key === 'broadcast';

                    return (
                      <div
                        key={col.key}
                        className="border-r border-gray-200 px-1 py-0.5 text-sm text-gray-900"
                        style={{ width: col.width, minWidth: col.width }}
                        onClick={() => !isEditing && startEditing(rowIndex, col.key)}
                        onDoubleClick={() => startEditing(rowIndex, col.key)}
                      >
                        {isEditing ? (
                          isBroadcast ? (
                            <select
                              ref={inputRef as any}
                              value={editValue}
                              onChange={(e) => {
                                finishEditing(e.target.value);
                              }}
                              onBlur={() => finishEditing()}
                              className="h-full w-full border border-blue-500 bg-white px-1 text-sm outline-none"
                              autoFocus
                            >
                              <option value="">Select...</option>
                              <option value="YES">YES</option>
                              <option value="NO">NO</option>
                            </select>
                          ) : (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={finishEditing}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  finishEditing();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  cancelEditing();
                                }
                              }}
                              className="h-full w-full border border-blue-500 bg-white px-1 text-sm outline-none"
                              autoFocus
                            />
                          )
                        ) : (
                          <div className="min-h-[20px] px-1 py-0.5">
                            {cellValue || '\u00A0'}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Delete Button */}
                  <div className="flex items-center px-2">
                    <button
                      onClick={() => deleteRow(rowIndex)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tab Bar (Google Sheets style) */}
      <div className="border-t border-gray-300 bg-[#f1f3f4] px-2 py-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`min-w-[80px] rounded-t px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                }`}
                type="button"
              >
                {tab}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleAddTab}
            className="ml-2 rounded px-2 py-1 text-gray-600 hover:bg-gray-200"
            title="Add new tab"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColdCalling;
