import React, { useEffect } from "react";
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/contexts/AppContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useUserRole } from '@/hooks/useUserRole';
import { LayoutDashboard, Receipt, BarChart3, Target, User, Settings, FolderOpen, Calendar, Crown, LogOut, Shield } from 'lucide-react';

interface SidebarProps {
  onProfileClick?: () => void;
  onConfigClick?: () => void;
}

// Função para alternar tema (deve ficar fora do componente)
function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  if (html.classList.contains('dark')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.setItem('theme', 'light');
  }
}

const Sidebar: React.FC<SidebarProps> = ({ onProfileClick, onConfigClick }) => {
  const { user, logout } = useAppContext();
  const { t } = usePreferences();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  // Utilitários para cumprimento
  function getGreeting() {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  }

  function getFirstName(name) {
    if (!name) return "";
    return name.split(" ")[0];
  }

  // Verificar se estamos na página de administração
  const isAdminPage = location.pathname === '/admin';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleProfileClick = () => {
    if (isAdmin && isAdminPage && onProfileClick) {
      onProfileClick();
    } else {
      navigate('/profile');
    }
  };

  // Se for admin na página de admin, mostrar apenas menu administrativo
  if (isAdmin && isAdminPage) {
    const adminMenuItems = [
      {
        icon: Settings,
        label: 'Configurações',
        action: () => {
          if (onConfigClick) {
            onConfigClick();
          }
        }
      }
    ];

    return (
      <div className="hidden md:flex h-screen w-64 flex-col bg-background border-r">
        <div className="p-6 border-b flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
          <button
            onClick={toggleTheme}
            className="ml-2 p-2 rounded text-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title="Alternar tema"
          >
            🌞/🌙
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {adminMenuItems.map((item, index) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={item.action}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleProfileClick}
          >
            <User className="h-5 w-5" />
            Perfil
          </Button>
        </nav>
        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  // Menu padrão para usuários normais
  const defaultMenuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), href: '/dashboard' },
    { icon: Receipt, label: t('nav.transactions'), href: '/transactions' },
    { icon: FolderOpen, label: t('nav.categories'), href: '/categories' },
    { icon: Target, label: t('nav.goals'), href: '/goals' },
    { icon: Calendar, label: t('schedule.title'), href: '/schedule' },
    { icon: BarChart3, label: t('nav.reports'), href: '/reports' },
    { icon: Crown, label: t('nav.plans'), href: '/plans' },
  ];

  let menuItems = [...defaultMenuItems];
  if (isAdmin && !isAdminPage) {
    const adminMenuItem = { icon: Shield, label: 'Admin', href: '/admin' };
    menuItems.push(adminMenuItem);
  }

  const bottomMenuItems = [
    { icon: User, label: t('nav.profile'), href: '/profile' },
    { icon: Settings, label: t('nav.settings'), href: '/settings' },
  ];

  if (!user) return null;

  return (
    <div className="hidden md:flex h-screen w-64 flex-col bg-background border-r">
      <div className="p-6 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">
          {getGreeting()}, {getFirstName(user?.user_metadata?.name)}!
        </h1>
        <button
          onClick={toggleTheme}
          className="ml-2 p-2 rounded text-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          title="Alternar tema"
        >
          🌞/🌙
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t space-y-2">
        {bottomMenuItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {t('settings.logout')}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
