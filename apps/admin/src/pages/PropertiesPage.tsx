import React, { useEffect, useState } from 'react';
import { Search, Filter, Eye, Trash2, CheckCircle, Clock } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { PropertyReviewModal } from '../components/PropertyReviewModal';
import { apiFetch } from '../lib/api';
import { formatPriceINR, formatDate } from '@real-estate/shared';

export const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({ page: 1, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const fetchProperties = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(search && { search }),
      });

      const res = await apiFetch(`/admin/properties?${queryParams.toString()}`);
      setProperties(res.data?.data || []);
      setPagination(res.data?.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(1);
  }, [statusFilter, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProperties(1);
  };

  const handleApprove = async (id: string) => {
    await apiFetch(`/admin/properties/${id}/approve`, { method: 'POST' });
    fetchProperties(pagination.page);
  };

  const handleReject = async (id: string, reason: string) => {
    await apiFetch(`/admin/properties/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    fetchProperties(pagination.page);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Properties Directory</h1>
        <p className="text-sm text-slate-500 mt-1">
          Master registry of all listed, draft, pending, approved, and archived inventory.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search title, locality or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="LIVE">LIVE</option>
            <option value="PENDING_REVIEW">PENDING REVIEW</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="SOLD">SOLD</option>
            <option value="RENTED">RENTED</option>
            <option value="DRAFT">DRAFT</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="RESIDENTIAL">RESIDENTIAL</option>
            <option value="COMMERCIAL">COMMERCIAL</option>
            <option value="PG">PG</option>
          </select>
        </div>
      </div>

      {/* Properties Table */}
      {loading ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-slate-500">Loading properties...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Property</th>
                  <th className="px-5 py-3.5">Owner</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">City</th>
                  <th className="px-5 py-3.5">Price</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{prop.title}</p>
                      <span className="text-[11px] text-slate-400 font-mono">ID: {prop.id.slice(0, 8)}...</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700 font-medium">
                      {prop.owner?.name}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {prop.category}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-700">
                      {prop.city}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {formatPriceINR(prop.price)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={prop.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {formatDate(prop.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedProperty(prop)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchProperties(pagination.page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchProperties(pagination.page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
