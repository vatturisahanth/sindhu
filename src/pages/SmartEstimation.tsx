import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, IndianRupee, GraduationCap, Briefcase, 
  Users, Building2, TreePine, ArrowRight, 
  CheckCircle2, PieChart, TrendingUp, Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { estimationService, LifestyleType, CityType, EstimatedBudget } from '../services/estimationService';
import { cn } from '../lib/utils';
import { CategoryBudget } from '../types';

export default function SmartEstimation() {
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState<number>(0);
  const [lifestyle, setLifestyle] = useState<LifestyleType | null>(null);
  const [cityType, setCityType] = useState<CityType | null>(null);
  const [estimation, setEstimation] = useState<EstimatedBudget | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleEstimate = () => {
    if (!income || !lifestyle || !cityType) return;
    
    setIsLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      const result = estimationService.estimateBudget({
        monthlyIncome: income,
        lifestyle,
        cityType
      });
      setEstimation(result);
      setStep(2);
      setIsLoading(false);
    }, 1500);
  };

  const handleApplyBudget = () => {
    if (!user || !estimation) return;

    // Save profile
    storageService.setUserProfile({
      uid: user.uid,
      email: user.email || '',
      monthlyIncome: income,
      savingsGoal: estimation.savings,
      currency: '₹',
      createdAt: Date.now(),
    });

    // Save categories
    const categoryBudgets: CategoryBudget[] = estimation.categories.map(cat => ({
      id: cat.name.toLowerCase(),
      userId: user.uid,
      name: cat.name,
      limit: cat.amount,
      spent: 0,
      color: cat.name === 'Food' ? 'bg-orange-500' : cat.name === 'Transport' ? 'bg-blue-500' : 'bg-slate-500',
    }));
    storageService.setCategories(categoryBudgets);

    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-[0.2em]">Smart Estimation Engine</span>
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">
          Personalized Financial Behavior Analyzer
        </h1>
        <p className="text-slate-500 mt-3 text-lg font-medium max-w-2xl">
          No transaction data? No problem. Our AI estimates your ideal budget based on your lifestyle and environment.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
          >
            <div className="official-card p-10 space-y-10">
              {/* Income Input */}
              <div className="space-y-6">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Monthly Income Range</label>
                <div className="relative group">
                  <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
                  <input
                    type="number"
                    value={income || ''}
                    onChange={(e) => setIncome(Number(e.target.value))}
                    placeholder="e.g., 50000"
                    className="w-full pl-12 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-3xl font-extrabold text-slate-900 placeholder:text-slate-200"
                  />
                </div>
              </div>

              {/* Lifestyle Selection */}
              <div className="space-y-6">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Lifestyle Type</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'student', label: 'Student', icon: GraduationCap },
                    { id: 'professional', label: 'Professional', icon: Briefcase },
                    { id: 'family', label: 'Family', icon: Users },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setLifestyle(item.id as LifestyleType)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-300",
                        lifestyle === item.id 
                          ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
                      )}
                    >
                      <item.icon className="w-8 h-8" />
                      <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* City Type Selection */}
              <div className="space-y-6">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Environment (Optional)</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'urban', label: 'Urban City', icon: Building2 },
                    { id: 'rural', label: 'Rural Area', icon: TreePine },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCityType(item.id as CityType)}
                      className={cn(
                        "flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300",
                        cityType === item.id 
                          ? "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200" 
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600"
                      )}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleEstimate}
                disabled={isLoading || !income || !lifestyle || !cityType}
                className="w-full official-button-primary py-5 text-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Smart Estimation
                  </>
                )}
              </button>
            </div>

            <div className="hidden lg:block space-y-8">
              <div className="official-card p-8 bg-indigo-600 text-white shadow-2xl shadow-indigo-100">
                <h3 className="text-xl font-extrabold mb-4">Why Smart Estimation?</h3>
                <p className="text-indigo-100 leading-relaxed font-medium">
                  Our engine uses financial behavior patterns from thousands of similar profiles to predict your spending. 
                  This gives you a head start in your financial journey before you even record your first expense.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    "Aligned with Viksit Bharat 2047 goals",
                    "AI-driven category distribution",
                    "Personalized savings targets",
                    "Instant financial awareness"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm font-bold">
                      <CheckCircle2 className="w-5 h-5 text-indigo-300" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                <div className="official-card p-10">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-lg shadow-slate-200">
                        <PieChart className="w-5 h-5" />
                      </div>
                      <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Estimated Distribution</h2>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {estimation?.categories.map((cat) => (
                      <div key={cat.name} className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700 text-lg">{cat.name}</span>
                          <div className="text-right">
                            <p className="text-sm font-extrabold text-slate-900">₹{cat.amount.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat.percentage}% of income</p>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.percentage}%` }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="h-full bg-slate-900 rounded-full shadow-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="official-card p-10 bg-slate-50 border-dashed border-2">
                  <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    AI Insights & Suggestions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {estimation?.insights.map((insight, i) => (
                      <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-slate-600 font-medium leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="official-card p-10 bg-emerald-600 text-white shadow-2xl shadow-emerald-100">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">Estimated Savings</p>
                  <div className="text-5xl font-extrabold tracking-tight mb-4">₹{estimation?.savings.toLocaleString()}</div>
                  <div className="flex items-center gap-2 text-emerald-100 font-bold text-sm mb-10">
                    <TrendingUp className="w-4 h-4" />
                    <span>{estimation?.savingsPercentage}% Savings Rate</span>
                  </div>
                  
                  <div className="space-y-4 mb-10">
                    <div className="flex justify-between items-center text-sm">
                      <span className="opacity-60 font-medium">Total Spending</span>
                      <span className="font-bold">₹{estimation?.totalSpending.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-px bg-white/10 my-4"></div>
                    <p className="text-xs font-medium opacity-80 leading-relaxed italic">
                      "You should spend up to ₹{estimation?.categories[0].amount.toLocaleString()} on {estimation?.categories[0].name} to maintain your savings goal."
                    </p>
                  </div>

                  <button
                    onClick={handleApplyBudget}
                    className="w-full bg-white text-emerald-600 font-extrabold py-5 rounded-2xl shadow-xl hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    <Save className="w-5 h-5" />
                    Apply This Plan
                  </button>
                  
                  <button
                    onClick={() => setStep(1)}
                    className="w-full mt-4 text-emerald-100 font-bold text-sm hover:text-white transition-colors"
                  >
                    Recalculate Estimation
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
