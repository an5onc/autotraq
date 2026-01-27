import { useState, useEffect } from 'react';
import { api, Part, Location, Request } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';

export function RequestsPage() {
  const { isManager, canFulfill } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [requestItems, setRequestItems] = useState<{ partId: string; qty: number; locationId: string }[]>([
    { partId: '', qty: 1, locationId: '' },
  ]);
  const [requestNotes, setRequestNotes] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsData, partsData, locationsData] = await Promise.all([
        api.getRequests(statusFilter || undefined),
        api.getParts(),
        api.getLocations(),
      ]);
      setRequests(requestsData.requests);
      setParts(partsData.parts);
      setLocations(locationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = requestItems
        .filter((item) => item.partId)
        .map((item) => ({
          partId: parseInt(item.partId),
          qtyRequested: item.qty,
          locationId: item.locationId ? parseInt(item.locationId) : undefined,
        }));

      if (items.length === 0) {
        setError('Please add at least one item');
        return;
      }

      await api.createRequest(items, requestNotes || undefined);
      setShowCreateModal(false);
      setRequestItems([{ partId: '', qty: 1, locationId: '' }]);
      setRequestNotes('');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approveRequest(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    }
  };

  const handleFulfill = async (id: number) => {
    try {
      await api.fulfillRequest(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fulfill request');
    }
  };

  const addItem = () => {
    setRequestItems([...requestItems, { partId: '', qty: 1, locationId: '' }]);
  };

  const removeItem = (index: number) => {
    setRequestItems(requestItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...requestItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setRequestItems(newItems);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'APPROVED': return 'badge-approved';
      case 'FULFILLED': return 'badge-fulfilled';
      case 'CANCELLED': return 'badge-cancelled';
      default: return '';
    }
  };

  return (
    <Layout>
      <div className="flex-between mb-6">
        <h1>Requests</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + New Request
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Status Filter */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="flex gap-2">
            <button
              className={`btn ${!statusFilter ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('')}
            >
              All
            </button>
            <button
              className={`btn ${statusFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('PENDING')}
            >
              Pending
            </button>
            <button
              className={`btn ${statusFilter === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('APPROVED')}
            >
              Approved
            </button>
            <button
              className={`btn ${statusFilter === 'FULFILLED' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('FULFILLED')}
            >
              Fulfilled
            </button>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="card">
        {loading ? (
          <div className="card-body">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <h3>No requests found</h3>
            <p>Create a new request to get started</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Created By</th>
                  <th>Created</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td><strong>#{request.id}</strong></td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td>
                      {request.items.map((item, i) => (
                        <div key={i} style={{ fontSize: '0.875rem' }}>
                          {item.part?.sku}: {item.qtyRequested} pcs
                          {item.location && ` @ ${item.location.name}`}
                        </div>
                      ))}
                    </td>
                    <td>{request.creator?.name}</td>
                    <td>{formatDate(request.createdAt)}</td>
                    <td>{request.notes || '-'}</td>
                    <td>
                      <div className="flex gap-2">
                        {request.status === 'PENDING' && isManager && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleApprove(request.id)}
                          >
                            Approve
                          </button>
                        )}
                        {request.status === 'APPROVED' && canFulfill && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleFulfill(request.id)}
                          >
                            Fulfill
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Create New Request</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="modal-body">
                <div className="mb-4">
                  <label className="form-label">Request Items</label>
                  {requestItems.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2" style={{ alignItems: 'flex-end' }}>
                      <div style={{ flex: 2 }}>
                        <select
                          className="form-select"
                          value={item.partId}
                          onChange={(e) => updateItem(index, 'partId', e.target.value)}
                          required
                        >
                          <option value="">Select part...</option>
                          {parts.map((p) => (
                            <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          className="form-input"
                          value={item.qty}
                          onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
                          min={1}
                          placeholder="Qty"
                        />
                      </div>
                      <div style={{ flex: 2 }}>
                        <select
                          className="form-select"
                          value={item.locationId}
                          onChange={(e) => updateItem(index, 'locationId', e.target.value)}
                        >
                          <option value="">Location (optional)</option>
                          {locations.map((l) => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                          ))}
                        </select>
                      </div>
                      {requestItems.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeItem(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm mt-4" onClick={addItem}>
                    + Add Another Item
                  </button>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="Urgent order for customer"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
