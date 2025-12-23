import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Lead } from '../lib/supabase';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingUp,
  Zap,
  Phone,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface AnalyticsMetrics {
  totalLeads: number;
  inboundLeads: number;
  outboundLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  appointmentsBooked: number;
  unsuccessful: number;
  conversionRate: number;
  inboundBySource: { [key: string]: number };
  recentQualifiedLeads: Lead[];
}

export default function QuickAnalyticsPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    totalLeads: 0,
    inboundLeads: 0,
    outboundLeads: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    appointmentsBooked: 0,
    unsuccessful: 0,
    conversionRate: 0,
    inboundBySource: {},
    recentQualifiedLeads: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;

      const leads = data || [];
      
      // Calculate metrics
      const totalLeads = leads.length;
      const inboundLeads = leads.filter((l) => l.lead_type === 'inbound').length;
      const outboundLeads = leads.filter((l) => l.lead_type === 'outbound').length;
      const hotLeads = leads.filter((l) => l.status === 'hot').length;
      const warmLeads = leads.filter((l) => l.status === 'warm').length;
      const coldLeads = leads.filter((l) => l.status === 'cold').length;
      const appointmentsBooked = leads.filter(
        (l) => l.call_result === 'appointment_booked'
      ).length;
      const unsuccessful = leads.filter(
        (l) => l.call_result === 'unsuccessful'
      ).length;

      // Conversion rate: % of leads that resulted in appointment_booked
      const conversionRate =
        totalLeads > 0 ? (appointmentsBooked / totalLeads) * 100 : 0;

      // Inbound by source channel
      const inboundBySourceMap: { [key: string]: number } = {};
      leads.forEach((lead) => {
        if (lead.lead_type === 'inbound') {
          const source = lead.source_channel || 'unknown';
          inboundBySourceMap[source] = (inboundBySourceMap[source] || 0) + 1;
        }
      });

      // Recent qualified leads
      const recentQualifiedLeads = leads
        .filter((l) => l.qualified === true)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      setMetrics({
        totalLeads,
        inboundLeads,
        outboundLeads,
        hotLeads,
        warmLeads,
        coldLeads,
        appointmentsBooked,
        unsuccessful,
        conversionRate,
        inboundBySource: inboundBySourceMap,
        recentQualifiedLeads,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const KPICard = ({
    title,
    value,
    icon: Icon,
    gradient,
  }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    gradient: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-6 text-white shadow-lg ${gradient}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium opacity-90">{title}</h4>
        {Icon}
      </div>
      <p className="text-3xl font-bold">
        {typeof value === 'number' && title.includes('%')
          ? value.toFixed(1) + '%'
          : value}
      </p>
      <p className="text-xs opacity-75 mt-2">Last 30 days</p>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          Quick Analytics
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Real-time overview of your lead performance
        </p>
      </motion.div>

      {/* KPI Cards - Top Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Total Leads"
          value={metrics.totalLeads}
          icon={<Users className="w-5 h-5" />}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <KPICard
          title="Inbound Leads"
          value={metrics.inboundLeads}
          icon={<Phone className="w-5 h-5" />}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <KPICard
          title="Outbound Leads"
          value={metrics.outboundLeads}
          icon={<Zap className="w-5 h-5" />}
          gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
        />
        <KPICard
          title="Appointments Booked"
          value={metrics.appointmentsBooked}
          icon={<CheckCircle className="w-5 h-5" />}
          gradient="bg-gradient-to-br from-green-500 to-green-600"
        />
        <KPICard
          title="Unsuccessful"
          value={metrics.unsuccessful}
          icon={<XCircle className="w-5 h-5" />}
          gradient="bg-gradient-to-br from-red-500 to-red-600"
        />
        <KPICard
          title="Conversion Rate"
          value={metrics.conversionRate}
          icon={<TrendingUp className="w-5 h-5" />}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        />
      </div>

      {/* Lead Volume Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
      >
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Lead Volume Breakdown
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inbound vs Outbound */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
              By Lead Type
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    Inbound
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {metrics.inboundLeads} (
                    {metrics.totalLeads > 0
                      ? ((metrics.inboundLeads / metrics.totalLeads) * 100).toFixed(1)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${
                        metrics.totalLeads > 0
                          ? (metrics.inboundLeads / metrics.totalLeads) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    Outbound
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {metrics.outboundLeads} (
                    {metrics.totalLeads > 0
                      ? ((metrics.outboundLeads / metrics.totalLeads) * 100).toFixed(1)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-cyan-500 h-2 rounded-full"
                    style={{
                      width: `${
                        metrics.totalLeads > 0
                          ? (metrics.outboundLeads / metrics.totalLeads) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* By Status */}
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
              By Lead Status
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Hot</span>
                <span className="font-semibold text-red-600">
                  {metrics.hotLeads}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Warm</span>
                <span className="font-semibold text-orange-600">
                  {metrics.warmLeads}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Cold</span>
                <span className="font-semibold text-blue-600">
                  {metrics.coldLeads}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Appointments & Outcomes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
      >
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          Appointments & Outcomes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Appointments Booked
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {metrics.appointmentsBooked}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {metrics.totalLeads > 0
                  ? ((metrics.appointmentsBooked / metrics.totalLeads) * 100).toFixed(1)
                  : 0}
                % of total leads
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Unsuccessful / Not Interested
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {metrics.unsuccessful}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                {metrics.totalLeads > 0
                  ? ((metrics.unsuccessful / metrics.totalLeads) * 100).toFixed(1)
                  : 0}
                % of total leads
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Inbound by Source */}
      {Object.keys(metrics.inboundBySource).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Inbound Leads by Source Channel
          </h3>
          <div className="space-y-4">
            {Object.entries(metrics.inboundBySource).map(([source, count]) => (
              <div key={source}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 dark:text-slate-400 capitalize">
                    {source.replace('_', ' ')}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {count}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        metrics.inboundLeads > 0 ? (count / metrics.inboundLeads) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Qualified Leads */}
      {metrics.recentQualifiedLeads.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
        >
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
            Recent Qualified Leads
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700">
                <tr className="text-left text-slate-600 dark:text-slate-400">
                  <th className="pb-3 font-semibold">Name</th>
                  <th className="pb-3 font-semibold">Lead Type</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Call Result</th>
                  <th className="pb-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentQualifiedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="py-3 text-slate-900 dark:text-white font-medium">
                      {lead.name}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400 capitalize">
                      {lead.lead_type}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${
                          lead.status === 'hot'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : lead.status === 'warm'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400 text-xs capitalize">
                      {lead.call_result?.replace('_', ' ') || 'N/A'}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
