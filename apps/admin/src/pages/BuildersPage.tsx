import React, { useEffect, useState } from 'react';
import { HardHat } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { apiFetch } from '../lib/api';

export const BuildersPage: React.FC = () => {
  const [builders, setBuilders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuilders = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/users?role=BUILDER');
      setBuilders(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilders();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Builder & Developer Accounts</h1>
        <p className="text-sm text-slate-500 mt-1">
          Registered property developers constructing integrated townships, towers, and commercial complexes.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-slate-500">Loading builder developers...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Developer Company</th>
                <th className="px-5 py-3.5">Official Contact</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5">Total Listings</th>
                <th className="px-5 py-3.5 text-right">Accreditation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {builders.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900">{b.name}</p>
                    <p className="text-xs text-slate-500 font-mono">ID: {b.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-700">
                    <p className="font-medium">{b.email}</p>
                    <p className="text-slate-500">{b.phone}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {b._count?.propertiesOwned || 0} Project Units
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      RERA Registered
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
