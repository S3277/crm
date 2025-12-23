import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Lead } from '../lib/supabase';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Flame,
  ThermometerSun,
  LogOut,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { DashboardGrid } from '../components/ui/dashboard-grid';

export default function DashboardPage({ onNavigate }: { onNavigate?: (page: 'leads' | 'automation' | 'quick-analytics' | 'inbound-leads') => void }) {
  const { user, profile, signOut } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [stats, setStats] = useState({
    totalLeads: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    uninterestedLeads: 0,
    conversionRate: 0,
    recentLeads: [] as Lead[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
      const cleanup = subscribeToLeads();
      return cleanup;
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;

      const leads = data || [];
      const hotLeads = leads.filter((l) => l.status === 'hot').length;
      const warmLeads = leads.filter((l) => l.status === 'warm').length;
      const coldLeads = leads.filter((l) => l.status === 'cold').length;
      const uninterestedLeads = leads.filter((l) => l.status === 'uninterested').length;

      const conversionRate =
        leads.length > 0 ? ((hotLeads + warmLeads) / leads.length) * 100 : 0;

      const recentLeads = leads
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setStats({
        totalLeads: leads.length,
        hotLeads,
        warmLeads,
        coldLeads,
        uninterestedLeads,
        conversionRate,
        recentLeads,
      });
    } catch (error: any) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToLeads = () => {
    const channel = supabase
      .channel(`dashboard_leads_changes_${user!.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user!.id}`,
        },
        () => {
          loadStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const statCards = [
    {
      label: 'Total Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Hot Leads',
      value: stats.hotLeads,
      icon: Flame,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
    },
    {
      label: 'Warm Leads',
      value: stats.warmLeads,
      icon: ThermometerSun,
      color: 'orange',
      gradient: 'from-orange-500 to-orange-600',
    },
    {
      label: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
    },
  ];

  const handleOpenProfile = useCallback(() => {
    setShowProfile(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Welcome Back!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Here's what's happening with your leads today
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                {stat.label}
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Glowing Dashboard Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full"
      >
        <DashboardGrid onNavigate={onNavigate} onProfileClick={handleOpenProfile} />
      </motion.div>

      {stats.recentLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Recent Leads
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr className="text-left text-slate-600 dark:text-slate-400">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Source</th>
                  <th className="pb-3 font-semibold">Qualified</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLeads.map((lead, index) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.05 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="py-3 text-slate-900 dark:text-white font-medium">
                      {lead.name}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                          lead.status === 'hot'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : lead.status === 'warm'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                            : lead.status === 'cold'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400 text-xs capitalize">
                      {lead.source_channel?.replace('_', ' ') || 'N/A'}
                    </td>
                    <td className="py-3">
                      <span className={`text-lg ${lead.qualified ? 'text-green-500' : 'text-slate-400'}`}>
                        {lead.qualified ? '✓' : '✗'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Profile Modal */}
      {showProfile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowProfile(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Name
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {profile?.full_name || 'Not set'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Email
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white break-all">
                  {user?.email || 'Not available'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Account Created
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}
                </p>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowProfile(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={handleSignOut}
                  className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
