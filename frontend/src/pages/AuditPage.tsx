import { useState, useEffect } from 'react';
import { api, AuditLog } from '../api/client';
import { Layout } from '../components/Layout';
import { SkeletonTable } from '../components/Skeleton';
import { 
  History, 
  User, 
  Package, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  ArrowDownToLine,
  CheckCircle,
  XCircle,
  LogIn
} from 'lucide-react';

const actionIcons: Record<string, React.ElementType> = {
  CREATE: Plus,
  UPDATE: Pencil,
  DELETE: Trash2,
  RECEIVE: ArrowDownToLine,
  APPROVE: CheckCircle,
  CANCEL: XCircle,
  LOGIN: LogIn,
};

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-400',
  UPDATE: 'bg-blue-500/10 text-blue-400',
  DELETE: 'bg-red-500/10 text-red-400',
  RECEIVE: 'bg-amber-500/10 text-amber-400',
  FULFILL: 'bg-purple-500/10 text-purple-400',
  RETURN: 'bg-cyan-500/10 text-cyan-400',
  CORRECTION: 'bg-orange-500/10 text-orange-400',
  APPROVE: 'bg-green-500/10 text-green-400',
  CANCEL: 'bg-red-500/10 text-red-400',
  LOGIN: 'bg-slate-500/10 text-slate-400',
};

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [page, entityTypeFilter, actionFilter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await api.getAuditLogs({
        entityType: entityTypeFilter || undefined,
        action: actionFilter || undefined,
        page,
        limit: 30,
      });
      setLogs(result.logs);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const inputCls = "px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 transition-colors";

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <History className="w-8 h-8 text-amber-400" />
              Audit Log
            </h1>
            <p className="text-sm text-slate-500 mt-2">Track all system activity and changes</p>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <select 
            className={inputCls}
            value={entityTypeFilter}
            onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Entity Types</option>
            <option value="Part">Parts</option>
            <option value="User">Users</option>
            <option value="Request">Requests</option>
            <option value="Location">Locations</option>
          </select>
          <select 
            className={inputCls}
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="RECEIVE">Receive</option>
            <option value="FULFILL">Fulfill</option>
            <option value="LOGIN">Login</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable rows={10} cols={5} />
        ) : logs.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-400">No audit logs found</h3>
            <p className="text-sm text-slate-600 mt-1">Activity will appear here as actions are performed</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Entity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {logs.map((log) => {
                  const ActionIcon = actionIcons[log.action] || FileText;
                  const colorClass = actionColors[log.action] || 'bg-slate-500/10 text-slate-400';
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${colorClass}`}>
                          <ActionIcon className="w-3.5 h-3.5" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-sm text-white">{log.entityType}</p>
                            {log.entityName && (
                              <p className="text-xs text-slate-500 truncate max-w-[200px]">{log.entityName}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-white">{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.details && (
                          <code className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                            {JSON.stringify(log.details).slice(0, 50)}...
                          </code>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
                <p className="text-xs text-slate-500">
                  Page {page} of {totalPages} · {total.toLocaleString()} entries
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 hover:border-slate-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AuditPage;
