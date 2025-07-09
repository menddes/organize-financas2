
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionGuard from '@/components/subscription/SubscriptionGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import GoalCard from '@/components/common/GoalCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Goal } from '@/types';
import { formatCurrency } from '@/utils/transactionUtils';
import GoalForm from '@/components/common/GoalForm';

const GoalsPage = () => {
  const { goals, getGoals, recalculateGoalAmounts } = useAppContext();
  const { t, currency } = usePreferences();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedGoal(null);
  };

  const handleAddGoal = () => {
    setSelectedGoal(null);
    setIsFormOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsFormOpen(true);
    setIsDialogOpen(false);
  };

  // Modificar a função handleRefreshGoals
  const handleRefreshGoals = async () => {
    console.log("Iniciando atualização de metas...");
    // Primeiro, tentar recalcular os valores das metas
    const recalculated = await recalculateGoalAmounts();
    console.log("Recálculo de metas concluído:", recalculated);
    
    // Em seguida, buscar as metas atualizadas
    const updatedGoals = await getGoals();
    console.log("Metas atualizadas carregadas:", updatedGoals);
    return updatedGoals;
  };

  return (
    <MainLayout>
      <SubscriptionGuard>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-bold">{t('goals.yourGoals')}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefreshGoals}>
              <RefreshCw className="mr-2 h-4 w-4" /> {t('common.update')}
            </Button>
            <Button onClick={handleAddGoal}>
              <Plus className="mr-2 h-4 w-4" /> {t('goals.add')}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onClick={() => handleGoalClick(goal)} />
          ))}
        </div>
        
        {goals.length === 0 && (
          <Card className="p-8 text-center">
            <CardContent>
              <p className="mb-4 text-muted-foreground">{t('goals.noGoals')}</p>
              <Button onClick={handleAddGoal}>
                <Plus className="mr-2 h-4 w-4" /> {t('goals.createFirst')}
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Goal Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedGoal?.name}</DialogTitle>
            </DialogHeader>
            {selectedGoal && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('goals.progress')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between mb-2 text-sm">
                      <span>{t('goals.currentAmount')}: {formatCurrency(selectedGoal.currentAmount, currency)}</span>
                      <span>{t('goals.targetAmount')}: {formatCurrency(selectedGoal.targetAmount, currency)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-metacash-teal"
                        style={{
                          width: `${Math.min(
                            Math.round((selectedGoal.currentAmount / selectedGoal.targetAmount) * 100),
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm text-center">
                      {formatCurrency(selectedGoal.targetAmount - selectedGoal.currentAmount, currency)} {t('goals.remaining')}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{t('goals.relatedTransactions')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedGoal.transactions && selectedGoal.transactions.length > 0 ? (
                      <div className="space-y-2">
                        {selectedGoal.transactions.map((transaction) => (
                          <div key={transaction.id} className="flex justify-between p-2 bg-slate-50 rounded">
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              <div className="text-sm text-muted-foreground">{transaction.category}</div>
                            </div>
                            <div className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, currency)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">{t('goals.noTransactions')}</p>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeDialog}>{t('common.close')}</Button>
                  <Button onClick={() => handleEditGoal(selectedGoal)}>{t('common.edit')}</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Goal Form Dialog */}
        <GoalForm 
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          initialData={selectedGoal || undefined}
          mode={selectedGoal ? 'edit' : 'create'}
        />
      </SubscriptionGuard>
    </MainLayout>
  );
};

export default GoalsPage;
