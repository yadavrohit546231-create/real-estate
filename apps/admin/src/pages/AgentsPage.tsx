import React, { useEffect, useState } from 'react';
import { Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { apiFetch } from '../lib/api';

export const AgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/users?role=AGENT');
      setAgents(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agent Verification Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review real estate brokers, regulatory licenses (RERA), and agency accreditation.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-slate-500">Loading agent credentials...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Agent Details</th>
                <th className="px-5 py-3.5">Agency / Contact</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5">Portfolio</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-900">{agent.name}</p>
                    <p className="text-xs text-slate-500 font-mono">ID: {agent.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-700">
                    <p className="font-medium">{agent.email}</p>
                    <p className="text-slate-500">{agent.phone}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={agent.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">
                    {agent._count?.propertiesOwned || 0} Managed Listings
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      Verified Broker
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
