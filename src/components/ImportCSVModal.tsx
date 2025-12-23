import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { supabase } from '../lib/supabase';

interface ImportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  userId: string;
}

interface ParsedLead {
  name: string;
  email?: string;
  phone?: string;
  status: 'hot' | 'warm' | 'cold' | 'uninterested';
}

export default function ImportCSVModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  userId,
}: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [parseError, setParseError] = useState('');

  if (!isOpen) return null;

  const parseCSV = (text: string): ParsedLead[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIndex = headers.findIndex((h) => h.includes('name'));
    const emailIndex = headers.findIndex((h) => h.includes('email'));
    const phoneIndex = headers.findIndex((h) => h.includes('phone'));
    const statusIndex = headers.findIndex((h) => h.includes('status'));

    if (nameIndex === -1) {
      throw new Error('CSV must have a "name" column');
    }

    const leads: ParsedLead[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());

      if (values.length < headers.length) continue;

      const name = values[nameIndex];
      if (!name) continue;

      const status = statusIndex !== -1 ? values[statusIndex].toLowerCase() : 'cold';
      const validStatus =
        status === 'hot' || status === 'warm' || status === 'cold' || status === 'uninterested'
          ? status
          : 'cold';

      leads.push({
        name,
        email: emailIndex !== -1 ? values[emailIndex] : undefined,
        phone: phoneIndex !== -1 ? values[phoneIndex] : undefined,
        status: validStatus,
      });
    }

    return leads;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError('');

    try {
      const text = await selectedFile.text();
      const parsedLeads = parseCSV(text);
      setPreview(parsedLeads.slice(0, 5));
    } catch (error: any) {
      setParseError(error.message);
      setPreview([]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      onError('Please select a file');
      return;
    }

    setLoading(true);

    try {
      // Vérifier que l'utilisateur existe vraiment dans auth.users
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to import leads');
      }

      const text = await file.text();
      const parsedLeads = parseCSV(text);

      const leadsToInsert = parsedLeads.map((lead) => ({
        user_id: user.id,
        name: lead.name,
        email: lead.email || null,
        phone: lead.phone || null,
        status: lead.status,
        lead_type: 'outbound',
        source_channel: 'cold_call',
      }));

      const { error } = await supabase.from('leads').insert(leadsToInsert);

      if (error) throw error;

      onSuccess(`Successfully imported ${parsedLeads.length} leads`);
      handleClose();
    } catch (error: any) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setParseError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Import CSV</h2>
          <Button onClick={handleClose} variant="ghost" size="icon">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">CSV Format Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Must include a "name" column (required)</li>
                  <li>Optional columns: "email", "phone", "status"</li>
                  <li>Valid statuses: hot, warm, cold, uninterested</li>
                  <li>Imports default to outbound / cold_call unless columns are provided</li>
                  <li>Example: name,email,phone,status</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="csv-file"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {file ? (
                    <span className="font-medium text-blue-600 dark:text-blue-400">
                      {file.name}
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">CSV files only</p>
              </div>
              <input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {parseError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{parseError}</p>
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                Preview (first 5 rows)
              </h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="text-left py-2 px-3 text-slate-900 dark:text-white">Name</th>
                      <th className="text-left py-2 px-3 text-slate-900 dark:text-white">Email</th>
                      <th className="text-left py-2 px-3 text-slate-900 dark:text-white">Phone</th>
                      <th className="text-left py-2 px-3 text-slate-900 dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((lead, index) => (
                      <tr
                        key={index}
                        className="border-t border-slate-200 dark:border-slate-700"
                      >
                        <td className="py-2 px-3 text-slate-900 dark:text-white">{lead.name}</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                          {lead.email || '-'}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                          {lead.phone || '-'}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" onClick={handleClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={loading || !file || parseError !== ''}
              className="flex-1"
            >
              {loading ? 'Importing...' : 'Import Leads'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
