
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScheduledTransaction } from '@/types';
import { usePreferences } from '@/contexts/PreferencesContext';

interface TransactionStatusBadgeProps {
  transaction: ScheduledTransaction;
}

const TransactionStatusBadge: React.FC<TransactionStatusBadgeProps> = ({ transaction }) => {
  const { t } = usePreferences();

  const getStatusInfo = () => {
    // Se já foi pago
    if (transaction.status === 'paid') {
      return {
        variant: 'default' as const,
        text: t('schedule.paid'),
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }

    const today = new Date();
    const transactionDate = new Date(transaction.nextExecutionDate || transaction.scheduledDate);
    const daysUntilDue = Math.ceil((transactionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Se está vencido
    if (daysUntilDue < 0) {
      return {
        variant: 'destructive' as const,
        text: t('schedule.overdue'),
        className: 'bg-red-100 text-red-800 border-red-200'
      };
    }

    // Se vence hoje
    if (daysUntilDue === 0) {
      return {
        variant: 'destructive' as const,
        text: t('schedule.dueToday'),
        className: 'bg-orange-100 text-orange-800 border-orange-200'
      };
    }

    // Se vence nos próximos 3 dias
    if (daysUntilDue <= 3) {
      return {
        variant: 'default' as const,
        text: t('schedule.duesSoon'),
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    }

    // Pendente normal
    return {
      variant: 'secondary' as const,
      text: t('schedule.pending'),
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Badge 
      variant={statusInfo.variant}
      className={`text-xs ${statusInfo.className}`}
    >
      {statusInfo.text}
    </Badge>
  );
};

export default TransactionStatusBadge;
