
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertTriangle, Settings, Database } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';

const SystemConfigManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [isLoading, setIsLoading] = useState(false);

  if (roleLoading || isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>{roleLoading ? "Verificando permissões..." : "Carregando configurações..."}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Acesso Negado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Você não tem permissões de administrador para acessar as configurações do sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações Técnicas do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Database className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-800 text-sm font-medium mb-2">📋 Configuração Necessária no Supabase</p>
              <div className="text-blue-700 text-sm space-y-2">
                <p><strong>Para o sistema funcionar em produção, você precisa configurar a seguinte secret no Supabase:</strong></p>
                <div className="bg-blue-100 p-3 rounded text-xs space-y-1">
                  <p><strong>1. MANAGEMENT_API_TOKEN</strong></p>
                  <p className="font-mono">Como obter: Acesse o Dashboard do Supabase → Seu perfil → API Keys → Generate New Token</p>
                  
                  <p className="pt-2"><strong>Como configurar:</strong></p>
                  <p>• Acesse: Supabase Dashboard → Settings → Edge Functions → Secrets</p>
                  <p>• Clique em "Add new secret"</p>
                  <p>• Adicione a secret com o nome e valor exatos</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Database className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-green-800 text-sm font-medium mb-2">✅ Configurações Automáticas</p>
              <div className="text-green-700 text-sm space-y-2">
                <p>As seguintes configurações são gerenciadas automaticamente pelo sistema:</p>
                <div className="bg-green-100 p-3 rounded text-xs space-y-1">
                  <p><strong>• SUPABASE_URL:</strong> Configurada automaticamente via integração</p>
                  <p><strong>• SUPABASE_ANON_KEY:</strong> Configurada automaticamente via integração</p>
                  <p><strong>• PROJECT_REF:</strong> Extraída automaticamente da URL do projeto</p>
                </div>
                <p className="text-xs">Essas configurações não precisam ser alteradas manualmente.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-800 text-sm">
            <strong>Importante:</strong> Apenas a secret MANAGEMENT_API_TOKEN precisa ser configurada manualmente. 
            Todas as outras configurações do Supabase são gerenciadas automaticamente pela integração.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemConfigManager;
