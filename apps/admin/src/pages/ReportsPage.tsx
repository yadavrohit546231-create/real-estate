import React, { useState } from 'react';
import { Download, FileText, IndianRupee, Users, Building } from 'lucide-react';
import { API_BASE_URL } from '../lib/api';

export const ReportsPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadCSV = async (type: 'properties' | 'leads' | 'revenue') => {
    try {
      setDownloading(type);
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/reports/export?type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estate-${type}-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Export error');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Data Export Reports</h1>
        <p className="text-sm text-slate-500 mt-1">
          Export full relational database snapshots in standardized CSV formats for audit, accounting and compliance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Properties Report */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Properties Inventory Report</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Export all listings, status histories, owner contact details, price metrics, and geographic distributions.
            </p>
          </div>
          <button
            onClick={() => downloadCSV('properties')}
            disabled={downloading === 'properties'}
            className="mt-6 w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'properties' ? 'Generating CSV...' : 'Download Properties CSV'}</span>
          </button>
        </div>

        {/* Leads Report */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Lead Conversion Audit</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Comprehensive report of buyer enquiries, sources (WhatsApp, Call, Form), response times and conversion rates.
            </p>
          </div>
          <button
            onClick={() => downloadCSV('leads')}
            disabled={downloading === 'leads'}
            className="mt-6 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'leads' ? 'Generating CSV...' : 'Download Leads CSV'}</span>
          </button>
        </div>

        {/* Revenue & Payments Report */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <IndianRupee className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Revenue & Transactions Log</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Financial ledger of all featured listing upgrades, payments, gateway IDs, and subscription settlements.
            </p>
          </div>
          <button
            onClick={() => downloadCSV('revenue')}
            disabled={downloading === 'revenue'}
            className="mt-6 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{downloading === 'revenue' ? 'Generating CSV...' : 'Download Revenue CSV'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
