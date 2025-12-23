import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Lead } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Filter,
  Flame,
  ThermometerSun,
  Snowflake,
  X as XIcon,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../components/ui/button';

const AddLeadModal = lazy(() => import('../components/AddLeadModal'));
const ImportCSVModal = lazy(() => import('../components/ImportCSVModal'));

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [leadTypeFilter, setLeadTypeFilter] = useState<string>('all');
  const [qualifiedFilter, setQualifiedFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadLeads();
      const cleanup = subscribeToLeads();

      return () => {
        cleanup();
      };
    }
  }, [user]);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, leadTypeFilter, qualifiedFilter]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadLeads = async () => {
    try {
      console.log('Current user ID:', user!.id);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded leads:', data);
      console.log('Total leads:', data?.length);
      console.log('Metadata samples:', data?.map(l => ({ name: l.name, user_id: l.user_id, created_at: l.created_at })));
      setLeads(data || []);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToLeads = () => {
    const channel = supabase
      .channel(`leads_changes_${user!.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads',
          filter: `user_id=eq.${user!.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads((prev) => {
              const exists = prev.some((l) => l.id === (payload.new as Lead).id);
              if (exists) return prev;
              return [payload.new as Lead, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setLeads((prev) =>
              prev.map((lead) =>
                lead.id === (payload.new as Lead).id ? (payload.new as Lead) : lead
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setLeads((prev) => prev.filter((lead) => lead.id !== (payload.old as Lead).id));
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

    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter);
    }

    if (leadTypeFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.lead_type === leadTypeFilter);
    }

    if (qualifiedFilter !== 'all') {
      filtered = filtered.filter((lead) => {
        const isQualified = lead.qualified === true;
        
        console.log('Lead:', lead.name, 'Qualified:', lead.qualified);
        
        if (qualifiedFilter === 'qualified') {
          return isQualified;
        } else if (qualifiedFilter === 'not_qualified') {
          return !isQualified;
        }
        return true;
      });
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((lead) => {
        const type = lead.lead_type.toLowerCase();
        const channel = (lead.source_channel || '').toLowerCase();

        return (
          lead.name.toLowerCase().includes(term) ||
          lead.email?.toLowerCase().includes(term) ||
          lead.phone?.toLowerCase().includes(term) ||
          type.includes(term) ||
          channel.includes(term)
        );
      });
    }

    setFilteredLeads(filtered);
  };

  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      setNotification({ type: 'success', message: 'Lead deleted successfully' });
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    }
  };

  const exportToCSV = () => {
    if (filteredLeads.length === 0) {
      setNotification({ type: 'error', message: 'No leads to export' });
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Status', 'Lead Type', 'Source Channel'];
    const rows = filteredLeads.map((lead) => [
      `"${lead.name}"`,
      `"${lead.email || ''}"`,
      `"${lead.phone || ''}"`,
      lead.status,
      lead.lead_type,
      lead.source_channel || '',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification({ type: 'success', message: `Exported ${filteredLeads.length} leads` });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'hot':
        return <Flame className="w-4 h-4" />;
      case 'warm':
        return <ThermometerSun className="w-4 h-4" />;
      case 'cold':
        return <Snowflake className="w-4 h-4" />;
      case 'called':
        return <Phone className="w-4 h-4" />;
      case 'texted':
        return <MessageSquare className="w-4 h-4" />;
      case 'interested':
        return <CheckCircle className="w-4 h-4" />;
      case 'not_interested':
        return <XIcon className="w-4 h-4" />;
      default:
        return <XIcon className="w-4 h-4" />;
    }
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingLead(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading leads...</p>
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

      <Suspense fallback={null}>
        {showAddModal && (
          <AddLeadModal
            isOpen={showAddModal}
            onClose={handleCloseAddModal}
            onSuccess={(message) => setNotification({ type: 'success', message })}
            onError={(message) => setNotification({ type: 'error', message })}
            userId={user!.id}
            editLead={editingLead}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showImportModal && (
          <ImportCSVModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onSuccess={(message) => setNotification({ type: 'success', message })}
            onError={(message) => setNotification({ type: 'error', message })}
            userId={user!.id}
          />
        )}
      </Suspense>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Leads</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your lead pipeline ({filteredLeads.length} of {leads.length} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowImportModal(true)} variant="outline">
            <Upload className="w-5 h-5" />
            Import CSV
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-5 h-5" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-5 h-5" />
            Add Lead
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
              <option value="qualified">Qualified</option>
              <option value="unqualified">Unqualified</option>
              <option value="uninterested">Uninterested</option>
              <option value="called">Called</option>
              <option value="texted">Texted</option>
              <option value="interested">Interested</option>
              <option value="not_interested">Not Interested</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={leadTypeFilter}
              onChange={(e) => setLeadTypeFilter(e.target.value)}
              className="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="all">All Lead Types</option>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={qualifiedFilter}
              onChange={(e) => setQualifiedFilter(e.target.value)}
              className="pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="all">All Qualification</option>
              <option value="qualified">Qualified</option>
              <option value="not_qualified">Not Qualified</option>
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">
                  Name
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">
                  Email
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">
                  Phone
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">
                  Lead Type
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">
                  Source Channel
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">
                  Call Result
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">
                  Qualified
                </th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-slate-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <p className="text-slate-600 dark:text-slate-400">
                      {searchTerm || statusFilter !== 'all' || leadTypeFilter !== 'all' || qualifiedFilter !== 'all'
                        ? 'No leads match your filters'
                        : 'No leads yet. Add your first lead!'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, index) => (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-slate-900 dark:text-white">
                      {lead.name}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                      {lead.email || '-'}
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                      {lead.phone || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          lead.status === 'hot'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : lead.status === 'warm'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                            : lead.status === 'cold'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : lead.status === 'uninterested'
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
                            : lead.status === 'qualified'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : lead.status === 'unqualified'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : lead.status === 'called'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            : lead.status === 'texted'
                            ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                            : lead.status === 'interested'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : lead.status === 'not_interested'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
                        }`}
                      >
                        {getStatusIcon(lead.status)}
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          lead.lead_type === 'outbound'
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {lead.lead_type === 'outbound' ? 'Outbound' : 'Inbound'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-400">
                      {lead.source_channel
                        ? lead.source_channel
                            .split('_')
                            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                            .join(' ')
                        : '-'}
                    </td>
                    <td className="py-4 px-6">
                      {lead.call_result === 'appointment_booked' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          ✓ Appointment booked
                        </span>
                      ) : lead.call_result === 'unsuccessful' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                          ✗ Unsuccessful
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {lead.qualified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                          <XIcon className="w-3 h-3" />
                          No
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleEditClick(lead)}
                          variant="ghost"
                          size="icon"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteLead(lead.id)}
                          variant="ghost"
                          size="icon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
