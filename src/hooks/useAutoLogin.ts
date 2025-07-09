
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '@/services/authService';
import { useToast } from '@/components/ui/use-toast';

export const useAutoLogin = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const performAutoLogin = async (email: string) => {
    if (!email || email === 'user@example.com') {
      toast({
        title: "Email não encontrado",
        description: "Não foi possível fazer login automático. Faça login manualmente.",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    setIsLoggingIn(true);
    
    try {
      // Usar a senha padrão do ambiente
      const defaultPassword = import.meta.env.VITE_DEFAULT_PASSWORD || 'poupeja123';
      
      const data = await loginUser(email, defaultPassword);
      
      if (data.user) {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para sua área...",
        });
        
        // Redirecionar para o dashboard após login bem-sucedido
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (error: any) {
      console.error('Erro no login automático:', error);
      toast({
        title: "Erro no login automático",
        description: "Redirecionando para a página de login...",
        variant: "destructive",
      });
      
      // Redirecionar para login manual se falhar
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return { performAutoLogin, isLoggingIn };
};
