import { useState, useEffect } from 'react';
import { Barcode } from '../components/Barcode';
import JsBarcode from 'jsbarcode';
import { useSearchParams } from 'react-router-dom';
import { api, UserWithCreator, RoleRequest } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/Layout';
import {
  Users, ShieldCheck, ShieldAlert, UserPlus, Check, X, RefreshCw,
  QrCode, Printer, ChevronDown, ChevronUp, KeyRound, Lock, Trash2,
} from 'lucide-react';

type Tab = 'users' | 'requests' | 'create' | 'my-barcode' | 'security';

export function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as Tab) || (isAdmin ? 'users' : 'my-barcode');
  const [tab, setTab] = useState<Tab>(initialTab);
  const [users, setUsers] = useState<UserWithCreator[]>([]);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create user form
  const [createForm, setCreateForm] = useState({ email: '', password: '', name: '', role: 'viewer' });

  // My barcode
  const [myBarcode, setMyBarcode] = useState<string | null>(null);

  // Expanded barcode view
  const [expandedBarcode, setExpandedBarcode] = useState<number | null>(null);
  const [userBarcodes, setUserBarcodes] = useState<Record<number, string>>({});

  // Password reset
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState('');

  // Change own password
  const [changePass, setChangePass] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (isAdmin) {
        const [usersData, requestsData] = await Promise.all([
          api.listUsers(),
          api.getRoleRequests(),
        ]);
        setUsers(usersData);
        setRoleRequests(requestsData);
      }
      // Load my barcode if admin or manager
      if (user?.role === 'admin' || user?.role === 'manager') {
        const { barcode } = await api.getMyBarcode();
        setMyBarcode(barcode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.adminCreateUser(createForm.email, createForm.password, createForm.name, createForm.role);
      setSuccess(`User "${createForm.name}" created as ${createForm.role}`);
      setCreateForm({ email: '', password: '', name: '', role: 'viewer' });
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleDecideRequest = async (id: number, approved: boolean) => {
    setError('');
    setSuccess('');
    try {
      await api.decideRoleRequest(id, approved);
      setSuccess(approved ? 'Role request approved' : 'Role request denied');
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request');
    }
  };

  const handleAdminResetPassword = async (userId: number) => {
    if (!resetPassword || resetPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    try {
      await api.adminResetPassword(userId, resetPassword);
      setSuccess('Password reset successfully');
      setResetUserId(null);
      setResetPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (changePass.new !== changePass.confirm) {
      setError('New passwords do not match');
      return;
    }
    try {
      await api.changePassword(changePass.current, changePass.new);
      setSuccess('Password changed successfully');
      setChangePass({ current: '', new: '', confirm: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  const handleDeleteUser = async (u: UserWithCreator) => {
    if (u.id === user?.id) {
      setError("Can't delete your own account");
      return;
    }
    if (!confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) return;
    setError('');
    try {
      await api.deleteUser(u.id);
      setSuccess(`User "${u.name}" deleted`);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleRegenerateBarcode = async (userId: number) => {
    setError('');
    try {
      const { barcode } = await api.regenerateBarcode(userId);
      setUserBarcodes(prev => ({ ...prev, [userId]: barcode }));
      setSuccess('Barcode regenerated');
      if (userId === user?.id) setMyBarcode(barcode);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate barcode');
    }
  };

  const printBarcode = (barcode: string, userName: string) => {
    // Render barcode to a temporary SVG, then serialize to embed in print
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    try {
      JsBarcode(svgEl, barcode, {
        format: 'CODE128',
        width: 1.5,
        height: 50,
        displayValue: false,
        margin: 4,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch { return; }

    const svgHtml = new XMLSerializer().serializeToString(svgEl);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html><head><title>Barcode - ${userName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: 3.375in 2.125in; margin: 0; }
        body { display: flex; align-items: center; justify-content: center; width: 3.375in; height: 2.125in; font-family: system-ui, -apple-system, sans-serif; }
        .card { text-align: center; padding: 10px; width: 100%; }
        .brand { font-size: 14px; font-weight: 900; letter-spacing: 3px; margin-bottom: 4px; }
        .name { font-size: 11px; color: #333; margin-bottom: 8px; }
        .barcode { margin: 0 auto 6px; }
        .barcode svg { display: block; margin: 0 auto; max-width: 100%; }
        .hint { font-size: 8px; color: #888; }
        @media screen {
          body { height: 100vh; width: 100vw; background: #f0f0f0; }
          .card { background: white; width: 3.375in; height: 2.125in; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.15); display: flex; flex-direction: column; align-items: center; justify-content: center; }
        }
      </style></head><body>
      <div class="card">
        <div class="brand">AUTOTRAQ</div>
        <div class="name">${userName}</div>
        <div class="barcode">${svgHtml}</div>
        <div class="hint">Scan to log in</div>
      </div>
      <script>setTimeout(() => window.print(), 300)<\/script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const pendingRequests = roleRequests.filter(r => r.status === 'PENDING');
  const pastRequests = roleRequests.filter(r => r.status !== 'PENDING');
  const adminCount = users.filter(u => u.role === 'admin').length;

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number; adminOnly?: boolean }[] = [
    { id: 'users', label: 'Users', icon: Users, adminOnly: true },
    { id: 'requests', label: 'Role Requests', icon: ShieldAlert, badge: pendingRequests.length, adminOnly: true },
    { id: 'create', label: 'Create User', icon: UserPlus, adminOnly: true },
    { id: 'my-barcode', label: 'My Barcode', icon: QrCode },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight">Admin Panel</h1>
        <p className="text-slate-400 mt-1">User management, role requests, and barcode access</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {tabs.filter(t => !t.adminOnly || isAdmin).map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setError(''); setSuccess(''); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              tab === t.id
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.badge ? (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white">{t.badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{success}</div>
      )}

      {/* USERS TAB */}
      {tab === 'users' && isAdmin && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-400">{users.length} users · {adminCount}/4 admin slots used</p>
          </div>
          {users.map(u => (
            <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-amber-400">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{u.name}</p>
                    <p className="text-slate-500 text-sm">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    u.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    u.role === 'manager' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    u.role === 'fulfillment' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-slate-700/50 text-slate-400 border border-slate-600'
                  }`}>
                    {u.role}
                  </span>
                  <button
                    onClick={() => { setResetUserId(resetUserId === u.id ? null : u.id); setResetPassword(''); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Reset PW
                  </button>
                  {u.id !== user?.id && (
                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(u.role === 'admin' || u.role === 'manager') && (
                    <button
                      onClick={() => setExpandedBarcode(expandedBarcode === u.id ? null : u.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Barcode
                      {expandedBarcode === u.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Reset password inline */}
              {resetUserId === u.id && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-400 mb-1.5">New Password</label>
                      <input
                        type="password"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        minLength={8}
                        className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <button
                      onClick={() => handleAdminResetPassword(u.id)}
                      className="px-4 py-2.5 rounded-lg text-sm bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => { setResetUserId(null); setResetPassword(''); }}
                      className="px-3 py-2.5 rounded-lg text-sm bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded barcode section */}
              {expandedBarcode === u.id && (u.role === 'admin' || u.role === 'manager') && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  {u.id === user?.id ? (
                    /* Show your own barcode */
                    <div className="flex flex-col gap-4">
                      <div className="bg-white p-3 rounded-xl inline-block self-start">
                        <Barcode
                          value={userBarcodes[u.id] || u.loginBarcode || ''}
                          width={1.5}
                          height={50}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-slate-500 mb-1">Your Login Barcode</p>
                        <p className="text-xs text-slate-400 font-mono break-all mb-3">
                          {userBarcodes[u.id] || u.loginBarcode || 'No barcode assigned'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRegenerateBarcode(u.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" /> Regenerate
                          </button>
                          <button
                            onClick={() => printBarcode(userBarcodes[u.id] || u.loginBarcode || '', u.name)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                          >
                            <Printer className="w-3 h-3" /> Print
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Other users — hide barcode, only allow print & regenerate */
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Login Barcode</p>
                        <p className="text-xs text-slate-400">Barcode hidden for security</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRegenerateBarcode(u.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Regenerate
                        </button>
                        <button
                          onClick={() => printBarcode(userBarcodes[u.id] || u.loginBarcode || '', u.name)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3 h-3" /> Print Card
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ROLE REQUESTS TAB */}
      {tab === 'requests' && isAdmin && (
        <div className="space-y-6">
          {pendingRequests.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-amber-400 uppercase tracking-wider mb-3">Pending Requests</h3>
              <div className="space-y-3">
                {pendingRequests.map(r => (
                  <div key={r.id} className="bg-slate-900 border border-amber-500/20 rounded-xl p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{r.user?.name}</p>
                        <p className="text-slate-500 text-sm">{r.user?.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{r.user?.role}</span>
                          <span className="text-xs text-slate-600">→</span>
                          <span className="text-xs text-amber-400 font-medium">{r.requestedRole}</span>
                        </div>
                        {r.reason && <p className="text-sm text-slate-400 mt-2 italic">"{r.reason}"</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecideRequest(r.id, true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20 transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleDecideRequest(r.id, false)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" /> Deny
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingRequests.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No pending role requests</p>
            </div>
          )}

          {pastRequests.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">History</h3>
              <div className="space-y-2">
                {pastRequests.map(r => (
                  <div key={r.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm">{r.user?.name} — {r.user?.role} → {r.requestedRole}</p>
                      {r.decidedBy && <p className="text-xs text-slate-500">Decided by {r.decidedBy.name}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      r.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE USER TAB */}
      {tab === 'create' && isAdmin && (
        <div className="max-w-lg">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="viewer">Viewer</option>
                  <option value="fulfillment">Fulfillment</option>
                  <option value="manager">Manager</option>
                  {adminCount < 4 && <option value="admin">Admin</option>}
                </select>
                {createForm.role === 'admin' && (
                  <p className="text-xs text-amber-400 mt-2">⚠️ {adminCount}/4 admin slots used. Admin accounts use barcode login.</p>
                )}
                {createForm.role === 'manager' && (
                  <p className="text-xs text-slate-500 mt-2">Manager accounts use barcode login. A QR code will be generated automatically.</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MY BARCODE TAB */}
      {tab === 'my-barcode' && (
        <div className="max-w-md mx-auto">
          {myBarcode ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
              <h3 className="text-lg font-bold text-white mb-1">Your Login Barcode</h3>
              <p className="text-sm text-slate-500 mb-6">Scan this barcode to log in</p>
              <div className="inline-block bg-white p-4 rounded-2xl mb-6">
                <Barcode value={myBarcode} width={2} height={70} />
              </div>
              <p className="text-xs text-slate-500 font-mono break-all mb-6">{myBarcode}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => printBarcode(myBarcode, user?.name || 'User')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm bg-amber-500 text-slate-900 font-medium hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleRegenerateBarcode(user!.id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" /> Regenerate
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Barcode login is for Admin and Manager accounts only.</p>
              <p className="text-sm mt-2">You can request a promotion to Manager from your profile.</p>
            </div>
          )}
        </div>
      )}
      {/* SECURITY TAB — Change own password */}
      {tab === 'security' && (
        <div className="max-w-lg">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-1">Change Password</h3>
            <p className="text-sm text-slate-500 mb-6">Update your account password</p>
            <form onSubmit={handleChangeOwnPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  value={changePass.current}
                  onChange={(e) => setChangePass(f => ({ ...f, current: e.target.value }))}
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  value={changePass.new}
                  onChange={(e) => setChangePass(f => ({ ...f, new: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  value={changePass.confirm}
                  onChange={(e) => setChangePass(f => ({ ...f, confirm: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  placeholder="Confirm new password"
                />
                {changePass.new && changePass.confirm && changePass.new !== changePass.confirm && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>
              <button
                type="submit"
                disabled={!changePass.current || !changePass.new || changePass.new !== changePass.confirm}
                className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
