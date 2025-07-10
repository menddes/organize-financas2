import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, LogOut, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';

interface MobileHeaderProps {
  title?: string;
  hideValues?: boolean;
  toggleHideValues?: () => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onLogout?: () => void;
  onThemeToggle?: () => void;
  theme?: 'light' | 'dark';
}

// Funções para saudação
function getGreeting() {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
function getFirstName(name?: string) {
  if (!name) return "";
  return name.split(" ")[0];
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  hideValues,
  toggleHideValues,
  showBackButton,
  onBackClick,
  onLogout,
  onThemeToggle,
  theme,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAppContext();
  const { t } = usePreferences();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col px-4 py-3 border-b bg-background md:hidden">
      {/* Saudação do usuário */}
      {user?.user_metadata?.name && (
        <span className="text-base font-semibold text-primary mb-1">
          {getGreeting()}, {getFirstName(user.user_metadata.name)}!
        </span>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              onClick={onBackClick ? onBackClick : () => navigate(-1)}
              className="p-2 rounded hover:bg-accent"
              title="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <span className="text-lg font-bold truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {typeof hideValues === 'boolean' && toggleHideValues && (
            <button
              onClick={toggleHideValues}
              className="p-2 rounded hover:bg-accent"
              title={hideValues ? t('dashboard.show_values') : t('dashboard.hide_values')}
            >
              {hideValues ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
          {onThemeToggle && (
            <button
              onClick={onThemeToggle}
              className="p-2 rounded hover:bg-accent"
              title={theme === 'dark' ? t('theme.light_mode') : t('theme.dark_mode')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
          <button
            onClick={onLogout ? onLogout : handleLogout}
            className="p-2 rounded hover:bg-accent"
            title={t('settings.logout')}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;