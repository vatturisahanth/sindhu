import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Save, IndianRupee, Target, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { estimationService } from '../services/estimationService';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';

export default function BudgetSetup() {
  const [income, setIncome] = useState<number>(0);
  const [savingsGoal, setSavingsGoal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const currentProfile = storageService.getUserProfile(user.uid);
    if (currentProfile) {
      setProfile(currentProfile);
      setIncome(currentProfile.monthlyIncome);
      setSavingsGoal(currentProfile.savingsGoal);
      
      // Get initial insights
      const estimation = estimationService.estimateBudget({
        monthlyIncome: currentProfile.monthlyIncome,
        lifestyle: currentProfile.lifestyle || 'professional',
        cityType: currentProfile.cityType || 'urban'
      });
      setInsights(estimation.insights);
    }
  }, [user]);

  const availableSpending: number = income - savingsGoal;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      storageService.setUserProfile(user.uid, {
        uid: user.uid,
        email: user.email || '',
        displayName: profile?.displayName || '',
        profession: profile?.profession || '',
        lifestyle: profile?.lifestyle,
        cityType: profile?.cityType,
        monthlyIncome: income,
        savingsGoal: savingsGoal,
        currency: '₹',
        createdAt: profile?.createdAt || Date.now(),
      });

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
            </div>

            <button
              onClick={handleSave}
              disabled={isLoading || availableSpending < 0}
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
            
            {availableSpending < 0 && (
              <p className="text-rose-400 text-[10px] font-bold uppercase tracking-widest text-center mt-4">
                Savings goal exceeds income
              </p>
            )}

            {insights.length > 0 && (
              <div className="mt-10 pt-10 border-t border-white/10 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  AI Strategy Insights
                </p>
                <div className="space-y-3">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 text-xs font-medium text-slate-300 leading-relaxed">
                      <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
