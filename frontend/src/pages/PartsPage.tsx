import { useState, useEffect } from 'react';
import { api, Part, InterchangeGroup } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';

export function PartsPage() {
  const { isManager } = useAuth();
  const [parts, setParts] = useState<Part[]>([]);
  const [groups, setGroups] = useState<InterchangeGroup[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showPartModal, setShowPartModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showFitmentModal, setShowFitmentModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  // Forms
  const [partForm, setPartForm] = useState({ sku: '', name: '', description: '' });
  const [vehicleForm, setVehicleForm] = useState({ year: 2024, make: '', model: '', trim: '' });
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');

  // Cascading vehicle selectors (shared between create-part and fitment modals)
  const [partVehicleYear, setPartVehicleYear] = useState<number | ''>('');
  const [partVehicleMake, setPartVehicleMake] = useState('');
  const [partVehicleId, setPartVehicleId] = useState<number | ''>('');
  const [partMakes, setPartMakes] = useState<string[]>([]);
  const [partModels, setPartModels] = useState<{ id: number; model: string; trim: string | null }[]>([]);

  const [fitYear, setFitYear] = useState<number | ''>('');
  const [fitMake, setFitMake] = useState('');
  const [fitVehicleId, setFitVehicleId] = useState<number | ''>('');
  const [fitMakes, setFitMakes] = useState<string[]>([]);
  const [fitModels, setFitModels] = useState<{ id: number; model: string; trim: string | null }[]>([]);

  // Load makes when year changes (part modal)
  useEffect(() => {
    if (partVehicleYear === '') { setPartMakes([]); setPartVehicleMake(''); setPartModels([]); setPartVehicleId(''); return; }
    api.getVehicleMakes(partVehicleYear).then(setPartMakes).catch(() => setPartMakes([]));
    setPartVehicleMake(''); setPartModels([]); setPartVehicleId('');
  }, [partVehicleYear]);

  // Load models when make changes (part modal)
  useEffect(() => {
    if (partVehicleYear === '' || !partVehicleMake) { setPartModels([]); setPartVehicleId(''); return; }
    api.getVehicleModels(partVehicleYear, partVehicleMake).then(setPartModels).catch(() => setPartModels([]));
    setPartVehicleId('');
  }, [partVehicleMake]);

  // Load makes when year changes (fitment modal)
  useEffect(() => {
    if (fitYear === '') { setFitMakes([]); setFitMake(''); setFitModels([]); setFitVehicleId(''); return; }
    api.getVehicleMakes(fitYear).then(setFitMakes).catch(() => setFitMakes([]));
    setFitMake(''); setFitModels([]); setFitVehicleId('');
  }, [fitYear]);

  // Load models when make changes (fitment modal)
  useEffect(() => {
    if (fitYear === '' || !fitMake) { setFitModels([]); setFitVehicleId(''); return; }
    api.getVehicleModels(fitYear, fitMake).then(setFitModels).catch(() => setFitModels([]));
    setFitVehicleId('');
  }, [fitMake]);

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [partsData, groupsData] = await Promise.all([
        api.getParts(search),
        api.getInterchangeGroups(),
      ]);
      setParts(partsData.parts);
      setGroups(groupsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const part = await api.createPart(partForm.sku, partForm.name, partForm.description || undefined);
      // If a vehicle was selected, auto-create fitment
      if (partVehicleId !== '') {
        try {
          await api.addFitment(part.id, partVehicleId);
        } catch (fitErr) {
          console.warn('Part created but fitment failed:', fitErr);
        }
      }
      setShowPartModal(false);
      setPartForm({ sku: '', name: '', description: '' });
      setPartVehicleYear(''); setPartVehicleMake(''); setPartVehicleId('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create part');
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createVehicle(vehicleForm.year, vehicleForm.make, vehicleForm.model, vehicleForm.trim || undefined);
      setShowVehicleModal(false);
      setVehicleForm({ year: 2024, make: '', model: '', trim: '' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vehicle');
    }
  };

  const handleAddFitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || fitVehicleId === '') return;
    try {
      await api.addFitment(selectedPart.id, fitVehicleId);
      setShowFitmentModal(false);
      setFitYear(''); setFitMake(''); setFitVehicleId('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add fitment');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createInterchangeGroup(groupForm.name, groupForm.description || undefined);
      setShowGroupModal(false);
      setGroupForm({ name: '', description: '' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    }
  };

  const handleAddToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPart || selectedGroupId === '') return;
    try {
      await api.addGroupMember(selectedGroupId, selectedPart.id);
      setShowAddToGroupModal(false);
      setSelectedGroupId('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to group');
    }
  };

  return (
    <Layout>
      <div className="flex-between mb-6">
        <h1>Parts Catalog</h1>
        {isManager && (
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={() => setShowVehicleModal(true)}>
              + Vehicle
            </button>
            <button className="btn btn-secondary" onClick={() => setShowGroupModal(true)}>
              + Interchange Group
            </button>
            <button className="btn btn-primary" onClick={() => setShowPartModal(true)}>
              + New Part
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card mb-4">
        <div className="card-body">
          <input
            type="text"
            className="form-input"
            placeholder="Search parts by SKU, name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="card-body">Loading...</div>
          ) : parts.length === 0 ? (
            <div className="empty-state">
              <h3>No parts found</h3>
              <p>Create your first part to get started</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Fitments</th>
                  <th>Interchange Groups</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => (
                  <tr key={part.id}>
                    <td><strong>{part.sku}</strong></td>
                    <td>{part.name}</td>
                    <td>{part.description || '-'}</td>
                    <td>
                      {part.fitments && part.fitments.length > 0 ? (
                        <span>{part.fitments.length} vehicle(s)</span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>None</span>
                      )}
                    </td>
                    <td>
                      {part.interchangeMembers && part.interchangeMembers.length > 0 ? (
                        part.interchangeMembers.map((m) => m.group?.name).join(', ')
                      ) : (
                        <span style={{ color: 'var(--gray-400)' }}>None</span>
                      )}
                    </td>
                    {isManager && (
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedPart(part);
                              setShowFitmentModal(true);
                            }}
                          >
                            + Fitment
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedPart(part);
                              setShowAddToGroupModal(true);
                            }}
                          >
                            + Group
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Part Modal */}
      {showPartModal && (
        <div className="modal-backdrop" onClick={() => setShowPartModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Part</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPartModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreatePart}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    className="form-input"
                    value={partForm.sku}
                    onChange={(e) => setPartForm({ ...partForm, sku: e.target.value })}
                    required
                    placeholder="BRK-001"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={partForm.name}
                    onChange={(e) => setPartForm({ ...partForm, name: e.target.value })}
                    required
                    placeholder="Brake Pad Set"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={partForm.description}
                    onChange={(e) => setPartForm({ ...partForm, description: e.target.value })}
                    placeholder="Front brake pads for sedans"
                  />
                </div>
                <hr style={{ margin: '16px 0', borderColor: 'var(--gray-200)' }} />
                <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginBottom: '12px' }}>
                  Optionally link a vehicle fitment:
                </p>
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select
                    className="form-select"
                    value={partVehicleYear}
                    onChange={(e) => setPartVehicleYear(e.target.value ? parseInt(e.target.value) : '')}
                  >
                    <option value="">-- No vehicle --</option>
                    {Array.from({ length: 27 }, (_, i) => 2000 + i).reverse().map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {partVehicleYear !== '' && (
                  <div className="form-group">
                    <label className="form-label">Make</label>
                    <select
                      className="form-select"
                      value={partVehicleMake}
                      onChange={(e) => setPartVehicleMake(e.target.value)}
                    >
                      <option value="">Select make...</option>
                      {partMakes.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
                {partVehicleMake && (
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <select
                      className="form-select"
                      value={partVehicleId}
                      onChange={(e) => setPartVehicleId(e.target.value ? parseInt(e.target.value) : '')}
                    >
                      <option value="">Select model...</option>
                      {partModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.model}{m.trim ? ` (${m.trim})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPartModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Part</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Vehicle Modal */}
      {showVehicleModal && (
        <div className="modal-backdrop" onClick={() => setShowVehicleModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Vehicle</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowVehicleModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateVehicle}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Year (2000 or later)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={vehicleForm.year}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, year: parseInt(e.target.value) })}
                    required
                    min={2000}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Make</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vehicleForm.make}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                    required
                    placeholder="Honda"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vehicleForm.model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                    required
                    placeholder="Civic"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Trim (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={vehicleForm.trim}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, trim: e.target.value })}
                    placeholder="EX"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVehicleModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Fitment Modal */}
      {showFitmentModal && selectedPart && (
        <div className="modal-backdrop" onClick={() => setShowFitmentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Fitment to {selectedPart.sku}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowFitmentModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddFitment}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select
                    className="form-select"
                    value={fitYear}
                    onChange={(e) => setFitYear(e.target.value ? parseInt(e.target.value) : '')}
                    required
                  >
                    <option value="">Select year...</option>
                    {Array.from({ length: 27 }, (_, i) => 2000 + i).reverse().map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {fitYear !== '' && (
                  <div className="form-group">
                    <label className="form-label">Make</label>
                    <select
                      className="form-select"
                      value={fitMake}
                      onChange={(e) => setFitMake(e.target.value)}
                      required
                    >
                      <option value="">Select make...</option>
                      {fitMakes.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                )}
                {fitMake && (
                  <div className="form-group">
                    <label className="form-label">Model</label>
                    <select
                      className="form-select"
                      value={fitVehicleId}
                      onChange={(e) => setFitVehicleId(e.target.value ? parseInt(e.target.value) : '')}
                      required
                    >
                      <option value="">Select model...</option>
                      {fitModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.model}{m.trim ? ` (${m.trim})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFitmentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Fitment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="modal-backdrop" onClick={() => setShowGroupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Interchange Group</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowGroupModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Group Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                    required
                    placeholder="Front Brake Pads - Civic"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={groupForm.description}
                    onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                    placeholder="Interchangeable front brake pads for Honda Civic 2016-2024"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowGroupModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add to Group Modal */}
      {showAddToGroupModal && selectedPart && (
        <div className="modal-backdrop" onClick={() => setShowAddToGroupModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add {selectedPart.sku} to Interchange Group</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAddToGroupModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddToGroup}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Group</label>
                  <select
                    className="form-select"
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : '')}
                    required
                  >
                    <option value="">Choose a group...</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddToGroupModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add to Group</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
