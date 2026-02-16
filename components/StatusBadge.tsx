
import React from 'react';
import { ValidityRecord } from '../types.ts';

interface StatusBadgeProps {
  status: ValidityRecord['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'expired':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
          Expirado
        </span>
      );
    case 'expiring_soon':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100">
          Próximo
        </span>
      );
    case 'valid':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
          Válido
        </span>
      );
    default:
      return null;
  }
};

export default StatusBadge;
