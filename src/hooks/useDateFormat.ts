
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePreferences } from '@/contexts/PreferencesContext';

export const useDateFormat = () => {
  const { language } = usePreferences();

  const formatDate = (date: Date | string, formatString: string = 'dd/MM/yyyy') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (language === 'pt') {
      return format(dateObj, formatString, { locale: ptBR });
    }
    
    return format(dateObj, formatString);
  };

  const formatMonth = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (language === 'pt') {
      return format(dateObj, 'MMMM yyyy', { locale: ptBR });
    }
    
    return format(dateObj, 'MMMM yyyy');
  };

  const formatShortDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (language === 'pt') {
      return format(dateObj, "d 'de' MMM", { locale: ptBR });
    }
    
    return format(dateObj, 'MMM d');
  };

  return {
    formatDate,
    formatMonth,
    formatShortDate
  };
};
