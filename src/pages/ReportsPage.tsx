
import React, { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAppContext } from '@/contexts/AppContext';
import { ReportFormat } from '@/types';
import { calculateTotalIncome, calculateTotalExpenses } from '@/utils/transactionUtils';
import { generateReportData, downloadCSV, downloadPDF } from '@/utils/reportUtils';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportSummary from '@/components/reports/ReportSummary';
import TransactionsTable from '@/components/reports/TransactionsTable';

const ReportsPage = () => {
  const { t } = usePreferences();
  const { transactions } = useAppContext();
  const [reportType, setReportType] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() - 30))
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const handleDownload = (format: ReportFormat) => {
    // Generate the report data
    const reportData = generateReportData(transactions, reportType, startDate, endDate);
    
    if (format === 'csv') {
      downloadCSV(reportData);
    } else if (format === 'pdf') {
      downloadPDF(reportData);
    }
  };
  
  // Generate filtered transactions for display
  const filteredTransactions = generateReportData(transactions, reportType, startDate, endDate);
  
  // Calculate summary statistics
  const totalIncome = calculateTotalIncome(filteredTransactions);
  const totalExpenses = calculateTotalExpenses(filteredTransactions);
  const balance = totalIncome - totalExpenses;

  return (
    <MainLayout>
      <SubscriptionGuard feature="relatórios detalhados">
        <div className="w-full px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">{t('reports.title')}</h1>
          
          <ReportFilters 
            reportType={reportType}
            setReportType={setReportType}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            onDownload={handleDownload}
          />
          
          <ReportSummary 
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            balance={balance}
          />
          
          <TransactionsTable transactions={filteredTransactions} />
        </div>
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default ReportsPage;
