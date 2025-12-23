import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Trigger, AutomationLog } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { GlowingEffect } from '../components/ui/glowing-effect';

const TRIGGER_ID = '00000000-0000-0000-0000-000000000001';

export default function AutomationPage() {
  const { user } = useAuth();
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const processingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadTriggerState();
      loadLogs();
      const cleanup = subscribeToChanges();
      return cleanup;
    }
  }, [user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadTriggerState = async () => {
    try {
      console.log('Loading trigger state for ID:', TRIGGER_ID);
      const { data, error } = await supabase
        .from('triggers')
        .select('*')
        .eq('id', TRIGGER_ID)
        .maybeSingle();

      if (error) throw error;

      console.log('Loaded trigger data:', data);

      if (!data) {
        console.log('No trigger found, creating new one...');
        const { data: newTrigger, error: insertError } = await supabase
          .from('triggers')
          .insert({
            id: TRIGGER_ID,
            start_calling: false,
            start_qualifying: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        console.log('New trigger created:', newTrigger);
        setTrigger(newTrigger);
      } else {
        setTrigger(data);
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      console.log('Loaded logs:', data);
      setLogs(data || []);
    } catch (error: any) {
      console.error('Error loading logs:', error);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      const { error } = await supabase
        .from('automation_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;

      setLogs((prev) => prev.filter((log) => log.id !== logId));
      setNotification({ type: 'success', message: 'Log deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting log:', error);
      setNotification({ type: 'error', message: 'Failed to delete log' });
    }
  };

  const handleDeleteAllLogs = async () => {
    if (!window.confirm('Are you sure you want to delete all logs? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting all logs for user:', user!.id);
      const { data, error } = await supabase
        .from('automation_logs')
        .delete()
        .eq('user_id', user!.id)
        .select();

      console.log('Delete response:', { data, error });
      
      if (error) throw error;

      setLogs([]);
      setNotification({ type: 'success', message: 'All logs deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting all logs:', error);
      setNotification({ type: 'error', message: `Failed to delete all logs: ${error.message}` });
    }
  };

  const subscribeToChanges = () => {
    const triggerChannel = supabase
      .channel(`triggers_changes_${user!.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'triggers',
        },
        (payload) => {
          setTrigger(payload.new as Trigger);
        }
      )
      .subscribe();

    const logsChannel = supabase
      .channel(`logs_changes_${user!.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'automation_logs',
        },
        (payload) => {
          setLogs((prev) => {
            const exists = prev.some((l) => l.id === (payload.new as AutomationLog).id);
            if (exists) return prev;
            return [payload.new as AutomationLog, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(triggerChannel);
      supabase.removeChannel(logsChannel);
    };
  };

  const handleToggleAutomation = async (
    type: 'start_calling' | 'start_qualifying'
  ) => {
    // Force clear any stuck state
    processingRef.current.delete(type);
    setActionLoading(null);

    // Small delay before processing
    await new Promise(r => setTimeout(r, 100));

    processingRef.current.add(type);
    setActionLoading(type);

    try {
      console.log(`Triggering ${type}...`);

      // Set to true (trigger the action)
      const { data, error: updateError } = await supabase
        .from('triggers')
        .update({
          [type]: true,
          updated_by: user!.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', TRIGGER_ID)
        .select();

      if (updateError) {
        console.error('Error updating:', updateError);
        throw updateError;
      }

      console.log('Update response:', data);

      if (data && data.length > 0) {
        setTrigger(data[0]);
      } else {
        console.warn('No data returned, reloading trigger');
        await loadTriggerState();
      }

      await supabase.from('automation_logs').insert({
        action_type: type,
        status: 'success',
        user_id: user!.id,
        details: { enabled: true },
      });

      setNotification({
        type: 'success',
        message: `${
          type === 'start_calling' ? 'Calling' : 'Qualifying'
        } automation triggered`,
      });

    } catch (error: any) {
      console.error('Error:', error);
      setNotification({ type: 'error', message: error.message });

      await supabase.from('automation_logs').insert({
        action_type: type,
        status: 'failed',
        user_id: user!.id,
        details: { error: error.message },
      });
    } finally {
      // Force clear loading state
      setActionLoading(null);
      processingRef.current.delete(type);

      // Reset to false after 3 seconds (non-blocking)
      setTimeout(async () => {
        try {
          const { data: resetData } = await supabase
            .from('triggers')
            .update({
              [type]: false,
              updated_by: user!.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', TRIGGER_ID)
            .select();

          if (resetData && resetData.length > 0) {
            setTrigger(resetData[0]);
            console.log(`${type} auto-reset to false`);
          }
        } catch (err) {
          console.error('Reset error:', err);
        }
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading automation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg border flex items-start gap-3 max-w-md ${
              notification.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            )}
            <p
              className={`text-sm ${
                notification.type === 'success'
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}
            >
              {notification.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Automation</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your automated workflows
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-800 rounded-[1.25rem] shadow-sm border-2 border-slate-300 dark:border-slate-600 p-4"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Start Calling
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Begin automated calling process
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                Status:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  trigger?.start_calling
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-400'
                }`}
              >
                {trigger?.start_calling ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="relative border-2 border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:shadow-blue-500/30 dark:hover:shadow-blue-400/20 transition-all duration-200 hover:-translate-y-0.5">
              <div className="pointer-events-none absolute inset-0 rounded-lg">
                <GlowingEffect
                  spread={50}
                  glow={true}
                  disabled={false}
                  proximity={80}
                  inactiveZone={0.01}
                  borderWidth={4}
                />
              </div>
              <Button
                onClick={() => handleToggleAutomation('start_calling')}
                disabled={actionLoading === 'start_calling' || trigger?.start_calling}
                className="w-full relative z-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
                size="lg"
              >
                {actionLoading === 'start_calling' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : trigger?.start_calling ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Triggered (resetting...)
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Trigger Calling
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-[1.25rem] shadow-sm border-2 border-slate-300 dark:border-slate-600 p-4"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Start Qualifying
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Begin lead qualification process
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                Status:
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  trigger?.start_qualifying
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-400'
                }`}
              >
                {trigger?.start_qualifying ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="relative border-2 border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden shadow-md hover:shadow-lg hover:shadow-purple-500/30 dark:hover:shadow-purple-400/20 transition-all duration-200 hover:-translate-y-0.5">
              <div className="pointer-events-none absolute inset-0 rounded-lg">
                <GlowingEffect
                  spread={50}
                  glow={true}
                  disabled={false}
                  proximity={80}
                  inactiveZone={0.01}
                  borderWidth={4}
                />
              </div>
              <Button
                onClick={() => handleToggleAutomation('start_qualifying')}
                disabled={actionLoading === 'start_qualifying' || trigger?.start_qualifying}
                className="w-full relative z-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200"
                size="lg"
              >
                {actionLoading === 'start_qualifying' ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : trigger?.start_qualifying ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Triggered (resetting...)
                  </>
                ) : (
                  <>
                    <Activity className="w-5 h-5" />
                    Trigger Qualifying
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-slate-800 rounded-[1.25rem] shadow-sm border-2 border-slate-300 dark:border-slate-600 p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Recent Activity Logs
          </h3>
          <button
            onClick={handleDeleteAllLogs}
            disabled={logs.length === 0}
            className="p-2 hover:text-red-500 dark:hover:text-red-400 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-50"
            title="Delete all logs"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-center text-slate-600 dark:text-slate-400 py-8">
              No automation logs yet
            </p>
          ) : (
            logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className={`p-2 rounded-lg ${
                      log.status === 'success'
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-red-100 dark:bg-red-900/30'
                    }`}
                  >
                    {log.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {log.action_type.replace('_', ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    {log.details?.new_status && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                        Lead updated to: <span className="font-medium">{log.details.new_status}</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      log.status === 'success'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}
                  >
                    {log.status}
                  </span>
                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    className="p-1.5 hover:text-red-500 dark:hover:text-red-400 transition-colors text-slate-600 dark:text-slate-400"
                    title="Delete log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
