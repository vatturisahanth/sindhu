import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function categorizeExpense(description: string, amount: number) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Categorize this expense: "${description}" for amount ${amount}. 
    Return only the category name from these options: Food, Transport, Shopping, Entertainment, Health, Utilities, Others.`,
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
    Extract the description, amount, and categorize it into one of: Food, Transport, Shopping, Entertainment, Health, Utilities, Others.
    If no amount is found, default to 0. If no description is found, use the input.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          category: { type: Type.STRING, enum: ["Food", "Transport", "Shopping", "Entertainment", "Health", "Utilities", "Others"] },
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
