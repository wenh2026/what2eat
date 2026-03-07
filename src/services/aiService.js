// src/services/aiService.js
import { RDA_DATA, calculateNutrientDeviation } from '../logic/dietaryGuidelines';

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const USE_MOCK_RESPONSE = import.meta.env.VITE_AI_USE_MOCK === 'true';

/**
 * Generates a prompt for the AI based on user profile and history.
 * @param {Object} userProfile - The user's profile.
 * @param {Array} history - The user's meal history.
 * @param {String} language - Preferred response language.
 * @returns {String} The generated prompt.
 */
export const generatePrompt = (userProfile, history, language = 'zh', context = {}) => {
  const { lifeStage, currentMood, dietaryIntents, cravings } = userProfile;
  const targetGroup = RDA_DATA[lifeStage] || RDA_DATA.adult;
  const responseLanguage = language?.startsWith('zh') ? 'Chinese (Simplified)' : 'English';
  const deviations = calculateNutrientDeviation(history, userProfile, 'today');
  const deviationsStr = Object.entries(deviations)
    .map(([nutrient, val]) => `${nutrient}: ${val > 0 ? '+' : ''}${val.toFixed(1)}%`)
    .join(', ');

  const intentStr = dietaryIntents && dietaryIntents.length > 0 
    ? `Dietary Intents: ${dietaryIntents.join(', ')}` 
    : 'No specific dietary restrictions';

  const cravingsStr = cravings && cravings.length > 0
    ? `Cravings: ${cravings.join(', ')}`
    : 'No specific cravings';

  const moodDesc = currentMood > 75 ? 'Ecstatic' : currentMood > 40 ? 'Neutral' : 'Stressed';
  const mealMoment = context.mealMoment || 'dinner';
  const weather = context.weather || 'mild';

  return `
    Act as a nutritionist for a user with the following profile:
    - Life Stage: ${targetGroup.label}
    - Current Mood: ${moodDesc} (Value: ${currentMood}/100)
    - Meal Moment: ${mealMoment}
    - Weather: ${weather}
    - ${intentStr}
    - ${cravingsStr}
    
    Recent Nutritional Status (Deviation from RDA):
    ${deviationsStr}
    
    Please suggest a ONE specific meal for the next meal that addresses any nutritional deficiencies and aligns with their current mood.
    The meal should be practical and home-cookable.
    The fields "suggestion", "reasoning", and each item in "ingredients" must be written in ${responseLanguage}.
    
    IMPORTANT: You must return ONLY valid JSON without any markdown formatting or code blocks.
    Format the response as JSON with fields: 
    { 
      "suggestion": "Meal Name", 
      "reasoning": "Short explanation (max 20 words)", 
      "ingredients": ["ing1", "ing2"],
      "nutrients": { "protein": "XXg", "calories": "XXXkcal" },
      "prepTime": "XX min",
      "steps": ["step 1", "step 2", "step 3"]
    }
  `;
};

/**
 * Call DashScope AI API.
 * @param {String} prompt 
 * @param {String} language
 * @returns {Promise<Object>}
 */
export const callAI = async (prompt, language = 'zh') => {
  const responseLanguage = language?.startsWith('zh') ? 'Chinese (Simplified)' : 'English';
  if (USE_MOCK_RESPONSE) {
    return mockAIResponse(language);
  }
  if (!API_KEY) {
    const error = new Error('Missing AI API key');
    error.code = 'AI_KEY_MISSING';
    throw error;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      messages: [
        { role: 'system', content: `You are a helpful nutritionist assistant that outputs only JSON. The values of "suggestion", "reasoning", and "ingredients" must be in ${responseLanguage}.` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = new Error(`API Error: ${response.statusText}`);
    error.code = 'AI_REQUEST_FAILED';
    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    const error = new Error('No content in response');
    error.code = 'AI_EMPTY_RESPONSE';
    throw error;
  }

  try {
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return normalizeRecipeResponse(JSON.parse(cleanContent), language);
  } catch {
    const error = new Error('Invalid JSON response');
    error.code = 'AI_INVALID_JSON';
    throw error;
  }
};

const mockAIResponse = async (language = 'zh') => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (language?.startsWith('zh')) {
    return normalizeRecipeResponse({
      suggestion: "藜麦黑豆能量碗（模拟）",
      reasoning: "富含蛋白质和铁，有助于改善你近期的营养缺口。",
      ingredients: ["藜麦", "黑豆", "牛油果", "青柠"],
      nutrients: { protein: "20g", calories: "450kcal" },
      prepTime: "20 分钟",
      steps: ["煮熟藜麦", "混合黑豆与牛油果", "挤入青柠汁后装盘"]
    }, language);
  }
  return normalizeRecipeResponse({
    suggestion: "Quinoa & Black Bean Bowl (Mock)",
    reasoning: "High in protein and iron to address your recent deficiencies.",
    ingredients: ["Quinoa", "Black Beans", "Avocado", "Lime"],
    nutrients: { protein: "20g", calories: "450kcal" },
    prepTime: "20 min",
    steps: ["Cook quinoa", "Mix with black beans and avocado", "Finish with lime juice"]
  }, language);
};

const normalizeRecipeResponse = (data, language = 'zh') => {
  const isZh = language?.startsWith('zh');
  const fallbackSteps = isZh
    ? ["准备食材", "按喜好烹调", "装盘享用"]
    : ["Prepare ingredients", "Cook with your preferred method", "Plate and enjoy"];

  return {
    suggestion: data?.suggestion || (isZh ? "营养餐推荐" : "Nutritious meal suggestion"),
    reasoning: data?.reasoning || (isZh ? "根据你的状态生成的均衡餐建议。" : "A balanced meal suggestion generated for your current state."),
    ingredients: Array.isArray(data?.ingredients) ? data.ingredients : [],
    nutrients: {
      protein: data?.nutrients?.protein || "0g",
      calories: data?.nutrients?.calories || "0kcal",
    },
    prepTime: data?.prepTime || data?.prep_time || (isZh ? "约20分钟" : "About 20 min"),
    steps: Array.isArray(data?.steps)
      ? data.steps
      : Array.isArray(data?.step_by_step)
        ? data.step_by_step
        : fallbackSteps,
  };
};
