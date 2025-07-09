
import { useEffect, useState } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/client';
import { AlertTriangle, Settings, Database, Github, Globe, Server } from 'lucide-react';

interface SupabaseInitializerProps {
  children: React.ReactNode;
}

export const SupabaseInitializer: React.FC<SupabaseInitializerProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isError, setIsError] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        // Verificar se temos URL e chave válidas
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          console.error('SupabaseInitializer: Supabase URL or key is missing');
          setConnectionError('missing_config');
          setIsError(true);
          setIsInitialized(true);
          return;
        }
    
        // Tentar carregar configurações do servidor
        if (supabase) {
          const { data, error } = await supabase.functions.invoke('get-plan-config');
          
          if (error) {
            console.error('SupabaseInitializer: Error loading plan config:', error);
            setConnectionError('function_error');
            setIsError(true);
            setIsInitialized(true);
            return;
          }
        }
      } catch (error) {
        console.error('SupabaseInitializer: Error initializing Supabase client:', error);
        setConnectionError('unknown_error');
        setIsError(true);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeSupabase();
  }, []);

  // Mostrar um indicador de carregamento enquanto inicializa
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  // Mostrar página de erro se não conseguiu inicializar
  if (isError) {
    return <DetailedErrorPage errorType={connectionError} />;
  }

  return <>{children}</>;
};

// Componente detalhado para a página de erro com todas as informações de configuração
const DetailedErrorPage: React.FC<{ errorType: string | null }> = ({ errorType }) => {
  const errorMessages: { [key: string]: string } = {
    missing_config: 'Erro: As variáveis de ambiente do Supabase não estão configuradas.',
    connection_failed: 'Erro: Não foi possível conectar ao Supabase. Verifique se as credenciais estão corretas e o serviço está online.',
    function_error: 'Erro: Não foi possível acessar as funções do Supabase. Verifique se o projeto e as funções estão configurados corretamente.',
    unknown_error: 'Erro: Ocorreu um erro desconhecido ao tentar conectar ao Supabase.'
  };

  const currentErrorMessage = errorType ? errorMessages[errorType] : '';

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-6xl mx-auto py-8">
        <div className="space-y-6">
          {/* Alerta Principal */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <h1 className="text-2xl font-bold text-amber-800">CONFIGURAÇÃO INICIAL NECESSÁRIA</h1>
            </div>
            <p className="text-amber-700 mb-4">
              Para o primeiro uso do sistema, você precisa configurar as variáveis de ambiente do Supabase:
            </p>
            {currentErrorMessage && (
              <p className="text-red-800 font-semibold mb-4">{currentErrorMessage}</p>
            )}
          </div>

          {/* Configuração no GitHub Actions */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-blue-50 border-b border-blue-200 p-4">
              <h2 className="flex items-center gap-2 text-blue-800 text-xl font-semibold">
                <Github className="h-5 w-5" />
                Configuração no GitHub Actions
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-blue-700 text-sm">
                Para criar a estrutura do banco de dados no Supabase utilizando GitHub Actions, configure 
                as seguintes variáveis no seu repositório GitHub:
              </p>
              
              <div className="bg-blue-100 p-4 rounded-lg space-y-3">
                <div>
                  <p className="font-semibold text-blue-800 text-sm">SUPABASE_ACCESS_TOKEN:</p>
                  <p className="text-blue-700 text-xs">Token de acesso gerado no dashboard do Supabase para autenticação da CLI</p>
                </div>
                
                <div>
                  <p className="font-semibold text-blue-800 text-sm">SUPABASE_DB_PASSWORD:</p>
                  <p className="text-blue-700 text-xs">Senha do banco de dados PostgreSQL do seu projeto Supabase</p>
                </div>
                
                <div>
                  <p className="font-semibold text-blue-800 text-sm">SUPABASE_PROJECT_ID:</p>
                  <p className="text-blue-700 text-xs">Identificador único do seu projeto no Supabase</p>
                </div>
                
                <div>
                  <p className="font-semibold text-blue-800 text-sm">SUPABASE_SERVICE_ROLE_KEY:</p>
                  <p className="text-blue-700 text-xs">Chave de serviço com permissões administrativas para o projeto</p>
                </div>
              </div>
              
              <div className="bg-blue-200 p-3 rounded text-xs text-blue-800">
                <p className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configure essas chaves como secrets no seu repositório GitHub em Settings → Secrets and variables → Actions
                </p>
              </div>
            </div>
          </div>

          {/* Configuração do ambiente */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h2 className="text-gray-800 text-xl font-semibold">
                Configuração do ambiente para execução local ou em produção:
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Opção 1: Local */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 text-sm mb-3">Opção 1: Configuração Local (arquivo .env)</h3>
                <p className="text-red-700 text-sm mb-3">Crie um arquivo .env na raiz do projeto com as seguintes variáveis:</p>
                
                <div className="bg-red-100 p-3 rounded font-mono text-xs text-red-900 border border-red-200">
                  <div>VITE_SUPABASE_URL=https://seu-projeto.supabase.co</div>
                  <div>VITE_SUPABASE_ANON_KEY=sua-chave-anon-key</div>
                </div>
              </div>

              {/* Opção 2: Vercel */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 text-sm mb-3">Opção 2: Configuração na Vercel</h3>
                <div className="text-purple-700 text-sm space-y-2">
                  <p>1. Acesse o dashboard da Vercel → Seu projeto → Settings → Environment Variables</p>
                  <p>2. Adicione as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY</p>
                  <p>3. Clique em "Save" e faça um novo deploy do projeto</p>
                </div>
              </div>

              {/* Opção 3: Easypanel */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 text-sm mb-3">Opção 3: Configuração no Easypanel</h3>
                <div className="text-green-700 text-sm space-y-2">
                  <p>1. Acesse o Easypanel → Seu projeto → Environment</p>
                  <p>2. Adicione as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY</p>
                  <p>3. Clique em "Save" e reinicie o container</p>
                </div>
              </div>
            </div>
          </div>

          {/* Onde encontrar as informações */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
                <Database className="h-5 w-5" />
                Onde encontrar essas informações:
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <strong className="text-gray-800">Acesse o dashboard do Supabase → Seu projeto → Project Settings → API</strong>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <strong className="text-gray-800">URL do projeto:</strong> "Project URL"
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <strong className="text-gray-800">Anon Key:</strong> "Project API keys" → "anon public"
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <strong className="text-gray-800">Service Role Key:</strong> "Project API keys" → "service_role"
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <strong className="text-gray-800">Project ID:</strong> Visível na URL do dashboard ou em Project Settings
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <strong className="text-gray-800">Access Token:</strong> Gere em https://supabase.com/dashboard/account/tokens
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Nota importante */}
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              <strong>Após configurar essas variáveis, reinicie a aplicação para que as alterações tenham efeito.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
