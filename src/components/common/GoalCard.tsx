
import React from 'react';
import { Card } from '@/components/ui/card';
import { Goal } from '@/types';
import { formatCurrency } from '@/utils/transactionUtils';
import { Target } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onClick }) => {
  const { t, currency } = usePreferences();
  
  // Calculate progress percentage
  const progress = Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100);
  
  // Determine progress color
  const getProgressColor = () => {
    if (progress < 25) return 'bg-metacash-error';
    if (progress < 50) return 'bg-metacash-warning';
    if (progress < 75) return 'bg-metacash-blue';
    return 'bg-metacash-success';
  };
  
  return (
    <Card 
      className="p-5 transition-all hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{goal.name}</h3>
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: goal.color + '20' }}
        >
          <Target className="h-4 w-4" style={{ color: goal.color }} />
        </div>
      </div>
      
      <div className="mt-3 text-sm">
        <div className="flex justify-between items-baseline">
          <span className="font-medium">
            {formatCurrency(goal.currentAmount, currency)}
          </span>
          <span className="text-xs text-metacash-gray">
            {t('goals.toGo')} {formatCurrency(goal.targetAmount, currency)}
          </span>
        </div>
        
        <div className="mt-2 progress-bar">
          <div 
            className={`progress-bar-value ${getProgressColor()}`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="mt-1 flex justify-between text-xs">
          <span className="font-medium">{progress}% {t('goals.complete')}</span>
          <span className="text-metacash-gray">
            {formatCurrency(goal.targetAmount - goal.currentAmount, currency)} {t('goals.remaining')}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default GoalCard;
