export type LifestyleType = 'student' | 'professional' | 'family';
export type CityType = 'urban' | 'rural';

export interface EstimationInput {
  monthlyIncome: number;
  lifestyle: LifestyleType;
  cityType: CityType;
}

export interface EstimatedBudget {
  totalSpending: number;
  savings: number;
  savingsPercentage: number;
  categories: {
    name: string;
    amount: number;
    percentage: number;
  }[];
  insights: string[];
}

export const estimationService = {
  estimateBudget(input: EstimationInput): EstimatedBudget {
    const { monthlyIncome, lifestyle, cityType } = input;
    
    let distribution: Record<string, number> = {};
    let insights: string[] = [];

    // Base distributions
    if (lifestyle === 'student') {
      distribution = {
        Food: 0.35,
        Transport: 0.15,
        Others: 0.30,
        Savings: 0.20
      };
      insights.push("As a student, focus on building a habit of saving even small amounts.");
      insights.push("Consider using student discounts for transport and food.");
    } else if (lifestyle === 'professional') {
      distribution = {
        Food: 0.20,
        Transport: 0.10,
        Rent: 0.25,
        Others: 0.20,
        Savings: 0.25
      };
      insights.push("Working professionals should aim for at least 20% savings for long-term goals.");
      insights.push("Try to keep your rent below 30% of your total income.");
    } else { // family
      distribution = {
        Food: 0.25,
        Transport: 0.10,
        Rent: 0.20,
        Utilities: 0.15,
        Others: 0.10,
        Savings: 0.20
      };
      insights.push("Family budgets require careful tracking of utility and grocery costs.");
      insights.push("Emergency funds are critical for family financial security.");
    }

    // City type adjustments
    if (cityType === 'urban') {
      if (distribution['Rent']) distribution['Rent'] += 0.05;
      if (distribution['Transport']) distribution['Transport'] += 0.05;
      distribution['Savings'] -= 0.10;
      insights.push("Urban living often comes with higher rent and commute costs.");
    } else {
      if (distribution['Rent']) distribution['Rent'] -= 0.05;
      distribution['Savings'] += 0.05;
      insights.push("Rural areas typically offer lower cost of living, allowing for higher savings.");
    }

    // Normalize and calculate
    const totalAllocated = Object.values(distribution).reduce((a, b) => a + b, 0);
    const estimatedCategories = Object.entries(distribution).map(([name, weight]) => {
      const normalizedWeight = weight / totalAllocated;
      const amount = Math.round(monthlyIncome * normalizedWeight);
      return {
        name,
        amount,
        percentage: Math.round(normalizedWeight * 100)
      };
    });

    const savingsObj = estimatedCategories.find(c => c.name === 'Savings');
    const totalSpending = monthlyIncome - (savingsObj?.amount || 0);

    return {
      totalSpending,
      savings: savingsObj?.amount || 0,
      savingsPercentage: savingsObj?.percentage || 0,
      categories: estimatedCategories.filter(c => c.name !== 'Savings'),
      insights
    };
  }
};
