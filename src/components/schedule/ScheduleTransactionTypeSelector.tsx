import React from 'react';
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { TransactionType } from '@/types';
import { usePreferences } from '@/contexts/PreferencesContext';
interface ScheduleTransactionTypeSelectorProps {
  form: UseFormReturn<any>;
  onTypeChange: (type: TransactionType) => void;
}
const ScheduleTransactionTypeSelector: React.FC<ScheduleTransactionTypeSelectorProps> = ({
  form,
  onTypeChange
}) => {
  const {
    t
  } = usePreferences();
  const selectedType = form.watch('type');
  const handleTypeSelect = (type: TransactionType) => {
    // Set the form value directly first
    form.setValue('type', type, {
      shouldValidate: true
    });

    // Then notify parent component of the change
    onTypeChange(type);
  };
  return <div className="flex gap-2 mb-4">
      
      
    </div>;
};
export default ScheduleTransactionTypeSelector;