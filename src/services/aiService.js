// src/services/aiService.js
import { RDA_DATA, calculateNutrientDeviation } from '../logic/dietaryGuidelines';

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const USE_MOCK_RESPONSE = import.meta.env.VITE_AI_USE_MOCK === 'true';

const extractJsonFromText = (text) => {
  if (typeof text !== 'string') return null;
  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
  if (!clean) return null;

  try {
    return JSON.parse(clean);
  } catch {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
    const slice = clean.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
    } catch {
      return null;
    }
  }
};

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
  const hasApiKey = typeof API_KEY === 'string' && API_KEY.trim().length > 0;
  if (USE_MOCK_RESPONSE || (!hasApiKey && import.meta.env.DEV)) {
    const recipe = await mockAIResponse(language);
    return {
      ...recipe,
      __meta: {
        source: 'mock',
        reason: USE_MOCK_RESPONSE ? 'env_mock_enabled' : 'missing_key_in_dev',
      },
    };
  }
  if (!hasApiKey) {
    const error = new Error('Missing AI API key');
    error.code = 'AI_KEY_MISSING';
    throw error;
  }

  let response;
  try {
    response = await fetch(API_URL, {
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
  } catch (cause) {
    const error = new Error('Network error');
    error.code = 'AI_NETWORK_FAILED';
    error.cause = cause;
    throw error;
  }

  if (!response.ok) {
    let detail = '';
    try {
      detail = await response.text();
    } catch {
      detail = '';
    }
    const safeDetail = typeof detail === 'string' ? detail.slice(0, 300) : '';
    const error = new Error(`API Error: ${response.status} ${response.statusText}${safeDetail ? ` - ${safeDetail}` : ''}`);
    error.code = 'AI_REQUEST_FAILED';
    error.status = response.status;
    error.statusText = response.statusText;
    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    const error = new Error('No content in response');
    error.code = 'AI_EMPTY_RESPONSE';
    throw error;
  }

  const parsed = extractJsonFromText(content);
  if (!parsed) {
    const error = new Error('Invalid JSON response');
    error.code = 'AI_INVALID_JSON';
    throw error;
  }
  const recipe = normalizeRecipeResponse(parsed, language);
  return { ...recipe, __meta: { source: 'ai' } };
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
  const rawIngredients = data?.ingredients;
  const rawSteps = data?.steps ?? data?.step_by_step;
  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients
    : typeof rawIngredients === 'string'
      ? rawIngredients.split(/[,\n、，]/).map((x) => x.trim()).filter(Boolean)
      : [];
  const steps = Array.isArray(rawSteps)
    ? rawSteps
    : typeof rawSteps === 'string'
      ? rawSteps.split(/\n+/).map((x) => x.replace(/^\d+[.)]\s*/, '').trim()).filter(Boolean)
      : [];
  const proteinRaw = data?.nutrients?.protein ?? data?.protein ?? data?.nutrition?.protein;
  const caloriesRaw = data?.nutrients?.calories ?? data?.calories ?? data?.nutrition?.calories;
  const fallbackSteps = isZh
    ? ["准备食材", "按喜好烹调", "装盘享用"]
    : ["Prepare ingredients", "Cook with your preferred method", "Plate and enjoy"];

  return {
    suggestion: data?.suggestion || (isZh ? "营养餐推荐" : "Nutritious meal suggestion"),
    reasoning: data?.reasoning || (isZh ? "根据你的状态生成的均衡餐建议。" : "A balanced meal suggestion generated for your current state."),
    ingredients,
    nutrients: {
      protein: proteinRaw || "0g",
      calories: caloriesRaw || "0kcal",
    },
    prepTime: data?.prepTime || data?.prep_time || (isZh ? "约20分钟" : "About 20 min"),
    steps: steps.length > 0 ? steps : fallbackSteps,
  };
};
