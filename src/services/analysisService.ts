import { Expense, UserProfile, CategoryBudget, AIAlert, Goal } from '../types';

export const analysisService = {
  calculateFinancialHealthScore: (expenses: Expense[], profile: UserProfile | null): number => {
    if (!profile || expenses.length === 0) return 0;
    
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const budget = profile.monthlyIncome;
    const savingsGoal = profile.savingsGoal;
    
    // Base score starts at 100
    let score = 100;
    
    // Penalty for overspending
    if (totalSpent > budget) {
      score -= Math.min(40, ((totalSpent - budget) / budget) * 100);
    }
    
    // Penalty for not meeting savings goal
    const actualSavings = budget - totalSpent;
    if (actualSavings < savingsGoal) {
      score -= Math.min(30, ((savingsGoal - actualSavings) / savingsGoal) * 100);
    }
    
    // Bonus for staying well under budget
    if (totalSpent < budget * 0.7) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  },

  detectAnomalies: (expenses: Expense[]): AIAlert[] => {
    if (expenses.length < 5) return [];
    
    const alerts: AIAlert[] = [];
    const sortedExpenses = [...expenses].sort((a, b) => b.timestamp - a.timestamp);
    
    // Calculate average spending per category
    const categoryAverages: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};
    
    expenses.forEach(exp => {
      categoryAverages[exp.category] = (categoryAverages[exp.category] || 0) + exp.amount;
      categoryCounts[exp.category] = (categoryCounts[exp.category] || 0) + 1;
    });
    
    Object.keys(categoryAverages).forEach(cat => {
      categoryAverages[cat] /= categoryCounts[cat];
    });
    
    // Check recent expenses for anomalies against category averages
    const recentExpenses = sortedExpenses.slice(0, 5);
    recentExpenses.forEach(exp => {
      const avg = categoryAverages[exp.category];
      if (exp.amount > avg * 2.5 && exp.amount > 500) {
        alerts.push({
          id: `anomaly-${exp.id}`,
          userId: exp.userId,
          message: `🚨 Unusual spending detected in ${exp.category}: ₹${exp.amount} on "${exp.description}". This is significantly higher than your usual ${exp.category} expenses.`,
          type: 'warning',
          timestamp: Date.now()
        });
      }
    });
    
    // Detect high frequency patterns
    const foodExpenses = expenses.filter(e => e.category === 'Food');
    if (foodExpenses.length >= 7) {
      const last7Days = foodExpenses.filter(e => e.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000);
      const dailyAvg = last7Days.reduce((acc, curr) => acc + curr.amount, 0) / 7;
      if (dailyAvg > 500) {
        alerts.push({
          id: 'high-food-trend',
          userId: expenses[0].userId,
          message: `📉 High food expense trend: You're spending ₹${Math.round(dailyAvg)} daily on food. Consider home-cooking to save ~₹2000/month.`,
          type: 'suggestion',
          timestamp: Date.now()
        });
      }
    }
    
    return alerts;
  },

  generateSuggestions: (expenses: Expense[], categories: CategoryBudget[]): AIAlert[] => {
    const suggestions: AIAlert[] = [];
    const userId = categories[0]?.userId || 'unknown';
    
    categories.forEach(cat => {
      const percentUsed = (cat.spent / cat.limit) * 100;
      if (percentUsed > 100) {
        suggestions.push({
          id: `overbudget-${cat.id}`,
          userId,
          message: `⚠️ Budget limit crossed for ${cat.name}! You've spent ₹${cat.spent - cat.limit} over your limit.`,
          type: 'warning',
          timestamp: Date.now()
        });
      } else if (percentUsed > 85) {
        suggestions.push({
          id: `suggestion-${cat.id}`,
          userId,
          message: `💡 You've used ${Math.round(percentUsed)}% of your ${cat.name} budget. Try to reduce spending here by 15% to stay safe.`,
          type: 'suggestion',
          timestamp: Date.now()
        });
      }
    });

    // Smart subscription detection
    const recurring = expenses.filter(e => 
      e.description.toLowerCase().includes('subscription') || 
      e.description.toLowerCase().includes('netflix') || 
      e.description.toLowerCase().includes('spotify')
    );
    if (recurring.length > 3) {
      suggestions.push({
        id: 'subscription-tip',
        userId,
        message: "💡 AI Tip: You have multiple active subscriptions. Shift to annual plans to reduce total costs by ~20%.",
        type: 'suggestion',
        timestamp: Date.now()
      });
    }
    
    if (expenses.length > 10) {
      const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
      const avgTransaction = totalSpent / expenses.length;
      if (avgTransaction < 100) {
        suggestions.push({
          id: 'small-spend-tip',
          userId,
          message: "💡 You have many small transactions. These 'micro-expenses' often add up to 15% of total spending without being noticed.",
          type: 'info',
          timestamp: Date.now()
        });
      }
    }
    
    return suggestions;
  },

  forecastSpending: (expenses: Expense[], budget: number): { predicted: number, willExceed: boolean } => {
    if (expenses.length === 0) return { predicted: 0, willExceed: false };
    
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    
    const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const avgDaily = totalSpent / currentDay;
    const predicted = Math.round(totalSpent + (avgDaily * (daysInMonth - currentDay)));
    
    return {
      predicted,
      willExceed: predicted > budget
    };
  },

  analyzeGoal: (goal: Goal, profile: UserProfile | null, expenses: Expense[]): { 
    achievable: boolean, 
    requiredMonthly: number, 
    currentMonthlySavings: number,
    suggestions: string[]
  } => {
    if (!profile) return { achievable: false, requiredMonthly: 0, currentMonthlySavings: 0, suggestions: [] };

    const now = new Date();
    const monthsRemaining = Math.max(0.5, (goal.deadline - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const remainingAmount = goal.targetAmount - goal.currentAmount;
    const requiredMonthly = remainingAmount / monthsRemaining;

    // Calculate current month's spending
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonthExpenses = expenses.filter(exp => {
      const d = new Date(exp.timestamp);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    
    const totalSpentThisMonth = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const currentMonthlySavings = profile.monthlyIncome - totalSpentThisMonth;

    const achievable = currentMonthlySavings >= requiredMonthly;
    const suggestions: string[] = [];

    if (!achievable) {
      const savingsPercentage = (requiredMonthly / profile.monthlyIncome) * 100;

      if (savingsPercentage > 50) {
        suggestions.push(`⚠️ High Risk: This goal requires saving a very high percentage of your income. This may be unsustainable.`);
      }

      suggestions.push(`📉 Savings Gap: Your current monthly savings rate is below what's needed to reach this goal by the deadline.`);
      
      if (requiredMonthly > currentMonthlySavings) {
        suggestions.push(`💡 Strategy: Consider reducing monthly spending or extending the deadline to stay on track.`);
      }
      
      suggestions.push(`🏦 Advice: Consider a recurring deposit or a goal-based mutual fund to automate your savings.`);
    } else {
      suggestions.push("✅ Financial Analysis: Your current savings rate is sufficient to reach this goal by the deadline.");
      if (currentMonthlySavings > requiredMonthly * 1.5) {
        suggestions.push("🚀 Accelerator: You have a significant surplus. You could achieve this goal much earlier if you prioritize it.");
      }
    }

    return { achievable, requiredMonthly, currentMonthlySavings, suggestions };
  },

  analyzeLongTermTrends: (expenses: Expense[]): AIAlert[] => {
    if (expenses.length < 20) return [];

    const alerts: AIAlert[] = [];
    const now = new Date();
    const monthsData: Record<string, { total: number, categories: Record<string, number> }> = {};

    // Group by month
    expenses.forEach(exp => {
      const date = new Date(exp.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthsData[monthKey]) {
        monthsData[monthKey] = { total: 0, categories: {} };
      }
      monthsData[monthKey].total += exp.amount;
      monthsData[monthKey].categories[exp.category] = (monthsData[monthKey].categories[exp.category] || 0) + exp.amount;
    });

    const monthKeys = Object.keys(monthsData).sort();
    if (monthKeys.length < 3) return [];

    // Analyze overall trend
    const totals = monthKeys.map(k => monthsData[k].total);
    const firstHalf = totals.slice(0, Math.floor(totals.length / 2));
    const secondHalf = totals.slice(Math.floor(totals.length / 2));
    
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (avgSecond > avgFirst * 1.2) {
      alerts.push({
        id: 'long-term-inflation',
        userId: expenses[0].userId,
        message: `📈 Long-term Trend: Your average monthly spending has increased by ${Math.round(((avgSecond - avgFirst) / avgFirst) * 100)}% over the last ${monthKeys.length} months. Consider a lifestyle audit.`,
        type: 'warning',
        timestamp: Date.now()
      });
    }

    // Category specific trends
    const categories = Array.from(new Set(expenses.map(e => e.category)));
    categories.forEach(cat => {
      const catTotals = monthKeys.map(k => monthsData[k].categories[cat] || 0);
      const catFirst = catTotals.slice(0, Math.floor(catTotals.length / 2));
      const catSecond = catTotals.slice(Math.floor(catTotals.length / 2));
      
      const avgCatFirst = catFirst.reduce((a, b) => a + b, 0) / catFirst.length;
      const avgCatSecond = catSecond.reduce((a, b) => a + b, 0) / catSecond.length;

      if (avgCatSecond > avgCatFirst * 1.5 && avgCatSecond > 1000) {
        alerts.push({
          id: `trend-${cat}`,
          userId: expenses[0].userId,
          message: `🔍 Insight: Your ${cat} expenses are trending upwards significantly. You're spending ₹${Math.round(avgCatSecond - avgCatFirst)} more per month than 6 months ago.`,
          type: 'suggestion',
          timestamp: Date.now()
        });
      }
    });

    return alerts;
  }
};
