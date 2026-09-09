import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'LIVE':
    case 'ACTIVE':
    case 'VERIFIED':
    case 'APPROVED':
    case 'SUCCESS':
    case 'CONFIRMED':
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'PENDING_REVIEW':
    case 'PENDING':
    case 'REQUESTED':
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      break;
    case 'REJECTED':
    case 'FAILED':
    case 'SUSPENDED':
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'SOLD':
    case 'RENTED':
      badgeClass = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'DRAFT':
    case 'PAUSED':
      badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};
