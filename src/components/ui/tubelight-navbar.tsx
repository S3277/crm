import { useEffect, useState } from 'react';
import { LucideIcon, Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';
import { GlowingEffect } from './glowing-effect';
import { useTheme } from '../../contexts/ThemeContext';

interface NavItem {
  name: string;
  path: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
  currentPage?: string;
  onNavigate?: (page: any) => void;
}

export function NavBar({ items, className, currentPage, onNavigate }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(currentPage || items[0].name);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    setActiveTab(currentPage || items[0].name);
  }, [currentPage, items]);

  return (
    <div
      className={cn(
        'fixed bottom-4 sm:top-0 left-1/2 -translate-x-1/2 z-40 sm:pt-6 px-4 sm:px-0 w-full sm:w-auto',
        className
      )}
    >
      <div className="flex items-center justify-center gap-2 bg-white dark:bg-black border border-slate-300 dark:border-slate-700 backdrop-blur-xl py-2 px-2 rounded-3xl shadow-lg max-w-fit mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <div
              key={item.name}
              onClick={() => {
                setActiveTab(item.name);
                if (onNavigate) {
                  const page = item.name.toLowerCase().replace(' & ', '_');
                  onNavigate(page);
                }
              }}
              className={cn(
                'relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-2xl transition-all duration-300 group border border-slate-300 dark:border-slate-600',
                isActive 
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-black'
              )}
            >
              {/* Glow effect */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl">
                <GlowingEffect
                  spread={30}
                  glow={true}
                  disabled={false}
                  proximity={60}
                  inactiveZone={0.01}
                  borderWidth={2}
                />
              </div>
              
              {/* Content */}
              <span className="relative z-10 hidden md:inline">{item.name}</span>
              <span className="relative z-10 md:hidden">
                <Icon size={20} strokeWidth={2.5} />
              </span>
            </div>
          );
        })}
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={cn(
            'relative cursor-pointer text-sm font-semibold px-4 py-2 rounded-2xl transition-all duration-300 border border-slate-300 dark:border-slate-600',
            'text-slate-700 dark:text-slate-300 bg-white dark:bg-black hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {/* Glow effect */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl">
            <GlowingEffect
              spread={30}
              glow={true}
              disabled={false}
              proximity={60}
              inactiveZone={0.01}
              borderWidth={2}
            />
          </div>
          
          {/* Content */}
          <span className="relative z-10">
            {theme === 'light' ? (
              <Moon size={20} strokeWidth={2.5} />
            ) : (
              <Sun size={20} strokeWidth={2.5} />
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
