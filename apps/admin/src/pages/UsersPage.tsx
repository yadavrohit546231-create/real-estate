import React, { useEffect, useState } from 'react';
import { Search, UserCheck, UserX, Shield } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { apiFetch } from '../lib/api';
import { formatDate } from '@real-estate/shared';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        ...(roleFilter && { role: roleFilter }),
        ...(search && { search }),
      });
      const res = await apiFetch(`/admin/users?${query.toString()}`);
      setUsers(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleToggleStatus = async (userId: string) => {
    try {
      await apiFetch(`/admin/users/${userId}/toggle-status`, { method: 'PATCH' });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management & RBAC</h1>
        <p className="text-sm text-slate-500 mt-1">
          Inspect registered accounts across Buyers, Owners, Agents, Builders and Admins.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none w-full md:w-auto"
        >
          <option value="">All Roles</option>
          <option value="BUYER">BUYER</option>
          <option value="OWNER">OWNER</option>
          <option value="AGENT">AGENT</option>
          <option value="BUILDER">BUILDER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPER_ADMIN">SUPER ADMIN</option>
        </select>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-slate-500">Loading user accounts...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Activity</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email} • {u.phone}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={u.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {u._count?.propertiesOwned || 0} Listings • {u._count?.leadsReceived || 0} Leads
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {u.role !== 'SUPER_ADMIN' ? (
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Protected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
