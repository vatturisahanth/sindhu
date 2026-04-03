export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  monthlyIncome: number;
  savingsGoal: number;
  currency: string;
  createdAt: number;
}

export interface CategoryBudget {
  id: string;
  userId: string;
  name: string;
  limit: number;
  spent: number;
  color: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  timestamp: number;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: number; // timestamp
  createdAt: number;
}

export interface AIAlert {
  id: string;
  userId: string;
  message: string;
  type: 'warning' | 'suggestion' | 'info';
  timestamp: number;
}
