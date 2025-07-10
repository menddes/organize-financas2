import React from 'react';
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
  onDownload: (format: ReportFormat) => void;
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
            onClick={() => onDownload('csv')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {t('reports.downloadCSV')}
          </Button>
          <Button 
            onClick={() => onDownload('pdf')}
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
