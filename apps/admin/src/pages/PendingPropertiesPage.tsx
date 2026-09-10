import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, Search, Filter, Sparkles } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { PropertyReviewModal } from '../components/PropertyReviewModal';
import { apiFetch } from '../lib/api';
import { formatPriceINR, formatDate } from '@real-estate/shared';

export const PendingPropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [search, setSearch] = useState('');

  const fetchPendingProperties = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/properties/pending');
      setProperties(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load pending properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProperties();
  }, []);

  const handleApprove = async (id: string, makeFeatured?: boolean) => {
    await apiFetch(`/admin/properties/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ makeFeatured }),
    });
    fetchPendingProperties();
  };

  const handleReject = async (id: string, reason: string) => {
    await apiFetch(`/admin/properties/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    fetchPendingProperties();
  };

  const filteredProperties = properties.filter((p) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(s) ||
      p.city.toLowerCase().includes(s) ||
      p.owner?.name?.toLowerCase().includes(s) ||
      p.id.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900">Pending Property Approvals</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {properties.length} Required
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Carefully verify ownership details, photos, and descriptions before publishing listings LIVE.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title, owner or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content Table / Cards */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-slate-500">Fetching pending submissions...</p>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No properties awaiting approval</h3>
          <p className="text-sm text-slate-500 mt-1">
            Any newly posted property by an Owner or Agent will appear here for review.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Listing Details</th>
                  <th className="px-5 py-3.5">Owner / Contact</th>
                  <th className="px-5 py-3.5">Category & Specs</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Submitted</th>
                  <th className="px-5 py-3.5 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProperties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-start space-x-3">
                        <img
                          src={
                            prop.images?.[0]?.url ||
                            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'
                          }
                          alt=""
                          className="w-16 h-14 rounded-lg object-cover bg-slate-100 flex-shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0 max-w-sm">
                          <p className="font-bold text-slate-900 line-clamp-1">{prop.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {prop.locality}, {prop.city}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[11px] text-slate-400 font-mono">ID: {prop.id.slice(0, 8)}...</span>
                            {prop.featuredRequested && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-600" />
                                Featured Req.
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{prop.owner?.name}</p>
                      <p className="text-xs text-slate-500">{prop.owner?.phone}</p>
                      <p className="text-xs text-slate-400">{prop.owner?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-700">
                      <p className="font-semibold">{prop.category} • {prop.propertyType}</p>
                      <p className="text-slate-500 mt-0.5">{prop.area} {prop.areaUnit} • {prop.bedrooms ? `${prop.bedrooms} BHK` : 'N/A'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-900 text-base">{formatPriceINR(prop.price)}</span>
                      {prop.listingType === 'RENT' && <span className="text-xs text-slate-500"> /mo</span>}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {formatDate(prop.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedProperty(prop)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-sm transition-all inline-flex items-center"
                      >
                        Inspect & Decide
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedProperty && (
        <PropertyReviewModal
          property={selectedProperty}
          isOpen={!!selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};
