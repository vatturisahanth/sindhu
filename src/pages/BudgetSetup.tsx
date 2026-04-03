import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Save, IndianRupee, Target, Utensils, Car, MoreHorizontal, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { UserProfile, CategoryBudget, Expense, AIAlert } from '../types';
import { cn } from '../lib/utils';

export default function BudgetSetup() {
  const [income, setIncome] = useState<number>(0);
  const [savingsGoal, setSavingsGoal] = useState<number>(0);
  const [categories, setCategories] = useState({
    Food: 0,
    Transport: 0,
    Others: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const profile = storageService.getUserProfile();
    if (profile) {
      setIncome(profile.monthlyIncome);
      setSavingsGoal(profile.savingsGoal);
    }
    const storedCategories = storageService.getCategories();
    if (storedCategories.length > 0) {
      const catMap = { Food: 0, Transport: 0, Others: 0 };
      storedCategories.forEach(c => {
        if (c.name in catMap) catMap[c.name as keyof typeof catMap] = c.limit;
      });
      setCategories(catMap);
    }
  }, []);

  const availableSpending: number = income - savingsGoal;
  const totalAllocated: number = (Object.values(categories) as number[]).reduce((a: number, b: number) => a + b, 0);
  const remainingToAllocate: number = availableSpending - totalAllocated;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      storageService.setUserProfile({
        uid: user.uid,
        email: user.email || '',
        monthlyIncome: income,
        savingsGoal: savingsGoal,
        currency: '₹',
        createdAt: Date.now(),
      });

      const categoryBudgets: CategoryBudget[] = Object.entries(categories).map(([name, limit]) => ({
        id: name.toLowerCase(),
        userId: user.uid,
        name,
        limit: limit as number,
        spent: 0,
        color: name === 'Food' ? 'bg-orange-500' : name === 'Transport' ? 'bg-blue-500' : 'bg-slate-500',
      }));
      storageService.setCategories(categoryBudgets);

      navigate('/');
    } catch (err) {
      console.error('Failed to save budget', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Budget Strategy</h1>
          <p className="text-slate-500 mt-3 text-lg font-medium">
            Define your financial parameters to generate a personalized AI-driven budget plan.
          </p>
        </div>
        <button
          onClick={() => navigate('/smart-estimation')}
          className="official-button-secondary flex items-center gap-2 py-3 px-6 text-sm"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          Smart Estimation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Main Financials */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="official-card p-10 space-y-8"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-3 rounded-xl text-white shadow-lg shadow-slate-200">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Monthly Income</h2>
              </div>
              
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl group-focus-within:text-slate-900 transition-colors">₹</span>
                <input
                  type="number"
                  value={income || ''}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-3xl font-extrabold text-slate-900 placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 p-3 rounded-xl text-white shadow-lg shadow-slate-200">
                  <Target className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Savings Target</h2>
              </div>
              
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl group-focus-within:text-slate-900 transition-colors">₹</span>
                <input
                  type="number"
                  value={savingsGoal || ''}
                  onChange={(e) => setSavingsGoal(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-3xl font-extrabold text-slate-900 placeholder:text-slate-300"
                />
              </div>
            </div>
          </motion.div>

          {/* Category Budgets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="official-card p-10 space-y-8"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-slate-900 p-3 rounded-xl text-white shadow-lg shadow-slate-200">
                <Utensils className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Category Allocation</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { name: 'Food', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-100' },
                { name: 'Transport', icon: Car, color: 'text-blue-600', bg: 'bg-blue-100' },
                { name: 'Others', icon: MoreHorizontal, color: 'text-slate-600', bg: 'bg-slate-100' },
              ].map((cat) => (
                <div key={cat.name} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(cat.bg, cat.color, "p-2 rounded-lg")}>
                      <cat.icon className="w-4 h-4" />
                    </div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cat.name}</label>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-slate-900 transition-colors">₹</span>
                    <input
                      type="number"
                      value={categories[cat.name as keyof typeof categories] || ''}
                      onChange={(e) => setCategories({ ...categories, [cat.name]: Number(e.target.value) })}
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-bold text-lg text-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Summary Card */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 text-white sticky top-10"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Available Spending</p>
            <div className="text-5xl font-extrabold tracking-tight mb-10">₹{availableSpending.toLocaleString()}</div>
            
            <div className="space-y-5 mb-10">
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-60 font-medium">Monthly Income</span>
                <span className="font-bold">₹{income.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="opacity-60 font-medium">Savings Goal</span>
                <span className="font-bold text-rose-400">-₹{savingsGoal.toLocaleString()}</span>
              </div>
              <div className="w-full h-px bg-white/10 my-4"></div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Unallocated</span>
                <span className={cn("text-xl font-extrabold tracking-tight", remainingToAllocate < 0 ? "text-rose-400" : "text-emerald-400")}>
                  ₹{remainingToAllocate.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isLoading || remainingToAllocate < 0}
              className="w-full bg-white text-slate-900 font-extrabold py-5 rounded-2xl shadow-xl hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Finalize Budget
                </>
              )}
            </button>
            
            {remainingToAllocate < 0 && (
              <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest text-center mt-4">
                Allocation exceeds available spending
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
