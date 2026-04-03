import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  PieChart as PieChartIcon, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Download,
  ChevronRight,
  PartyPopper,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { storageService } from '../services/storageService';
import { Expense, UserProfile } from '../types';
import { cn } from '../lib/utils';

const categoryColors = {
  Food: '#f97316',
  Transport: '#3b82f6',
  Shopping: '#a855f7',
  Entertainment: '#ec4899',
  Health: '#ef4444',
  Utilities: '#f59e0b',
  Others: '#64748b',
};

export default function Reports() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    setProfile(storageService.getUserProfile());
    setExpenses(storageService.getExpenses());
    setIsLoading(false);
  }, [user]);

  // Process data for charts
  const categoryTotals = expenses.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value,
    color: (categoryColors as any)[name] || '#64748b'
  }));

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyIncome = profile?.monthlyIncome || 0;
  const totalSaved = monthlyIncome - totalSpent;
  const isOverBudget = totalSpent > monthlyIncome;
  const isNearBudget = totalSpent > monthlyIncome * 0.8 && !isOverBudget;

  const monthlyData = [
    { month: 'Jan', spent: 2800, saved: 1200 },
    { month: 'Feb', spent: 3200, saved: 800 },
    { month: 'Mar', spent: 2500, saved: 1500 },
    { month: 'Apr', spent: totalSpent, saved: Math.max(0, totalSaved) },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Financial Reports</h1>
          <p className="text-slate-500 mt-1">Show monthly summary and visual insights.</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Dynamic Status Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative",
          isOverBudget ? "bg-rose-600 shadow-rose-100 text-white" : 
          isNearBudget ? "bg-amber-500 shadow-amber-100 text-white" :
          "bg-emerald-600 shadow-emerald-100 text-white"
        )}
      >
        <div className="relative z-10 space-y-2 text-center md:text-left">
          <h2 className="text-2xl font-extrabold flex items-center justify-center md:justify-start gap-3 tracking-tight">
            {isOverBudget ? (
              <>Critical Alert! <ShieldAlert className="w-8 h-8 animate-pulse" /></>
            ) : isNearBudget ? (
              <>Budget Warning! <AlertTriangle className="w-8 h-8" /></>
            ) : (
              <>Great job this month! <PartyPopper className="w-8 h-8" /></>
            )}
          </h2>
          <p className={cn(
            "font-medium",
            isOverBudget ? "text-rose-100" : isNearBudget ? "text-amber-50" : "text-emerald-100"
          )}>
            {isOverBudget ? (
              <>You have exceeded your monthly budget by <span className="text-white font-bold text-xl">₹{Math.abs(totalSaved).toLocaleString()}</span> ⚠️</>
            ) : isNearBudget ? (
              <>You've spent 80% of your budget. Remaining: <span className="text-white font-bold text-xl">₹{totalSaved.toLocaleString()}</span></>
            ) : (
              <>This month you saved <span className="text-white font-bold text-xl">₹{totalSaved.toLocaleString()}</span> 🎉</>
            )}
          </p>
        </div>
        <div className="relative z-10 bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/30">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Monthly Utilization</p>
          <p className="text-3xl font-extrabold tracking-tight">
            {monthlyIncome > 0 ? Math.round((totalSpent / monthlyIncome) * 100) : 0}%
          </p>
        </div>
        {isOverBudget ? (
          <ShieldAlert className="absolute -right-10 -bottom-10 w-48 h-48 text-white/10" />
        ) : isNearBudget ? (
          <AlertTriangle className="absolute -right-10 -bottom-10 w-48 h-48 text-white/10" />
        ) : (
          <PartyPopper className="absolute -right-10 -bottom-10 w-48 h-48 text-white/10" />
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spending by Category */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-8">Spending by Category</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-8">Monthly Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="spent" fill="#6366f1" radius={[4, 4, 0, 0]} name="Spent" />
                <Bar dataKey="saved" fill="#10b981" radius={[4, 4, 0, 0]} name="Saved" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Recent Transactions</h3>
          <button className="text-indigo-600 font-bold text-sm hover:underline">View All</button>
        </div>
        <div className="divide-y divide-slate-50">
          {expenses.slice(0, 10).map((tx) => (
            <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-2xl bg-slate-50 text-slate-600")}>
                  <PieChartIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{tx.description}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {new Date(tx.timestamp).toLocaleDateString()} • {tx.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-slate-900">-₹{tx.amount.toFixed(2)}</p>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-all" />
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <div className="p-10 text-center text-slate-400 font-medium italic">
              No transactions found for this period.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
