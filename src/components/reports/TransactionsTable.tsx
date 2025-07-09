
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Transaction } from '@/types';
import { usePreferences } from '@/contexts/PreferencesContext';

interface TransactionsTableProps {
  transactions: Transaction[];
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({ transactions }) => {
  const { t, currency } = usePreferences();
  
  // Format currency based on currency preference
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: currency 
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reports.transactionsList')}</CardTitle>
        <CardDescription>{t('reports.transactionsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">{t('common.date')}</th>
                <th className="text-left py-2 px-4">{t('common.type')}</th>
                <th className="text-left py-2 px-4">{t('common.category')}</th>
                <th className="text-left py-2 px-4">{t('common.description')}</th>
                <th className="text-right py-2 px-4">{t('common.amount')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-muted">
                    <td className="py-2 px-4">{new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 px-4">
                      {transaction.type === 'income' ? t('common.income') : t('common.expense')}
                    </td>
                    <td className="py-2 px-4">{transaction.category}</td>
                    <td className="py-2 px-4">{transaction.description}</td>
                    <td className={`py-2 px-4 text-right ${
                      transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    {t('reports.noTransactions')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionsTable;
