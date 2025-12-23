import { Home, Users, Zap, Settings } from 'lucide-react';
import { NavBar } from '@/components/ui/tubelight-navbar';

interface AppNavBarProps {
  currentPage: 'dashboard' | 'leads' | 'automation' | 'settings';
  onNavigate: (page: 'dashboard' | 'leads' | 'automation' | 'settings') => void;
}

export function AppNavBar({ currentPage, onNavigate }: AppNavBarProps) {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, page: 'dashboard' as const },
    { name: 'Leads', path: '/leads', icon: Users, page: 'leads' as const },
    { name: 'Automation', path: '/automation', icon: Zap, page: 'automation' as const },
    { name: 'Settings', path: '/settings', icon: Settings, page: 'settings' as const },
  ];

  return (
    <NavBar
      items={navItems.map(item => ({
        name: item.name,
        path: item.path,
        icon: item.icon,
      }))}
      currentPage={currentPage}
      onNavigate={onNavigate}
    />
  );
}
