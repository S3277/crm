import { ReactNode, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Zap,
  LogOut,
  Moon,
  Sun,
  User,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import { Button } from './ui/button';
import { NavBar } from './ui/tubelight-navbar';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage: 'dashboard' | 'leads' | 'automation' | 'quick-analytics' | 'inbound-leads';
  onNavigate: (page: 'dashboard' | 'leads' | 'automation' | 'quick-analytics' | 'inbound-leads') => void;
}

export default function DashboardLayout({
  children,
  currentPage,
  onNavigate,
}: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', name: 'Leads', icon: Users },
    { id: 'automation', name: 'Automation', icon: Zap },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Tubelight Navigation Bar */}
      <NavBar
        items={[
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Leads', path: '/leads', icon: Users },
          { name: 'Automation', path: '/automation', icon: Zap },
        ]}
        currentPage={currentPage}
        onNavigate={onNavigate}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 sm:pb-8 sm:pt-24">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
