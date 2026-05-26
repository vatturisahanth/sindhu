import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function categorizeExpense(description: string, amount: number) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Categorize this expense: "${description}" for amount ${amount}. 
    Return only the category name from these options: Food, Transport, Shopping, Education, Bills, Entertainment, Health, Savings, Recharge, Others.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            description: "The category of the expense",
          },
          emoji: {
            type: Type.STRING,
            description: "A relevant emoji for the category",
          }
        },
        required: ["category", "emoji"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { category: "Others", emoji: "💰" };
  }
}

export async function getAISuggestions(spendingData: any, income: number, savingsGoal: number) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this spending data: ${JSON.stringify(spendingData)}. 
    Income: ${income}, Savings Goal: ${savingsGoal}. 
    Provide 3 concise, actionable financial suggestions to help the user save more or manage their budget better.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["warning", "suggestion", "info"] }
          },
          required: ["message", "type"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return [];
  }
}

export async function parseQuickExpense(input: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Parse this expense input: "${input}". 
    Extract the description, amount, and categorize it into one of: Food, Transport, Shopping, Education, Bills, Entertainment, Health, Savings, Recharge, Others.
    If no amount is found, default to 0. If no description is found, use the input.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          category: { type: Type.STRING, enum: ["Food", "Transport", "Shopping", "Education", "Bills", "Entertainment", "Health", "Savings", "Recharge", "Others"] },
          emoji: { type: Type.STRING }
        },
        required: ["description", "amount", "category", "emoji"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return { description: input, amount: 0, category: "Others", emoji: "💰" };
  }
}

export async function parseBankStatement(text: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract all debit transactions from this bank statement text: "${text.substring(0, 10000)}". 
    For each transaction, extract: description, amount, and categorize it into one of: Food, Transport, Shopping, Education, Bills, Entertainment, Health, Savings, Recharge, Others.
    Return an array of expense objects. Ignore credits/deposits.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING, enum: ["Food", "Transport", "Shopping", "Education", "Bills", "Entertainment", "Health", "Savings", "Recharge", "Others"] },
            timestamp: { type: Type.NUMBER, description: "Approximate timestamp in milliseconds, if date is found, otherwise current timestamp" }
          },
          required: ["description", "amount", "category"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse bank statement", e);
    return [];
  }
}
