
import React from 'react';
import { ValidityRecord } from '../types';

interface StatusBadgeProps {
  // Use ValidityRecord['status'] since Product type does not exist
  status: ValidityRecord['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'expired':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Expirado
        </span>
      );
    case 'expiring_soon':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          Próximo
        </span>
      );
    case 'valid':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          Válido
        </span>
      );
    default:
      return null;
  }
};

export default StatusBadge;
