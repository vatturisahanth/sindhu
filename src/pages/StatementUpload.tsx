import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { pdfService } from '../services/pdfService';
import { parseBankStatement } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { cn } from '../lib/utils';

export default function StatementUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF bank statement.');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setIsProcessing(true);
    setProgress(10);
    setStatus('Extracting text from PDF...');
    setError(null);

    try {
      // 1. Extract text from PDF
      const text = await pdfService.extractText(file);
      setProgress(40);
      setStatus('AI analyzing transactions...');

      // 2. Parse with Gemini
      const transactions = await parseBankStatement(text);
      setProgress(80);
      setStatus('Categorizing expenses...');

      if (transactions && transactions.length > 0) {
        setResults(transactions);
        setProgress(100);
        setStatus('Analysis complete!');
      } else {
        setError('No transactions could be identified in the statement.');
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process the statement. Please try again or use a different file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmImport = () => {
    if (!results || !user) return;

    results.forEach(tx => {
      storageService.addExpense(user.uid, {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        amount: tx.amount,
        description: tx.description,
        category: tx.category,
        timestamp: tx.timestamp || Date.now(),
      });
    });

    // Update category budgets
    const categories = storageService.getCategories(user.uid);
    results.forEach(tx => {
      const catIndex = categories.findIndex(c => c.name === tx.category);
      if (catIndex !== -1) {
        categories[catIndex].spent += tx.amount;
      }
    });
    storageService.setCategories(user.uid, categories);

    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">
          Statement <span className="text-slate-400 font-medium">Intelligence</span>
        </h1>
        <p className="text-slate-500 mt-3 text-lg font-medium">
          Upload your bank statement PDF and let Arthmitra AI automatically extract and categorize your expenses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="official-card p-10 border-2 border-dashed border-slate-200 hover:border-slate-900 transition-all group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-slate-50 p-6 rounded-3xl mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Bank Statement</h3>
              <p className="text-slate-500 text-sm mb-8 max-w-xs">
                Supports standard PDF statements from most major banks. Your data is processed securely.
              </p>
              
              <label className="official-button-primary py-3 px-8 cursor-pointer">
                {file ? file.name : 'Select PDF File'}
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </label>
              
              {file && !isProcessing && !results && (
                <button 
                  onClick={handleUpload}
                  className="mt-4 text-slate-900 font-bold text-sm flex items-center gap-2 hover:underline"
                >
                  Start AI Analysis <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>

          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="official-card p-10 bg-slate-900 text-white"
              >
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                    <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-end">
                      <h3 className="text-lg font-bold">{status}</h3>
                      <span className="text-xs font-bold text-slate-400">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-amber-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4"
              >
                <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                <p className="text-rose-800 font-medium">{error}</p>
              </motion.div>
            )}

            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="official-card p-10 space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Analysis Complete</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Found {results.length} transactions</p>
                    </div>
                  </div>
                  <button 
                    onClick={confirmImport}
                    className="official-button-primary py-2.5 px-6 text-xs"
                  >
                    Import All
                  </button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {results.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-100">
                          <FileText className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{tx.description}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.category}</p>
                        </div>
                      </div>
                      <p className="font-extrabold text-slate-900">₹{tx.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900">Privacy First</h3>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Arthmitra processes your statements locally in your browser. Only extracted text is sent to the AI for categorization. Your actual PDF file never leaves your device.
            </p>
          </div>

          <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-100">
            <Sparkles className="w-8 h-8 mb-4 text-amber-400" />
            <h3 className="text-lg font-bold mb-2">Smart Extraction</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Our AI can identify transaction dates, merchants, and amounts even from complex bank layouts. It automatically filters out transfers and deposits to focus on your spending.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
