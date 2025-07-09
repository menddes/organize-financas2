
import { Transaction, ReportFormat } from '@/types';
import { toast } from '@/components/ui/use-toast';
import { usePreferences } from '@/contexts/PreferencesContext';

export const generateReportData = (
  transactions: Transaction[],
  reportType: string,
  startDate: Date | undefined,
  endDate: Date | undefined
): Transaction[] => {
  // Filter transactions by date range
  let filteredTransactions = transactions;
  
  if (startDate && endDate) {
    filteredTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }
  
  // Further filter by report type
  if (reportType === 'income') {
    filteredTransactions = filteredTransactions.filter(t => t.type === 'income');
  } else if (reportType === 'expenses') {
    filteredTransactions = filteredTransactions.filter(t => t.type === 'expense');
  }
  
  return filteredTransactions;
};

export const downloadCSV = (data: Transaction[]): void => {
  // Create CSV content
  const headers = ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor'];
  const csvContent = [
    headers.join(','),
    ...data.map(item => [
      new Date(item.date).toLocaleDateString(),
      item.type,
      item.category,
      `"${item.description.replace(/"/g, '""')}"`, // Escape quotes
      item.amount
    ].join(','))
  ].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `poupeja-relatorio-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Show success notification
  toast({
    title: "Relatório Baixado",
    description: "O relatório CSV foi baixado com sucesso.",
  });
};

export const downloadPDF = (data: Transaction[]): void => {
  // In a real application, we would generate a PDF
  // For this demo, we'll just show an alert
  alert('A funcionalidade de PDF seria integrada com uma biblioteca de geração de PDF como jsPDF ou pdfmake');
  
  // Mock downloading a PDF
  console.log('Gerando PDF com dados:', data);
  
  // Show success notification
  toast({
    title: "Geração de PDF",
    description: "Em um aplicativo real, isto baixaria um relatório em PDF.",
  });
};
