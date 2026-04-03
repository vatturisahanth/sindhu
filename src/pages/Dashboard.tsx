import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, Wallet, AlertCircle, 
  Lightbulb, CheckCircle2, X, ArrowRight,
  Utensils, Car, MoreHorizontal, ShoppingBag, 
  Film, HeartPulse, Zap, MessageSquare, Send,
  Activity, Sparkles, PieChart, PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { analysisService } from '../services/analysisService';
import { UserProfile, CategoryBudget, Expense, AIAlert, Goal } from '../types';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import { parseQuickExpense } from '../services/geminiService';

const categoryIcons = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Health: HeartPulse,
  Utilities: Zap,
  Others: MoreHorizontal,
};

const categoryColors = {
  Food: 'bg-orange-500',
  Transport: 'bg-blue-500',
  Shopping: 'bg-purple-500',
  Entertainment: 'bg-pink-500',
  Health: 'bg-rose-500',
  Utilities: 'bg-amber-500',
  Others: 'bg-slate-500',
};

const categoryBgs = {
  Food: 'bg-orange-50',
  Transport: 'bg-blue-50',
  Shopping: 'bg-purple-50',
  Entertainment: 'bg-pink-50',
  Health: 'bg-rose-50',
  Utilities: 'bg-amber-50',
  Others: 'bg-slate-50',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<CategoryBudget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showReminder, setShowReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', targetAmount: '', deadline: '' });

  // AI Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quick Add State
  const [quickInput, setQuickInput] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const handleSmartQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || !user) return;

    setIsQuickAdding(true);
    try {
      const parsed = await parseQuickExpense(quickInput);
      if (parsed.amount > 0) {
        const newExpense: Expense = {
          id: Math.random().toString(36).substr(2, 9),
          userId: user.uid,
          amount: parsed.amount,
          category: parsed.category,
          description: parsed.description,
          timestamp: Date.now(),
        };
        storageService.addExpense(newExpense);
        setExpenses(prev => [newExpense, ...prev]);
        setQuickInput('');
        
        // Refresh categories to update progress bars
        setCategories(storageService.getCategories());
      }
    } catch (err) {
      console.error('Quick add error:', err);
    } finally {
      setIsQuickAdding(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const currentProfile = storageService.getUserProfile();
    const currentCategories = storageService.getCategories();
    const currentExpenses = storageService.getExpenses();
    const currentGoals = storageService.getGoals();
    
    setProfile(currentProfile);
    setCategories(currentCategories);
    setExpenses(currentExpenses);
    setGoals(currentGoals);

    // Generate dynamic alerts and suggestions
    const anomalies = analysisService.detectAnomalies(currentExpenses);
    const suggestions = analysisService.generateSuggestions(currentExpenses, currentCategories);
    const forecast = analysisService.forecastSpending(currentExpenses, currentProfile?.monthlyIncome || 0);
    
    const dynamicAlerts: AIAlert[] = [...anomalies, ...suggestions];
    
    // Add goal-based alerts
    currentGoals.forEach(goal => {
      const analysis = analysisService.analyzeGoal(goal, currentProfile, currentExpenses);
      if (!analysis.achievable) {
        dynamicAlerts.push({
          id: `goal-alert-${goal.id}`,
          userId: user.uid,
          message: `🎯 Goal "${goal.title}": ${analysis.suggestions[0]}`,
          type: 'warning',
          timestamp: Date.now()
        });
      }
    });

    if (forecast.willExceed) {
      dynamicAlerts.unshift({
        id: 'forecast-alert',
        userId: user.uid,
        message: `⚠️ You're predicted to spend ₹${forecast.predicted} this month, exceeding your ₹${currentProfile?.monthlyIncome} budget.`,
        type: 'warning',
        timestamp: Date.now()
      });
    }
    
    setAlerts(dynamicAlerts);
    setIsLoading(false);
  }, [user]);

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const budget = profile?.monthlyIncome || 0;
  const balance = budget - totalSpent;
  const healthScore = analysisService.calculateFinancialHealthScore(expenses, profile);

  // Calculate streak (days with at least one expense or just consecutive days active)
  const streak = 12; // Mock for now

  useEffect(() => {
    const timer = setTimeout(() => setShowReminder(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleQuickAdd = async (category: string) => {
    if (!user) return;
    try {
      storageService.addExpense({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.uid,
        amount: 0,
        description: `Quick ${category} entry`,
        category,
        timestamp: Date.now(),
      });
      setExpenses(storageService.getExpenses());
      setShowReminder(false);
    } catch (err) {
      console.error('Failed to quick add expense', err);
    }
  };

  const handleAddGoal = () => {
    if (!user || !newGoal.title || !newGoal.targetAmount || !newGoal.deadline) return;
    
    const goal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.uid,
      title: newGoal.title,
      targetAmount: Number(newGoal.targetAmount),
      currentAmount: 0,
      deadline: new Date(newGoal.deadline).getTime(),
      createdAt: Date.now(),
    };

    storageService.addGoal(goal);
    setGoals(prev => [goal, ...prev]);
    setIsGoalModalOpen(false);
    setNewGoal({ title: '', targetAmount: '', deadline: '' });
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isChatLoading) return;
    
    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const context = `
        You are a financial assistant for BudgetMind AI Intelligence System.
        User's current financial status:
        - Monthly Budget: ₹${budget}
        - Total Spent: ₹${totalSpent}
        - Remaining Balance: ₹${balance}
        - Financial Health Score: ${healthScore}/100
        - Recent Expenses: ${JSON.stringify(expenses.slice(0, 5))}
        - Active Goals: ${JSON.stringify(goals.map(g => ({ title: g.title, target: g.targetAmount, deadline: new Date(g.deadline).toLocaleDateString() })))}
        
        If the user mentions a new goal (like building a house or buying a bike), analyze their budget and provide a step-by-step plan.
        If their current savings are insufficient, suggest:
        1. Increasing savings by reducing specific category expenses.
        2. Extending the timeline.
        3. Considering a loan.
        4. Smart allocation of current funds.
        
        Provide short, helpful, and actionable advice.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: context + "\n\nUser: " + userMsg }] }
        ],
      });

      setChatHistory(prev => [...prev, { role: 'model', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const categoriesWithIcons = categories.map(cat => ({
    ...cat,
    icon: (categoryIcons as any)[cat.name] || MoreHorizontal,
    color: (categoryColors as any)[cat.name] || 'bg-slate-500',
    bg: (categoryBgs as any)[cat.name] || 'bg-slate-50'
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {!profile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="official-card p-10 bg-slate-900 text-white overflow-hidden relative"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-400 p-2 rounded-xl text-slate-900 shadow-lg shadow-amber-400/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">New Feature</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-4 max-w-xl">
              Don't have transaction data? Try our Smart Estimation Engine.
            </h2>
            <p className="text-slate-400 text-lg font-medium mb-8 max-w-2xl">
              Get an AI-driven budget plan in seconds based on your lifestyle and environment. 
              Perfect for new users to start their financial journey.
            </p>
            <button
              onClick={() => navigate('/smart-estimation')}
              className="bg-white text-slate-900 font-extrabold py-4 px-8 rounded-2xl shadow-xl hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
            >
              <Sparkles className="w-5 h-5 text-amber-500" />
              Start Smart Estimation
            </button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 blur-3xl -mr-32 -mt-32 rounded-full" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 blur-3xl -ml-24 -mb-24 rounded-full" />
        </motion.div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">
            BudgetMind <span className="text-slate-400 font-medium">Intelligence</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg">Welcome back, {user?.email?.split('@')[0]}. Here's your financial analysis.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/add-expense')}
            className="official-button-primary flex items-center gap-2.5"
          >
            <PlusCircle className="w-5 h-5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* AI Quick Add Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="official-card p-6 bg-white border-2 border-indigo-50 shadow-xl shadow-indigo-50/50"
      >
        <form onSubmit={handleSmartQuickAdd} className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 bg-indigo-50 p-1.5 rounded-lg text-indigo-600 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all">
              <Sparkles className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder='Try typing "Biryani 200" or "Petrol 500"...'
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all text-lg font-medium text-slate-900 placeholder:text-slate-300"
            />
          </div>
          <button
            type="submit"
            disabled={isQuickAdding || !quickInput.trim()}
            className="w-full md:w-auto official-button-primary py-4 px-10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isQuickAdding ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                Quick Add
              </>
            )}
          </button>
        </form>
        <p className="mt-3 text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          AI will automatically detect category and amount
        </p>
      </motion.div>

      {/* Health & Streak Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="official-card p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-4 rounded-2xl shadow-sm",
              healthScore > 80 ? "bg-emerald-50 text-emerald-600" : 
              healthScore > 50 ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
            )}>
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Financial Health Score</p>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-3xl font-extrabold tracking-tight",
                  healthScore > 80 ? "text-emerald-600" : 
                  healthScore > 50 ? "text-amber-600" : "text-rose-600"
                )}>{healthScore}</span>
                <span className="text-slate-400 font-bold text-sm">/ 100</span>
              </div>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Status</p>
            <p className={cn(
              "text-sm font-bold",
              healthScore > 80 ? "text-emerald-600" : 
              healthScore > 50 ? "text-amber-600" : "text-rose-600"
            )}>
              {healthScore > 80 ? "Excellent" : healthScore > 50 ? "Good" : "Needs Attention"}
            </p>
          </div>
        </div>

        <div className="official-card p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-orange-50 text-orange-600 p-4 rounded-2xl shadow-sm">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Savings Streak</p>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{streak} Days 🔥</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Next Milestone</p>
            <p className="text-sm font-bold text-slate-900">{Math.ceil((streak + 1) / 7) * 7} Days</p>
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Monthly Budget', value: budget, icon: Wallet, color: 'text-slate-900', bg: 'bg-slate-100' },
          { label: 'Total Spent', value: totalSpent, icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Remaining Balance', value: balance, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="official-card p-8 group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={cn(stat.bg, stat.color, "p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300")}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2.5 py-1.5 rounded-full tracking-wider uppercase">
                <TrendingUp className="w-3 h-3" />
                <span>+2.4%</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className={cn("text-3xl font-extrabold tracking-tight", stat.color)}>₹{stat.value.toLocaleString()}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Category Breakdown */}
        <div className="lg:col-span-2 space-y-10">
          <div className="official-card p-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-lg shadow-slate-200">
                  <PieChart className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Spending Breakdown</h2>
              </div>
              <button 
                onClick={() => navigate('/reports')}
                className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                Full Analytics
              </button>
            </div>
            
            <div className="space-y-10">
              {categoriesWithIcons.map((cat) => {
                const percent = Math.min((cat.spent / cat.limit) * 100, 100);
                const isOver = cat.spent > cat.limit;
                return (
                  <div key={cat.id} className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={cn(cat.bg, "p-3 rounded-xl shadow-sm")}>
                          <cat.icon className={cn("w-5 h-5", cat.color.replace('bg-', 'text-'))} />
                        </div>
                        <span className="font-bold text-slate-700 text-lg">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-slate-900">
                          <span className={cn(isOver ? "text-rose-600" : "text-slate-900")}>₹{cat.spent.toLocaleString()}</span>
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limit: ₹{cat.limit.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full shadow-sm",
                          isOver ? "bg-rose-500" : percent > 80 ? "bg-amber-500" : cat.color
                        )}
                      />
                    </div>
                  </div>
                );
              })}
              {categoriesWithIcons.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-400 font-medium italic">No categories set up yet.</p>
                  <button 
                    onClick={() => navigate('/budget-setup')}
                    className="official-button-secondary py-2 px-4 text-xs mt-4"
                  >
                    Set up your budget
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Financial Goals Section */}
          <div className="official-card p-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-lg shadow-slate-200">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Financial Goals</h2>
              </div>
              <button 
                onClick={() => setIsGoalModalOpen(true)}
                className="official-button-secondary py-2.5 px-5 text-xs"
              >
                + New Goal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {goals.map(goal => {
                const analysis = analysisService.analyzeGoal(goal, profile, expenses);
                const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                return (
                  <div key={goal.id} className="p-8 rounded-3xl border border-slate-100 bg-slate-50/50 space-y-6 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-lg">{goal.title}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Target: ₹{goal.targetAmount.toLocaleString()}</p>
                      </div>
                      <div className={cn(
                        "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        analysis.achievable ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      )}>
                        {analysis.achievable ? "On Track" : "At Risk"}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500 uppercase tracking-widest">{progress.toFixed(0)}% Complete</span>
                        <span className="text-slate-900">₹{goal.currentAmount.toLocaleString()}</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className={cn("h-full rounded-full shadow-sm", analysis.achievable ? "bg-emerald-500" : "bg-rose-500")}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
                        {analysis.suggestions[0]}
                      </p>
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && (
                <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No goals set yet. What are you saving for?</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Intelligence Hub */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Intelligence Hub
            </h2>
            
            <div className="space-y-4">
              {alerts.length === 0 && (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">System Stable</p>
                  <p className="text-xs text-slate-500 mt-1">No anomalies or risky patterns detected.</p>
                </div>
              )}
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={cn(
                    "p-4 rounded-2xl flex gap-3 border",
                    alert.type === 'warning' 
                      ? "bg-rose-50 border-rose-100 text-rose-800" 
                      : alert.type === 'suggestion'
                      ? "bg-indigo-50 border-indigo-100 text-indigo-800"
                      : "bg-blue-50 border-blue-100 text-blue-800"
                  )}
                >
                  <div className="mt-0.5">
                    {alert.type === 'warning' ? <AlertCircle className="w-5 h-5" /> : <Lightbulb className="w-5 h-5" />}
                  </div>
                  <p className="text-sm font-medium leading-relaxed">{alert.message}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-slate-400 text-sm font-medium italic">No insights yet. Add some expenses!</p>
                </div>
              )}
            </div>

            <div className="mt-8 p-6 bg-slate-900 rounded-2xl text-white relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">AI Advisor</p>
                <p className="text-sm font-medium leading-relaxed">
                  {totalSpent > budget * 0.8 
                    ? "You've used 80% of your budget. Consider cutting back on non-essentials to boost your savings."
                    : "You're doing great! You have a surplus of ₹" + balance + ". Consider investing ₹2000 in an index fund."}
                </p>
              </div>
              <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
            </div>
          </div>
        </div>
      </div>

      {/* Goal Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Set Financial Goal</h2>
                <button onClick={() => setIsGoalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Goal Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g., Build a House, Buy a Bike"
                    value={newGoal.title}
                    onChange={e => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Target Amount (₹)</label>
                    <input 
                      type="number" 
                      placeholder="5000"
                      value={newGoal.targetAmount}
                      onChange={e => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Deadline</label>
                    <input 
                      type="date" 
                      value={newGoal.deadline}
                      onChange={e => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleAddGoal}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Create Goal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Chat Assistant Floating Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-20 right-0 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[500px]"
            >
              <div className="bg-indigo-600 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-bold">SmartBudget AI Assistant</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {chatHistory.length === 0 && (
                  <div className="text-center py-10 text-slate-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium">How can I help you with your budget today?</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div key={i} className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-indigo-600 text-white ml-auto rounded-tr-none" 
                      : "bg-white text-slate-700 mr-auto rounded-tl-none border border-slate-100 shadow-sm"
                  )}>
                    {msg.text}
                  </div>
                ))}
                {isChatLoading && (
                  <div className="bg-white text-slate-700 mr-auto rounded-2xl rounded-tl-none border border-slate-100 shadow-sm p-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !chatMessage.trim()}
                  className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-indigo-600 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-all active:scale-95"
        >
          {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      </div>

      {/* Quick Entry Reminder */}
      <AnimatePresence>
        {showReminder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 md:bottom-10 right-6 md:right-10 z-[60] max-w-sm w-full"
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 overflow-hidden relative">
              <button 
                onClick={() => setShowReminder(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
 
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Did you spend today?</h3>
                  <p className="text-xs text-slate-500 font-medium">Keep your streak alive! 🔥</p>
                </div>
              </div>
 
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Food', icon: Utensils, color: 'hover:bg-orange-50 hover:text-orange-600' },
                  { label: 'Travel', icon: Car, color: 'hover:bg-blue-50 hover:text-blue-600' },
                  { label: 'None', icon: CheckCircle2, color: 'hover:bg-emerald-50 hover:text-emerald-600' },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() => btn.label === 'None' ? setShowReminder(false) : handleQuickAdd(btn.label === 'Travel' ? 'Transport' : btn.label)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-2xl border border-slate-100 text-slate-600 transition-all font-bold text-[10px]",
                      btn.color
                    )}
                  >
                    <btn.icon className="w-5 h-5" />
                    {btn.label}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => navigate('/add-expense')}
                className="w-full text-indigo-600 font-bold text-xs py-2 hover:underline"
              >
                Add manual entry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
