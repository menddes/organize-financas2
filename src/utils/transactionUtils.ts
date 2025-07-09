import { Transaction, TimeRange } from '../types';

// Get today's date at midnight
const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// Get yesterday's date at midnight
const getYesterdayStart = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
};

// Get date X days ago at midnight
const getDaysAgoStart = (days: number) => {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - days);
  daysAgo.setHours(0, 0, 0, 0);
  return daysAgo;
};

// Filter transactions by time range
export const filterTransactionsByTimeRange = (
  transactions: Transaction[],
  timeRange: TimeRange,
  customStartDate?: Date,
  customEndDate?: Date
): Transaction[] => {
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const now = new Date();
  now.setHours(23, 59, 59, 999); // End of today

  switch (timeRange) {
    case 'today':
      const todayStart = getTodayStart();
      return sortedTransactions.filter(
        (t) => new Date(t.date) >= todayStart && new Date(t.date) <= now
      );

    case 'yesterday':
      const yesterdayStart = getYesterdayStart();
      const yesterdayEnd = new Date(yesterdayStart);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return sortedTransactions.filter(
        (t) => new Date(t.date) >= yesterdayStart && new Date(t.date) <= yesterdayEnd
      );

    case '7days':
      const sevenDaysAgo = getDaysAgoStart(7);
      return sortedTransactions.filter(
        (t) => new Date(t.date) >= sevenDaysAgo && new Date(t.date) <= now
      );

    case '14days':
      const fourteenDaysAgo = getDaysAgoStart(14);
      return sortedTransactions.filter(
        (t) => new Date(t.date) >= fourteenDaysAgo && new Date(t.date) <= now
      );

    case '30days':
      const thirtyDaysAgo = getDaysAgoStart(30);
      return sortedTransactions.filter(
        (t) => new Date(t.date) >= thirtyDaysAgo && new Date(t.date) <= now
      );

    case 'custom':
      if (!customStartDate || !customEndDate) {
        return sortedTransactions;
      }
      const startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      return sortedTransactions.filter(
        (t) => new Date(t.date) >= startDate && new Date(t.date) <= endDate
      );

    default:
      return sortedTransactions;
  }
};

// Calculate total income
export const calculateTotalIncome = (transactions: Transaction[]): number => {
  return transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
};

// Calculate total expenses
export const calculateTotalExpenses = (transactions: Transaction[]): number => {
  return transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
};

// Format currency based on the selected currency type
export const formatCurrency = (amount: number, currency = 'BRL'): string => {
  const currencyOptions: { [key: string]: { locale: string, currency: string } } = {
    USD: { locale: 'pt-BR', currency: 'USD' },
    BRL: { locale: 'pt-BR', currency: 'BRL' }
  };

  const options = currencyOptions[currency] || currencyOptions.BRL;
  
  return new Intl.NumberFormat(options.locale, {
    style: 'currency',
    currency: options.currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

// Format date to readable string - fixed to pt-BR
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format time to readable string - fixed to pt-BR
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Format date to YYYY-MM-DD (for input[type="date"])
export const formatDateForInput = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Function to calculate category summaries
export const calculateCategorySummaries = (
  transactions: Transaction[],
  type: 'income' | 'expense'
) => {
  const filteredTransactions = transactions.filter((t) => t.type === type);
  const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Group by category
  const categories = filteredTransactions.reduce((acc, t) => {
    if (!acc[t.category]) {
      acc[t.category] = 0;
    }
    acc[t.category] += t.amount;
    return acc;
  }, {} as Record<string, number>);
  
  // Generate random colors for categories
  const colors = [
    '#4ECDC4', '#FF6B6B', '#2C6E7F', '#FBBF24', '#8B5CF6', 
    '#EC4899', '#10B981', '#94A3B8', '#F43F5E', '#F59E0B'
  ];
  
  // Create summaries
  return Object.entries(categories).map(([category, amount], index) => ({
    category,
    amount,
    percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
    color: colors[index % colors.length],
  }));
};
