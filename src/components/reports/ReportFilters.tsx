import React, { useState } from 'react';
import jsPDF from 'jspdf'; // <-- IMPORTANTE: precisa estar instalado!
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, File } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { ReportFormat } from '@/types';
import { usePreferences } from '@/contexts/PreferencesContext';

interface ReportFiltersProps {
  reportType: string;
  setReportType: (type: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
  onDownload?: (format: ReportFormat) => void; // Deixe como opcional para usarmos a função local
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  reportType,
  setReportType,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onDownload
}) => {
  const { t } = usePreferences();

  // Função para download do PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Adapte esses dados conforme o relatório real!
    doc.setFontSize(16);
    doc.text('Relatório Financeiro', 15, 15);
    doc.setFontSize(12);
    doc.text(`Tipo: ${reportType}`, 15, 30);
    doc.text(`Período: ${startDate ? startDate.toLocaleDateString() : ''} até ${endDate ? endDate.toLocaleDateString() : ''}`, 15, 40);
    doc.text('---', 15, 50);
    doc.text('Aqui você pode adicionar dados da tabela/relatório!', 15, 60);

    doc.save('relatorio.pdf');
  };

  // Função para download CSV pode continuar usando o onDownload('csv')
  const handleDownloadCSV = () => {
    if (onDownload) onDownload('csv');
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('reports.filters')}</CardTitle>
        <CardDescription>{t('reports.filtersDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">{t('reports.reportType')}</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder={t('reports.selectReportType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('reports.allTransactions')}</SelectItem>
                <SelectItem value="income">{t('reports.incomeOnly')}</SelectItem>
                <SelectItem value="expenses">{t('reports.expensesOnly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">{t('reports.startDate')}</label>
            <DatePicker date={startDate} setDate={setStartDate} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">{t('reports.endDate')}</label>
            <DatePicker date={endDate} setDate={setEndDate} />
          </div>
        </div>
        
        <div className="flex flex-wrap justify-end gap-2 mt-4">
          <Button 
            variant="outline" 
            onClick={handleDownloadCSV}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {t('reports.downloadCSV')}
          </Button>
          <Button 
            onClick={handleDownloadPDF}
            className="flex items-center gap-2"
          >
            <File className="h-4 w-4" />
            {t('reports.downloadPDF')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFilters;
