import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Lead } from '../lib/supabase';
import { motion } from 'framer-motion';
import {
  Users,
  AlertCircle,
  Phone,
  Calendar,
  ChevronDown,
  Filter,
} from 'lucide-react';
import { Button } from '../components/ui/button';

export default function InboundLeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  // Summary stats
  const totalInbound = leads.length;
  const toWork = leads.filter((l) => l.qualified === false).length;
  const appointmentsBooked = leads.filter(
    (l) => l.call_result === 'appointment_booked'
  ).length;

  useEffect(() => {
    if (user) {
      loadInboundLeads();
      const cleanup = subscribeToLeads();
      return cleanup;
    }
  }, [user]);

  useEffect(() => {
    filterLeads();
  }, [leads, selectedStatus]);

  const loadInboundLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user!.id)
        .eq('lead_type', 'inbound')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading inbound leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToLeads = () => {
    const channel = supabase
      .channel(`inbound_leads_changes_${user!.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user!.id}`,
        },
        (payload) => {
          if ((payload.new as Lead)?.lead_type === 'inbound') {
            loadInboundLeads();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filterLeads = () => {
    let filtered = leads;

    if (selectedStatus !== 'all') {
      if (selectedStatus === 'to_work') {
        filtered = filtered.filter((l) => l.qualified === false);
      } else if (selectedStatus === 'booked') {
        filtered = filtered.filter((l) => l.call_result === 'appointment_booked');
      } else {
        filtered = filtered.filter((l) => l.status === selectedStatus);
      }
    }

    setFilteredLeads(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'warm':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      case 'cold':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400';
    }
  };

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
          Inbound Leads Queue
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage and process inbound leads in real-time
        </p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium opacity-90">Total Inbound</h4>
            <Users className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{totalInbound}</p>
          <p className="text-xs opacity-75 mt-2">All inbound leads</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium opacity-90">To Work</h4>
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{toWork}</p>
          <p className="text-xs opacity-75 mt-2">Not yet qualified</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium opacity-90">Appointments</h4>
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-3xl font-bold">{appointmentsBooked}</p>
          <p className="text-xs opacity-75 mt-2">Booked from inbound</p>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4"
      >
        <div className="flex items-center space-x-3 flex-wrap">
          <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'all'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            All Leads ({totalInbound})
          </button>
          <button
            onClick={() => setSelectedStatus('to_work')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'to_work'
                ? 'bg-yellow-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            To Work ({toWork})
          </button>
          <button
            onClick={() => setSelectedStatus('hot')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'hot'
                ? 'bg-red-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Hot
          </button>
          <button
            onClick={() => setSelectedStatus('warm')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'warm'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Warm
          </button>
          <button
            onClick={() => setSelectedStatus('booked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'booked'
                ? 'bg-green-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Booked ({appointmentsBooked})
          </button>
        </div>
      </motion.div>

      {/* Leads Queue */}
      {filteredLeads.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {filteredLeads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
            >
              <button
                onClick={() =>
                  setExpandedLead(expandedLead === lead.id ? null : lead.id)
                }
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {lead.name}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {lead.email || lead.phone || 'No contact info'}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>

                    {/* Source Badge */}
                    <span className="inline-block px-3 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 capitalize">
                      {lead.source_channel?.replace('_', ' ')}
                    </span>

                    {/* Qualified Badge */}
                    <div className={`text-xl ${lead.qualified ? 'text-green-500' : 'text-slate-400'}`}>
                      {lead.qualified ? '✓' : '✗'}
                    </div>
                  </div>
                </div>

                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    expandedLead === lead.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Expanded Details */}
              {expandedLead === lead.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-700/30 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                        Email
                      </label>
                      <p className="text-slate-900 dark:text-white mt-1">
                        {lead.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                        Phone
                      </label>
                      <p className="text-slate-900 dark:text-white mt-1">
                        {lead.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                        Call Result
                      </label>
                      <p className="text-slate-900 dark:text-white mt-1 capitalize">
                        {lead.call_result?.replace('_', ' ') || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
                        Created
                      </label>
                      <p className="text-slate-900 dark:text-white mt-1">
                        {new Date(lead.created_at).toLocaleDateString()} at{' '}
                        {new Date(lead.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons - Placeholders for Vapi Agent */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                    <Button
                      disabled
                      className="text-xs"
                      title="Will be triggered by Vapi Agent"
                    >
                      Check Appointment
                    </Button>
                    <Button
                      disabled
                      className="text-xs"
                      title="Will be triggered by Vapi Agent"
                    >
                      Book Appointment
                    </Button>
                    <Button
                      disabled
                      className="text-xs"
                      title="Will be triggered by Vapi Agent"
                    >
                      Mark as Qualified
                    </Button>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-500 italic pt-2">
                    💡 Actions will be enabled when Vapi Agent integration is active
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Phone className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-50" />
          <p className="text-slate-600 dark:text-slate-400">
            No inbound leads found with this filter
          </p>
        </motion.div>
      )}
    </div>
  );
}
