import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Phone, Tag, Globe, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { supabase, Lead, LeadStatus } from '../lib/supabase';
import { formatPhoneNumber } from '../lib/utils';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  userId: string;
  editLead?: Lead | null;
}

export default function AddLeadModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  userId,
  editLead,
}: AddLeadModalProps) {
  const [formData, setFormData] = useState({
    name: editLead?.name || '',
    email: editLead?.email || '',
    phone: editLead?.phone || '',
    status: editLead?.status || 'cold',
    leadType: editLead?.lead_type || 'outbound',
    sourceChannel:
      editLead?.source_channel || (editLead?.lead_type === 'inbound' ? 'inbound_call' : 'cold_call'),
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formattedPhone = formData.phone ? formatPhoneNumber(formData.phone) : null;

      if (editLead) {
        const { error } = await supabase
          .from('leads')
          .update({
            name: formData.name,
            email: formData.email || null,
            phone: formattedPhone,
            status: formData.status as LeadStatus,
            lead_type: formData.leadType as 'inbound' | 'outbound',
            source_channel: formData.sourceChannel || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editLead.id);

        if (error) throw error;
        onSuccess('Lead updated successfully');
      } else {
        const { error } = await supabase.from('leads').insert({
          user_id: userId,
          name: formData.name,
          email: formData.email || null,
          phone: formattedPhone,
          status: formData.status as LeadStatus,
          lead_type: formData.leadType as 'inbound' | 'outbound',
          source_channel: formData.sourceChannel || null,
          call_result: null,
        });

        if (error) throw error;
        onSuccess('Lead added successfully');
      }

      onClose();
      setFormData({
        name: '',
        email: '',
        phone: '',
        status: 'cold',
        leadType: 'outbound',
        sourceChannel: 'cold_call',
      });
    } catch (error: any) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      status: 'cold',
      leadType: 'outbound',
      sourceChannel: 'cold_call',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {editLead ? 'Edit Lead' : 'Add New Lead'}
          </h2>
          <Button onClick={handleClose} variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Lead Type
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={formData.leadType}
                onChange={(e) => {
                  const value = e.target.value as 'inbound' | 'outbound';
                  setFormData((prev) => ({
                    ...prev,
                    leadType: value,
                    sourceChannel:
                      value === 'inbound' && prev.sourceChannel === 'cold_call'
                        ? 'inbound_call'
                        : value === 'outbound' && prev.sourceChannel === 'inbound_call'
                        ? 'cold_call'
                        : prev.sourceChannel,
                  }));
                }}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Source Channel
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={formData.sourceChannel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sourceChannel: e.target.value as
                      | 'cold_call'
                      | 'inbound_call'
                      | 'web_form'
                      | 'email_campaign'
                      | 'manual'
                      | 'other',
                  })
                }
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="cold_call">Cold Call</option>
                <option value="inbound_call">Inbound Call</option>
                <option value="web_form">Web Form</option>
                <option value="email_campaign">Email Campaign</option>
                <option value="manual">Manual</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="uninterested">Uninterested</option>
                <option value="qualified">Qualified</option>
                <option value="unqualified">Unqualified</option>
                <option value="called">Called</option>
                <option value="texted">Texted</option>
                <option value="interested">Interested</option>
                <option value="not_interested">Not Interested</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Saving...' : editLead ? 'Update Lead' : 'Add Lead'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
