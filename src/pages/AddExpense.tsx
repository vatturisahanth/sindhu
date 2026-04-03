import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, IndianRupee, FileText, Sparkles, CheckCircle2, ChevronRight, Utensils, Car, ShoppingBag, Film, HeartPulse, Zap, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { cn } from '../lib/utils';
import { categorizeExpense } from '../services/geminiService';

export default function AddExpense() {
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedCategory, setDetectedCategory] = useState<{ category: string, emoji: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleDescriptionBlur = async () => {
    if (description.length > 3 && amount > 0) {
      setIsDetecting(true);
      const result = await categorizeExpense(description, amount);
      setDetectedCategory(result);
      setIsDetecting(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      storageService.addExpense({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        amount: amount,
        description: description,
        category: detectedCategory?.category || 'Others',
        timestamp: Date.now(),
      });

      // Update category spent
      const categories = storageService.getCategories();
      const catIndex = categories.findIndex(c => c.name === (detectedCategory?.category || 'Others'));
      if (catIndex !== -1) {
        categories[catIndex].spent += amount;
        storageService.setCategories(categories);
      }

      navigate('/');
    } catch (err) {
      console.error('Failed to add expense', err);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryIcons: Record<string, any> = {
    Food: Utensils,
    Transport: Car,
    Shopping: ShoppingBag,
    Entertainment: Film,
    Health: HeartPulse,
    Utilities: Zap,
    Others: MoreHorizontal,
  };

  const Icon = detectedCategory ? categoryIcons[detectedCategory.category] || MoreHorizontal : MoreHorizontal;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Record Transaction</h1>
        <p className="text-slate-500 mt-3 text-lg font-medium">
          Intelligent AI-powered expense tracking and categorization.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="official-card p-10 md:p-12"
      >
        <form onSubmit={handleAdd} className="space-y-10">
          {/* Amount Input */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Transaction Amount</label>
            <div className="relative group">
              <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
              <input
                type="number"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
                className="w-full pl-20 pr-8 py-8 bg-slate-50 border border-slate-200 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-5xl font-extrabold text-slate-900 placeholder:text-slate-200"
              />
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Description & Context</label>
            <div className="relative group">
              <FileText className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="e.g., Starbucks Coffee, Uber to Airport..."
                className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-xl font-bold text-slate-900 placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* AI Detection Feedback */}
          <AnimatePresence mode="wait">
            {isDetecting ? (
              <motion.div
                key="detecting"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-4 text-slate-900 font-bold text-sm bg-slate-50 p-6 rounded-2xl border border-slate-100"
              >
                <Sparkles className="w-6 h-6 animate-pulse text-amber-500" />
                AI is analyzing transaction context...
              </motion.div>
            ) : detectedCategory ? (
              <motion.div
                key="detected"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm shadow-emerald-100/50"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-xl text-emerald-700 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-[0.2em] mb-1">AI Classification</p>
                    <p className="text-lg font-extrabold text-slate-900">{detectedCategory.category} {detectedCategory.emoji}</p>
                  </div>
                </div>
                <div className="bg-emerald-500 p-1.5 rounded-full text-white">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading || amount <= 0 || !description}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-6 rounded-2xl shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-6 h-6" />
                Record Transaction
              </>
            )}
          </button>
        </form>
      </motion.div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="official-card p-8 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-colors">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Recent Food</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">₹24.50</p>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl group-hover:bg-white transition-colors">
            <Utensils className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        <div className="official-card p-8 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-colors">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Recent Travel</p>
            <p className="text-2xl font-extrabold text-slate-900 tracking-tight">₹12.00</p>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl group-hover:bg-white transition-colors">
            <Car className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
