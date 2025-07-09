import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy, Eye, EyeOff, ArrowRight, Loader2, AlertTriangle, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/integrations/supabase/client';
import { useContactConfig } from '@/hooks/useContactConfig';
import { useAutoLogin } from '@/hooks/useAutoLogin';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  const [userExists, setUserExists] = useState(false);
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [systemStatus, setSystemStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  
  const { config: contactConfig, isLoading: configLoading } = useContactConfig();
  const { performAutoLogin, isLoggingIn } = useAutoLogin();
  
  const sessionId = searchParams.get('session_id');
  const email = searchParams.get('email') || 'user@example.com';
  
  const defaultPassword = import.meta.env.VITE_DEFAULT_PASSWORD;

  const checkSystemStatus = async () => {
    try {
      // Verificar se as funções estão respondendo
      const { error: syncError } = await supabase.functions.invoke('sync-subscriptions', {
        body: { test: true }
      });
      
      if (syncError && !syncError.message.includes('test')) {
        throw new Error('Função de sincronização não está respondendo');
      }
      
      setSystemStatus('ready');
      return true;
    } catch (error) {
      console.error('Erro ao verificar sistema:', error);
      setSystemStatus('error');
      return false;
    }
  };

  const checkUserCreation = async (attempt = 1) => {
    if (!email || email === 'user@example.com') {
      setIsCheckingUser(false);
      return;
    }
  
    try {
      // Chamar a função Edge usando a URL do cliente atual
      const response = await fetch(`${SUPABASE_URL}/functions/v1/check-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({ email, session_id: sessionId })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro ao verificar usuário:', errorText);
        throw new Error(errorText);
      }
      
      const data = await response.json();
      
      if (data.exists && data.hasSubscription) {
        console.log('Usuário e assinatura encontrados!', data);
        setUserExists(true);
        setIsCheckingUser(false);
        return;
      }
      
      // Se não encontrou o usuário ou assinatura e ainda temos tentativas
      if (attempt < 5) {
        setTimeout(() => {
          setCheckAttempts(attempt);
          checkUserCreation(attempt + 1);
        }, 2000 * attempt); // Aumenta o intervalo a cada tentativa
      } else {
        setIsCheckingUser(false);
        console.log('Usuário não foi encontrado após 5 tentativas');
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      if (attempt < 3) {
        setTimeout(() => checkUserCreation(attempt + 1), 3000);
      } else {
        setIsCheckingUser(false);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      // Primeiro verificar se o sistema está funcionando
      const systemOk = await checkSystemStatus();
      
      if (systemOk) {
        // Tentar sincronizar assinaturas automaticamente
        try {
          await supabase.functions.invoke('sync-subscriptions');
          console.log("Assinaturas sincronizadas automaticamente");
        } catch (error) {
          console.error("Erro ao sincronizar assinaturas:", error);
        }
        
        // Esperar alguns segundos para o webhook processar, depois verificar
        setTimeout(() => {
          checkUserCreation();
        }, 3000);
      } else {
        setIsCheckingUser(false);
      }
    };

    init();
  }, [email]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleSyncSubscriptions = async () => {
    try {
      setIsCheckingUser(true);
      
      const { data, error } = await supabase.functions.invoke('sync-subscriptions');
      
      if (error) {
        toast({
          title: "Erro na sincronização",
          description: "Não foi possível sincronizar as assinaturas. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sincronização concluída",
        description: `${data.createdUsersCount || 0} usuários criados, ${data.syncedCount || 0} assinaturas sincronizadas.`,
      });

      // Verificar novamente se o usuário foi criado
      setTimeout(() => {
        checkUserCreation();
      }, 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
      setIsCheckingUser(false);
    }
  };

  const renderSystemStatus = () => {
    if (systemStatus === 'error') {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <h4 className="font-medium">Sistema Temporariamente Indisponível</h4>
          </div>
          <p className="text-sm text-red-700 mb-3">
            O sistema de criação automática de usuários está com problemas. 
            Seu pagamento foi processado com sucesso, mas a conta pode precisar ser criada manualmente.
          </p>
          <Button 
            onClick={() => window.open('https://wa.me/5534998773972?text=Preciso%20de%20ajuda%20com%20minha%20conta%20após%20pagamento', '_blank')}
            className="w-full"
            variant="outline"
          >
            Entrar em Contato para Suporte
          </Button>
        </div>
      );
    }
    return null;
  };

  const handleWhatsAppActivation = () => {
    if (configLoading) {
      toast({
        title: "Carregando configurações...",
        description: "Aguarde um momento.",
      });
      return;
    }

    const userEmail = email !== 'user@example.com' ? email : '';
    const planType = 'mensal'; // Pode ser dinâmico baseado nos dados da sessão
    
    const customMessage = `Olá! Acabei de confirmar meu pagamento do PoupeJá! 🎉\n` +
      `Meu email é: ${userEmail}\n` +
      `Plano: ${planType}\n` +
      `Por favor, ative minha conta. Obrigado!`;
    
    const message = encodeURIComponent(customMessage);
    const whatsappUrl = `https://wa.me/${contactConfig.contactPhone}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleAccessApp = () => {
    if (email && email !== 'user@example.com') {
      performAutoLogin(email);
    } else {
      navigate('/login');
    }
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <CardTitle className="text-2xl text-green-700 mb-2">
              Pagamento Confirmado!
            </CardTitle>
            <p className="text-muted-foreground">
              Sua assinatura foi ativada com sucesso.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Próximos passos:</h4>
              <p className="text-sm text-blue-800">
                Agora você pode ativar seu número no WhatsApp ou acessar diretamente sua área do usuário.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-3">
              <Button 
                onClick={handleWhatsAppActivation}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
                disabled={configLoading}
              >
                {configLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 w-4 h-4" />
                    Ativar Meu Número via WhatsApp
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleAccessApp}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Fazendo login...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 w-4 h-4" />
                    Acessar o App
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleGoToHome}
                className="w-full"
              >
                Voltar ao Início
              </Button>
            </div>

            {/* Informações Adicionais */}
            <div className="text-center text-xs text-muted-foreground pt-4 border-t">
              <p className="mt-1">
                Precisa de ajuda? Entre em contato com nosso suporte.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
