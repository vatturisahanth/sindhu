import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Briefcase, IndianRupee, ArrowRight, Sparkles, Wallet, GraduationCap, Users, Building2, TreePine } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { estimationService } from '../services/estimationService';
import { cn } from '../lib/utils';
import { CategoryBudget } from '../types';

export default function Onboarding() {
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [lifestyle, setLifestyle] = useState<'student' | 'professional' | 'family'>('professional');
  const [cityType, setCityType] = useState<'urban' | 'rural'>('urban');
  const [income, setIncome] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const estimation = estimationService.estimateBudget({
        monthlyIncome: income,
        lifestyle,
        cityType
      });

      storageService.setUserProfile(user.uid, {
        uid: user.uid,
        email: user.email || '',
        displayName: name,
        profession: profession,
        lifestyle: lifestyle,
        cityType: cityType,
        monthlyIncome: income,
        savingsGoal: estimation.savings,
        currency: '₹',
        createdAt: Date.now(),
      });

      // Initialize default categories based on AI estimation
      const defaultCategories: CategoryBudget[] = estimation.categories.map(cat => {
        let color = 'bg-slate-600';
        if (cat.name === 'Food') color = 'bg-orange-600';
        else if (cat.name === 'Transport') color = 'bg-blue-600';
        else if (cat.name === 'Shopping') color = 'bg-purple-600';
        else if (cat.name === 'Education') color = 'bg-indigo-600';
        else if (cat.name === 'Bills') color = 'bg-rose-600';
        else if (cat.name === 'Entertainment') color = 'bg-pink-600';
        else if (cat.name === 'Health') color = 'bg-emerald-600';
        else if (cat.name === 'Savings') color = 'bg-teal-600';
        else if (cat.name === 'Recharge') color = 'bg-sky-600';

        return {
          id: cat.name.toLowerCase().replace(/\s+/g, '-'),
          userId: user.uid,
          name: cat.name,
          limit: cat.amount,
          spent: 0,
          color,
        };
      });

      storageService.setCategories(user.uid, defaultCategories);

      navigate('/');
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl p-10 md:p-16 border border-slate-100 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl -mr-32 -mt-32 rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 blur-3xl -ml-24 -mb-24 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="bg-slate-900 p-3 rounded-2xl shadow-xl shadow-slate-200">
              <Wallet className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">Welcome to Arthmitra</h1>
              <p className="text-slate-500 font-medium">Let's personalize your financial intelligence experience.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Name */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Profession */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Profession</label>
                <div className="relative group">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                  <input
                    type="text"
                    required
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    placeholder="Software Engineer"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Lifestyle Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Your Lifestyle</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'student', label: 'Student', icon: GraduationCap },
                  { id: 'professional', label: 'Working', icon: Briefcase },
                  { id: 'family', label: 'Family', icon: Users },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLifestyle(item.id as any)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
                      lifestyle === item.id 
                        ? "bg-indigo-50 border-indigo-600 text-indigo-900" 
                        : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* City Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Environment</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'urban', label: 'Urban (City)', icon: Building2 },
                  { id: 'rural', label: 'Rural (Village)', icon: TreePine },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCityType(item.id as any)}
                    className={cn(
                      "flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all",
                      cityType === item.id 
                        ? "bg-indigo-50 border-indigo-600 text-indigo-900" 
                        : "bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Income */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Estimated Monthly Income</label>
              <div className="relative group">
                <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                <input
                  type="number"
                  required
                  value={income || ''}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-4xl font-extrabold text-slate-900 placeholder:text-slate-200"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 rounded-[2rem] shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-10 flex items-center justify-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <p className="text-xs font-bold uppercase tracking-widest">AI-Powered Financial Intelligence</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
