import { useState, useEffect } from 'react';
import { api, Part, Location, OnHand, InventoryEvent } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';

export function InventoryPage() {
  const { canFulfill, isManager } = useAuth();
  const [onHand, setOnHand] = useState<OnHand[]>([]);
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showCorrectModal, setShowCorrectModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Forms
  const [receiveForm, setReceiveForm] = useState({ partId: '', locationId: '', qty: 1, reason: '' });
  const [correctForm, setCorrectForm] = useState({ partId: '', locationId: '', qty: 0, reason: '' });
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [onHandData, eventsData, partsData, locationsData] = await Promise.all([
        api.getOnHand(),
        api.getEvents(),
        api.getParts(),
        api.getLocations(),
      ]);
      setOnHand(onHandData);
      setEvents(eventsData.events);
      setParts(partsData.parts);
      setLocations(locationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.receiveStock(
        parseInt(receiveForm.partId),
        parseInt(receiveForm.locationId),
        receiveForm.qty,
        receiveForm.reason || undefined
      );
      setShowReceiveModal(false);
      setReceiveForm({ partId: '', locationId: '', qty: 1, reason: '' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to receive stock');
    }
  };

  const handleCorrect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.correctStock(
        parseInt(correctForm.partId),
        parseInt(correctForm.locationId),
        correctForm.qty,
        correctForm.reason
      );
      setShowCorrectModal(false);
      setCorrectForm({ partId: '', locationId: '', qty: 0, reason: '' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to correct stock');
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLocation(locationName);
      setShowLocationModal(false);
      setLocationName('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case 'RECEIVE': return 'badge-fulfilled';
      case 'FULFILL': return 'badge-approved';
      case 'RETURN': return 'badge-pending';
      case 'CORRECTION': return 'badge-cancelled';
      default: return '';
    }
  };

  return (
    <Layout>
      <div className="flex-between mb-6">
        <h1>Inventory</h1>
        <div className="flex gap-2">
          {isManager && (
            <>
              <button className="btn btn-secondary" onClick={() => setShowLocationModal(true)}>
                + Location
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCorrectModal(true)}>
                Correction
              </button>
            </>
          )}
          {canFulfill && (
            <button className="btn btn-primary" onClick={() => setShowReceiveModal(true)}>
              Receive Stock
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="grid grid-2 mb-6">
        {/* On-Hand Quantities */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">On-Hand Quantities</h3>
          </div>
          {loading ? (
            <div className="card-body">Loading...</div>
          ) : onHand.length === 0 ? (
            <div className="empty-state">
              <h3>No inventory</h3>
              <p>Receive stock to get started</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Location</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {onHand.map((item, idx) => (
                    <tr key={idx}>
                      <td><strong>{item.part?.sku}</strong> - {item.part?.name}</td>
                      <td>{item.location?.name}</td>
                      <td>
                        <strong style={{ color: item.quantity > 0 ? 'var(--success)' : 'var(--danger)' }}>
                          {item.quantity}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Locations */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Locations</h3>
          </div>
          {loading ? (
            <div className="card-body">Loading...</div>
          ) : locations.length === 0 ? (
            <div className="empty-state">
              <h3>No locations</h3>
              <p>Create a location to track inventory</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Location Name</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => (
                    <tr key={loc.id}>
                      <td>{loc.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Inventory Events</h3>
        </div>
        {loading ? (
          <div className="card-body">Loading...</div>
        ) : events.length === 0 ? (
          <div className="empty-state">
            <h3>No events</h3>
            <p>Inventory events will appear here</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Part</th>
                  <th>Location</th>
                  <th>Qty Change</th>
                  <th>Reason</th>
                  <th>User</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDate(event.createdAt)}</td>
                    <td>
                      <span className={`badge ${getEventBadgeClass(event.type)}`}>
                        {event.type}
                      </span>
                    </td>
                    <td>{event.part?.sku}</td>
                    <td>{event.location?.name}</td>
                    <td>
                      <strong style={{ color: event.qtyDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {event.qtyDelta >= 0 ? '+' : ''}{event.qtyDelta}
                      </strong>
                    </td>
                    <td>{event.reason || '-'}</td>
                    <td>{event.user?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receive Stock Modal */}
      {showReceiveModal && (
        <div className="modal-backdrop" onClick={() => setShowReceiveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Receive Stock</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReceiveModal(false)}>×</button>
            </div>
            <form onSubmit={handleReceive}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Part</label>
                  <select
                    className="form-select"
                    value={receiveForm.partId}
                    onChange={(e) => setReceiveForm({ ...receiveForm, partId: e.target.value })}
                    required
                  >
                    <option value="">Select part...</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select
                    className="form-select"
                    value={receiveForm.locationId}
                    onChange={(e) => setReceiveForm({ ...receiveForm, locationId: e.target.value })}
                    required
                  >
                    <option value="">Select location...</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    value={receiveForm.qty}
                    onChange={(e) => setReceiveForm({ ...receiveForm, qty: parseInt(e.target.value) || 1 })}
                    required
                    min={1}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={receiveForm.reason}
                    onChange={(e) => setReceiveForm({ ...receiveForm, reason: e.target.value })}
                    placeholder="PO #12345"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReceiveModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success">Receive Stock</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {showCorrectModal && (
        <div className="modal-backdrop" onClick={() => setShowCorrectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Stock Correction</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCorrectModal(false)}>×</button>
            </div>
            <form onSubmit={handleCorrect}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Part</label>
                  <select
                    className="form-select"
                    value={correctForm.partId}
                    onChange={(e) => setCorrectForm({ ...correctForm, partId: e.target.value })}
                    required
                  >
                    <option value="">Select part...</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <select
                    className="form-select"
                    value={correctForm.locationId}
                    onChange={(e) => setCorrectForm({ ...correctForm, locationId: e.target.value })}
                    required
                  >
                    <option value="">Select location...</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity Adjustment (+ or -)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={correctForm.qty}
                    onChange={(e) => setCorrectForm({ ...correctForm, qty: parseInt(e.target.value) || 0 })}
                    required
                    placeholder="Use negative for decrease"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reason (required)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={correctForm.reason}
                    onChange={(e) => setCorrectForm({ ...correctForm, reason: e.target.value })}
                    required
                    placeholder="Physical count adjustment"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCorrectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Apply Correction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Location Modal */}
      {showLocationModal && (
        <div className="modal-backdrop" onClick={() => setShowLocationModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Location</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowLocationModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateLocation}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Location Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    required
                    placeholder="Main Warehouse"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLocationModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Location</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
