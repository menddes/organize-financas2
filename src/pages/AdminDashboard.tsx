
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminProfileConfig from '@/components/admin/AdminProfileConfig';
import AdminSectionTabs from '@/components/admin/AdminSectionTabs';
import Sidebar from '@/components/layout/Sidebar';
import MobileNavBar from '@/components/layout/MobileNavBar';
import MobileHeader from '@/components/layout/MobileHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppContext } from '@/contexts/AppContext';
import { Shield, AlertTriangle } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [showProfile, setShowProfile] = useState(false);
  const isMobile = useIsMobile();
  const { hideValues, toggleHideValues } = useAppContext();

  const handleProfileClick = () => {
    setShowProfile(true);
  };

  const handleConfigClick = () => {
    setShowProfile(false);
  };

  const handleAddTransaction = (type: 'income' | 'expense') => {
    console.log(`Add ${type} transaction`);
  };

  return (
    <div className="min-h-screen bg-background w-full">
      {isMobile ? (
        <div className="flex flex-col h-screen w-full">
          <MobileHeader hideValues={hideValues} toggleHideValues={toggleHideValues} />
          <main className="flex-1 overflow-auto p-4 pb-20 w-full">
            <div className="w-full">
              {showProfile ? (
                <div className="w-full">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-8 w-8 text-blue-600" />
                      <h1 className="text-3xl font-bold text-gray-900">
                        Configurações do Perfil
                      </h1>
                      <button 
                        onClick={handleConfigClick}
                        className="ml-auto text-blue-600 hover:text-blue-800"
                      >
                        ← Voltar ao Painel
                      </button>
                    </div>
                    <p className="text-gray-600">
                      Gerencie suas informações de administrador
                    </p>
                  </div>
                  <AdminProfileConfig />
                </div>
              ) : (
                <div className="w-full">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-8 w-8 text-blue-600" />
                      <h1 className="text-3xl font-bold text-gray-900">
                        Painel Administrativo
                      </h1>
                    </div>
                    <p className="text-gray-600">
                      Monitore e gerencie o sistema de pagamentos, usuários e configurações
                    </p>
                  </div>

                  {/* Alerta de Configuração Inicial */}
                  <Card className="mb-6 border-amber-300 bg-amber-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        Configuração Inicial Necessária
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-amber-700 mb-4">
                        Para que o sistema funcione corretamente, você precisa configurar as seguintes seções.
                        Use as abas abaixo para organizar suas configurações por categoria.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Navegação por Abas */}
                  <AdminSectionTabs />
                </div>
              )}
            </div>
          </main>
          <MobileNavBar onAddTransaction={handleAddTransaction} />
        </div>
      ) : (
        <div className="flex h-screen w-full">
          <Sidebar onProfileClick={handleProfileClick} onConfigClick={handleConfigClick} />
          <main className="flex-1 overflow-auto w-full">
            <div className="w-full p-6">
              {showProfile ? (
                <div className="w-full max-w-6xl mx-auto">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-8 w-8 text-blue-600" />
                      <h1 className="text-3xl font-bold text-gray-900">
                        Configurações do Perfil
                      </h1>
                      <button 
                        onClick={handleConfigClick}
                        className="ml-auto text-blue-600 hover:text-blue-800"
                      >
                        ← Voltar ao Painel
                      </button>
                    </div>
                    <p className="text-gray-600">
                      Gerencie suas informações de administrador
                    </p>
                  </div>
                  <AdminProfileConfig />
                </div>
              ) : (
                <div className="w-full max-w-6xl mx-auto">
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-8 w-8 text-blue-600" />
                      <h1 className="text-3xl font-bold text-gray-900">
                        Painel Administrativo
                      </h1>
                    </div>
                    <p className="text-gray-600">
                      Monitore e gerencie o sistema de pagamentos, usuários e configurações
                    </p>
                  </div>

                  {/* Alerta de Configuração Inicial */}
                  <Card className="mb-6 border-amber-300 bg-amber-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        Configuração Inicial Necessária
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-amber-700 mb-4">
                        Para que o sistema funcione corretamente, você precisa configurar as seguintes seções.
                        Use as abas abaixo para organizar suas configurações por categoria.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Navegação por Abas */}
                  <AdminSectionTabs />
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
