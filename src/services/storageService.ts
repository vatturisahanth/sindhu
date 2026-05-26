import { UserProfile, CategoryBudget, Expense, AIAlert, Goal } from '../types';

const STORAGE_KEYS = {
  USER: 'arthmitra_user',
  CATEGORIES: 'arthmitra_categories',
  EXPENSES: 'arthmitra_expenses',
  ALERTS: 'arthmitra_alerts',
  GOALS: 'arthmitra_goals',
};

const getScopedKey = (key: string, userId: string) => `${key}_${userId}`;

export const storageService = {
  getUserProfile: (userId: string): UserProfile | null => {
    const data = localStorage.getItem(getScopedKey(STORAGE_KEYS.USER, userId));
    return data ? JSON.parse(data) : null;
  },

  setUserProfile: (userId: string, profile: UserProfile) => {
    localStorage.setItem(getScopedKey(STORAGE_KEYS.USER, userId), JSON.stringify(profile));
  },

  getCategories: (userId: string): CategoryBudget[] => {
    const data = localStorage.getItem(getScopedKey(STORAGE_KEYS.CATEGORIES, userId));
    return data ? JSON.parse(data) : [];
  },

  setCategories: (userId: string, categories: CategoryBudget[]) => {
    localStorage.setItem(getScopedKey(STORAGE_KEYS.CATEGORIES, userId), JSON.stringify(categories));
  },

  getExpenses: (userId: string): Expense[] => {
    const data = localStorage.getItem(getScopedKey(STORAGE_KEYS.EXPENSES, userId));
    return data ? JSON.parse(data) : [];
  },

  addExpense: (userId: string, expense: Expense) => {
    const expenses = storageService.getExpenses(userId);
    expenses.unshift(expense);
    localStorage.setItem(getScopedKey(STORAGE_KEYS.EXPENSES, userId), JSON.stringify(expenses));
  },

  getAlerts: (userId: string): AIAlert[] => {
    const data = localStorage.getItem(getScopedKey(STORAGE_KEYS.ALERTS, userId));
    return data ? JSON.parse(data) : [];
  },

  addAlert: (userId: string, alert: AIAlert) => {
    const alerts = storageService.getAlerts(userId);
    alerts.unshift(alert);
    localStorage.setItem(getScopedKey(STORAGE_KEYS.ALERTS, userId), JSON.stringify(alerts.slice(0, 10)));
  },

  getGoals: (userId: string): Goal[] => {
    const data = localStorage.getItem(getScopedKey(STORAGE_KEYS.GOALS, userId));
    return data ? JSON.parse(data) : [];
  },

  addGoal: (userId: string, goal: Goal) => {
    const goals = storageService.getGoals(userId);
    goals.unshift(goal);
    localStorage.setItem(getScopedKey(STORAGE_KEYS.GOALS, userId), JSON.stringify(goals));
  },

  updateGoal: (userId: string, updatedGoal: Goal) => {
    const goals = storageService.getGoals(userId);
    const index = goals.findIndex(g => g.id === updatedGoal.id);
    if (index !== -1) {
      goals[index] = updatedGoal;
      localStorage.setItem(getScopedKey(STORAGE_KEYS.GOALS, userId), JSON.stringify(goals));
    }
  },

  deleteGoal: (userId: string, id: string) => {
    const goals = storageService.getGoals(userId);
    const filtered = goals.filter(g => g.id !== id);
    localStorage.setItem(getScopedKey(STORAGE_KEYS.GOALS, userId), JSON.stringify(filtered));
  },
};
