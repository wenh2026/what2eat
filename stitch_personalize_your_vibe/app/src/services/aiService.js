// src/services/aiService.js
import { RDA_DATA, calculateNutrientDeviation } from '../logic/dietaryGuidelines';

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

/**
 * Generates a prompt for the AI based on user profile and history.
 * @param {Object} userProfile - The user's profile.
 * @param {Array} history - The user's meal history.
 * @returns {String} The generated prompt.
 */
export const generatePrompt = (userProfile, history) => {
  const { lifeStage, currentMood, dietaryIntents } = userProfile;
  const targetGroup = RDA_DATA[lifeStage] || RDA_DATA.adult;
  
  // Calculate deviations to include in the prompt
  const deviations = calculateNutrientDeviation(history, userProfile);
  const deviationsStr = Object.entries(deviations)
    .map(([nutrient, val]) => `${nutrient}: ${val > 0 ? '+' : ''}${val.toFixed(1)}%`)
    .join(', ');

  const intentStr = dietaryIntents && dietaryIntents.length > 0 
    ? `Dietary Intents: ${dietaryIntents.join(', ')}` 
    : 'No specific dietary restrictions';

  const moodDesc = currentMood > 75 ? 'Ecstatic' : currentMood > 40 ? 'Neutral' : 'Stressed';

  return `
    Act as a nutritionist for a user with the following profile:
    - Life Stage: ${targetGroup.label}
    - Current Mood: ${moodDesc} (Value: ${currentMood}/100)
    - ${intentStr}
    
    Recent Nutritional Status (Deviation from RDA):
    ${deviationsStr}
    
    Please suggest a ONE specific meal for the next meal that addresses any nutritional deficiencies and aligns with their current mood.
    The meal should be practical and home-cookable.
    
    IMPORTANT: You must return ONLY valid JSON without any markdown formatting or code blocks.
    Format the response as JSON with fields: 
    { 
      "suggestion": "Meal Name", 
      "reasoning": "Short explanation (max 20 words)", 
      "ingredients": ["ing1", "ing2"],
      "nutrients": { "protein": "XXg", "calories": "XXXkcal" } 
    }
  `;
};

/**
 * Call DashScope AI API.
 * @param {String} prompt 
 * @returns {Promise<Object>}
 */
export const callAI = async (prompt) => {
  if (!API_KEY) {
    console.warn('Missing API Key, using mock data');
    return mockAIResponse();
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful nutritionist assistant that outputs only JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) throw new Error('No content in response');

    // Parse JSON from content (handle potential markdown code blocks)
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanContent);

  } catch (error) {
    console.error('AI Service Error:', error);
    return mockAIResponse(); // Fallback to mock on error
  }
};

const mockAIResponse = async () => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return {
    suggestion: "Quinoa & Black Bean Bowl (Mock)",
    reasoning: "High in protein and iron to address your recent deficiencies.",
    ingredients: ["Quinoa", "Black Beans", "Avocado", "Lime"],
    nutrients: { protein: "20g", calories: "450kcal" }
  };
};
