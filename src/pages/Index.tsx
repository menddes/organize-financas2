import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import TransactionForm from '@/components/common/TransactionForm';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardStatCards from '@/components/dashboard/DashboardStatCards';
import DashboardContent from '@/components/dashboard/DashboardContent';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { formatCurrency, calculateTotalIncome, calculateTotalExpenses } from '@/utils/transactionUtils';
import { useToast } from '@/components/ui/use-toast';
import { markAsPaid } from '@/services/scheduledTransactionService';
import { ScheduledTransaction } from '@/types';
import { motion } from 'framer-motion';

// (Você pode apagar as funções de cumprimento se quiser, mas não é obrigatório)
// function getGreeting() { ... }
// function getFirstName(name) { ... }

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    user,
    filteredTransactions,
    transactions,
    setCustomDateRange,
    goals,
    hideValues,
    toggleHideValues,
    getTransactions,
    getGoals,
    deleteTransaction,
    scheduledTransactions
  } = useAppContext();
  const { t } = usePreferences();
  
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentGoalIndex, setCurrentGoalIndex] = useState(0);
  
  // const totalIncome = calculateTotalIncome(filteredTransactions);
  // const totalExpenses = calculateTotalExpenses(filteredTransactions);
  // const balance = totalIncome - totalExpenses;

  const totalIncome = calculateTotalIncome(filteredTransactions);
  const totalExpenses = calculateTotalExpenses(filteredTransactions);
  const balance = totalIncome - totalExpenses;
  
  useEffect(() => {
    const loadData = async () => {
      await getTransactions();
      await getGoals();
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);
      setCustomDateRange(firstDay, lastDay);
    };
    loadData();
  }, [currentMonth]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await Promise.all([
          getTransactions(),
          getGoals()
        ]);
      } catch (error) {
        // error handling
      }
    }, 30000); // Refresh every 30 seconds

    return () => {
      clearInterval(interval);
    };
  }, [getTransactions, getGoals]);
  
  const handleMonthChange = (date: Date) => {
    setCurrentMonth(date);
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    setCustomDateRange(firstDay, lastDay);
  };
  
  const handleAddTransaction = (type: 'income' | 'expense' = 'expense') => {
    setSelectedTransaction(null);
    setFormMode('create');
    setTransactionType(type);
    setTransactionDialogOpen(true);
  };
  
  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setFormMode('edit');
    setTransactionDialogOpen(true);
  };
  
  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast({
        title: t('transactions.deleted'),
        description: t('transactions.deleteSuccess'),
      });
      await Promise.all([
        getTransactions(),
        getGoals()
      ]);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('transactions.deleteError'),
        variant: 'destructive',
      });
    }
  };

  const handleMarkScheduledAsPaid = async (transaction: ScheduledTransaction) => {
    const success = await markAsPaid(transaction.id);
    if (success) {
      toast({
        title: t('schedule.marked_as_paid'),
        description: t('schedule.transaction_marked_as_paid')
      });
      await Promise.all([
        getTransactions(),
        getGoals()
      ]);
    } else {
      toast({
        title: t('common.error'),
        description: t('common.somethingWentWrong'),
        variant: "destructive"
      });
    }
  };
  
  const navigateToTransactionType = (type: 'income' | 'expense') => {
    navigate(`/transactions?type=${type}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    }
  };
  
  return (
    <MainLayout title={t('dashboard.title')} onAddTransaction={handleAddTransaction}>
      <SubscriptionGuard feature="o dashboard completo">
        <motion.div 
          className="space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header com navegação de mês e toggle de visibilidade */}
          <DashboardHeader
            currentMonth={currentMonth}
            onMonthChange={handleMonthChange}
            hideValues={hideValues}
            toggleHideValues={toggleHideValues}
            onAddTransaction={handleAddTransaction}
          />
          
          {/* 3 Cards principais na mesma linha */}
          <motion.div variants={itemVariants}>
            <DashboardStatCards
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
              balance={balance}
              hideValues={hideValues}
              onNavigateToTransactionType={navigateToTransactionType}
            />
          </motion.div>

          {/* Conteúdo do dashboard */}
          <DashboardContent
            filteredTransactions={filteredTransactions}
            goals={goals}
            scheduledTransactions={scheduledTransactions}
            currentGoalIndex={currentGoalIndex}
            currentMonth={currentMonth}
            hideValues={hideValues}
            onGoalChange={setCurrentGoalIndex}
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onMarkScheduledAsPaid={handleMarkScheduledAsPaid}
          />
        </motion.div>
      </SubscriptionGuard>

      {/* Dialog do formulário de transação */}
      <TransactionForm 
        open={transactionDialogOpen} 
        onOpenChange={setTransactionDialogOpen} 
        initialData={selectedTransaction} 
        mode={formMode} 
        defaultType={transactionType} 
      />
    </MainLayout>
  );
};

export default Index;
