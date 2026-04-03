import { UserProfile, CategoryBudget, Expense, AIAlert, Goal } from '../types';

const STORAGE_KEYS = {
  USER: 'smartbudget_user',
  CATEGORIES: 'smartbudget_categories',
  EXPENSES: 'smartbudget_expenses',
  ALERTS: 'smartbudget_alerts',
  GOALS: 'smartbudget_goals',
};

export const storageService = {
  getUserProfile: (): UserProfile | null => {
    const data = localStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  setUserProfile: (profile: UserProfile) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
  },

  getCategories: (): CategoryBudget[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : [];
  },

  setCategories: (categories: CategoryBudget[]) => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getExpenses: (): Expense[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  },

  addExpense: (expense: Expense) => {
    const expenses = storageService.getExpenses();
    expenses.unshift(expense);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  getAlerts: (): AIAlert[] => {
    const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
    return data ? JSON.parse(data) : [];
  },

  addAlert: (alert: AIAlert) => {
    const alerts = storageService.getAlerts();
    alerts.unshift(alert);
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts.slice(0, 10)));
  },

  getGoals: (): Goal[] => {
    const data = localStorage.getItem(STORAGE_KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  },

  addGoal: (goal: Goal) => {
    const goals = storageService.getGoals();
    goals.unshift(goal);
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  },

  updateGoal: (updatedGoal: Goal) => {
    const goals = storageService.getGoals();
    const index = goals.findIndex(g => g.id === updatedGoal.id);
    if (index !== -1) {
      goals[index] = updatedGoal;
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    }
  },

  deleteGoal: (id: string) => {
    const goals = storageService.getGoals();
    const filtered = goals.filter(g => g.id !== id);
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(filtered));
  },
};
