import React, { useEffect, useState } from 'react';
import { MessageSquare, Phone, Mail } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { apiFetch } from '../lib/api';
import { formatDate } from '@real-estate/shared';

export const LeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const res = await apiFetch('/leads');
        setLeads(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeads();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marketplace Enquiries & Leads</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor incoming buyer enquiries across phone calls, WhatsApp messages, and schedule requests.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-slate-500">Loading buyer enquiries...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Property Enquired</th>
                <th className="px-5 py-3.5">Buyer Details</th>
                <th className="px-5 py-3.5">Channel / Source</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Enquiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="font-semibold text-slate-900 truncate">{lead.property?.title || 'Property'}</p>
                    <p className="text-xs text-slate-500">{lead.property?.locality}, {lead.property?.city}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{lead.name}</p>
                      {lead.buyer?.role && (
                        <span
                          className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase border ${
                            lead.buyer.role === 'AGENT'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : lead.buyer.role === 'BUILDER'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : lead.buyer.role === 'OWNER'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {lead.buyer.role === 'AGENT'
                            ? 'Agent'
                            : lead.buyer.role === 'BUILDER'
                            ? 'Builder'
                            : lead.buyer.role === 'OWNER'
                            ? 'Owner'
                            : 'Buyer'}
                        </span>
                      )}
                      {lead.buyer?.status && (
                        <span className="text-[10px] text-slate-400">
                          ({lead.buyer.status.toLowerCase()})
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 mt-0.5">{lead.phone} • {lead.email}</p>
                    {lead.message && (
                      <p className="text-slate-600 italic mt-1 bg-slate-50 p-1.5 rounded">"{lead.message}"</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-semibold text-blue-700">
                    {lead.source}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">
                    {formatDate(lead.createdAt)}
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
