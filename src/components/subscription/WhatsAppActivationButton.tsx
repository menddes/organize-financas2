import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WhatsAppActivationButtonProps {
  phone?: string;
  planType?: string;
  email?: string;
}

const WhatsAppActivationButton: React.FC<WhatsAppActivationButtonProps> = ({
  phone = import.meta.env.VITE_CONTACT_PHONE,
  planType = 'mensal',
  email = '',
}) => {
  const navigate = useNavigate();

  const handleActivation = () => {
    const message = encodeURIComponent(
      `Olá! Acabei de assinar o plano ${planType} do PoupeJá! 🎉\n` +
      `Meu email é: ${email}\n` +
      `Por favor, ative minha conta. Obrigado!`
    );
    
    // Open WhatsApp in a new tab
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    
    // Redirect to thank-you page after a short delay
    setTimeout(() => {
      navigate('/thank-you');
    }, 500);
  };

  return (
    <Button 
      onClick={handleActivation}
      className="w-full bg-green-600 hover:bg-green-700 text-white"
      size="lg"
    >
      <MessageSquare className="mr-2 h-5 w-5" />
      Ativar Minha Conta no WhatsApp
    </Button>
  );
};

export default WhatsAppActivationButton;