import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Clock,
  CheckCircle2,
  MessageSquare,
  IndianRupee,
  Sparkles,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { PropertyReviewModal } from '../components/PropertyReviewModal';
import { apiFetch } from '../lib/api';
import { formatPriceINR } from '@real-estate/shared';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/admin/dashboard');
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (propertyId: string) => {
    await apiFetch(`/admin/properties/${propertyId}/approve`, { method: 'POST' });
    fetchDashboardData();
  };

  const handleReject = async (propertyId: string, reason: string) => {
    await apiFetch(`/admin/properties/${propertyId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    fetchDashboardData();
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-medium">Loading Dashboard metrics...</p>
        </div>
      </div>
    );
  }

  const { stats, cityDistribution, categoryDistribution, recentPending } = data;

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time platform overview, moderation queues, and performance metrics.
          </p>
        </div>
        {stats.pendingProperties > 0 && (
          <button
            onClick={() => navigate('/pending')}
            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-sm transition-all"
          >
            <Clock className="w-4 h-4 mr-1.5" />
            Review {stats.pendingProperties} Pending Properties
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Buyers, Owners, Agents & Builders"
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingProperties}
          subtitle="Awaiting admin approval"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Live Listings"
          value={stats.liveProperties}
          subtitle="Actively visible properties"
          icon={Building2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Total Leads"
          value={stats.totalLeads}
          subtitle="Enquiries from buyers"
          icon={MessageSquare}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      {/* Secondary Row: Revenue & Featured */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Revenue"
          value={formatPriceINR(stats.totalRevenue)}
          subtitle={`${stats.successfulTransactions} verified transactions`}
          icon={IndianRupee}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-100"
        />
        <StatCard
          title="Featured Properties"
          value={stats.featuredProperties}
          subtitle="Promoted on home carousel"
          icon={Sparkles}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
        />
        <StatCard
          title="Scheduled Site Visits"
          value={stats.totalSiteVisits}
          subtitle="Buyer property appointments"
          icon={Calendar}
          iconColor="text-sky-600"
          iconBg="bg-sky-50"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* City Breakdown Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Properties by City</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityDistribution}>
                <XAxis dataKey="city" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4">Properties by Category</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {categoryDistribution.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Pending Approvals Quick Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Properties Awaiting Review</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin decision required before listings appear live to buyers.
            </p>
          </div>
          <button
            onClick={() => navigate('/pending')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center"
          >
            View All Pending <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {recentPending.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">Pending Review Queue is Clean</p>
            <p className="text-xs text-slate-500 mt-0.5">All submitted properties have been processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Property</th>
                  <th className="px-5 py-3">Owner / Contact</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPending.map((prop: any) => (
                  <tr key={prop.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            prop.images?.[0]?.url ||
                            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200'
                          }
                          alt=""
                          className="w-12 h-10 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <p className="font-semibold text-slate-900 truncate">{prop.title}</p>
                          <p className="text-xs text-slate-500 truncate">
                            {prop.locality}, {prop.city}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-900 font-medium">{prop.owner?.name}</p>
                      <p className="text-xs text-slate-500">{prop.owner?.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {prop.category} • {prop.propertyType}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {formatPriceINR(prop.price)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={prop.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedProperty(prop)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-xs transition-colors"
                      >
                        Inspect & Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
