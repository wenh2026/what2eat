// src/logic/dietaryGuidelines.js

/**
 * RDA Data for 9 population groups.
 * Values are daily recommended amounts.
 * protein (g), calcium (mg), iron (mg), folate (mcg), vitaminD (IU), calories (kcal)
 */
export const RDA_DATA = {
  infant: { label: 'Infant (0-12m)', protein: 11, calcium: 260, iron: 11, folate: 80, vitaminD: 400, calories: 800 },
  toddler: { label: 'Toddler (1-3y)', protein: 13, calcium: 700, iron: 7, folate: 150, vitaminD: 600, calories: 1200 },
  child: { label: 'Child (4-8y)', protein: 19, calcium: 1000, iron: 10, folate: 200, vitaminD: 600, calories: 1600 },
  teen: { label: 'Teen (9-18y)', protein: 46, calcium: 1300, iron: 11, folate: 400, vitaminD: 600, calories: 2400 }, // Average M/F
  adult: { label: 'Adult (19-50y)', protein: 50, calcium: 1000, iron: 18, folate: 400, vitaminD: 600, calories: 2000 },
  senior: { label: 'Senior (51+)', protein: 56, calcium: 1200, iron: 8, folate: 400, vitaminD: 800, calories: 1800 },
  pregnant: { label: 'Pregnant', protein: 71, calcium: 1300, iron: 27, folate: 600, vitaminD: 600, calories: 2400 },
  chronic: { label: 'Chronic/Sugar Control', protein: 50, calcium: 1000, iron: 18, folate: 400, vitaminD: 800, calories: 1800 }, // Focus on nutrient density
  vegetarian: { label: 'Vegetarian/Vegan', protein: 50, calcium: 1000, iron: 32, folate: 400, vitaminD: 600, calories: 2000 }, // Higher iron needs due to absorption
};

/**
 * Filters meals based on a time window.
 * @param {Array} history - The full meal history.
 * @param {String} timeWindow - 'today' or 'week'.
 * @returns {Array} Filtered meals.
 */
export const filterMealsByWindow = (history, timeWindow = 'today', targetDate = new Date()) => {
  if (!Array.isArray(history)) return [];
  
  const now = targetDate || new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = startOfDay + 86400000;
  
  if (timeWindow === 'today' || timeWindow === 'date') {
    return history.filter(meal => {
      const t = new Date(meal.timestamp).getTime();
      return t >= startOfDay && t < endOfDay;
    });
  } else if (timeWindow === 'week') {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).getTime(); // Last 7 days including today
    return history.filter(meal => new Date(meal.timestamp).getTime() >= startOfWeek);
  }
  return history;
};

/**
 * Calculates the percentage deviation of current intake from recommended values.
 * @param {Array} history - The user's meal history.
 * @param {Object} userProfile - The user's profile containing lifeStage.
 * @param {String} timeWindow - 'today', 'week', or 'date'.
 * @param {Date} targetDate - The specific date to calculate for (if timeWindow is 'date').
 * @returns {Object} Deviation percentages for each nutrient.
 */
export const calculateNutrientDeviation = (history, userProfile, timeWindow = 'today', targetDate = new Date()) => {
  const { lifeStage } = userProfile;
  const target = RDA_DATA[lifeStage] || RDA_DATA.adult;

  // Filter meals based on the time window
  const filteredMeals = filterMealsByWindow(history, timeWindow, targetDate);
  
  // Calculate aggregate intake
  const totalIntake = filteredMeals.reduce((acc, meal) => ({
    protein: acc.protein + (Number(meal.protein) || 0),
    calcium: acc.calcium + (Number(meal.calcium) || 0),
    iron: acc.iron + (Number(meal.iron) || 0),
    folate: acc.folate + (Number(meal.folate) || 0),
    vitaminD: acc.vitaminD + (Number(meal.vitaminD) || 0),
    calories: acc.calories + (Number(meal.calories) || 0),
  }), { protein: 0, calcium: 0, iron: 0, folate: 0, vitaminD: 0, calories: 0 });

  // For 'week', we compare the DAILY AVERAGE against the DAILY TARGET
  // If no meals in the window, average is 0. If there are meals, we divide by the number of days represented?
  // Actually, for a "Check-in" app, users might want to know "How am I doing on average over the last 7 days?".
  // A simple way is: Sum of Last 7 Days / 7. Even if they missed a day, it counts as 0 intake, lowering the average.
  // This encourages consistent logging.
  
  const divisor = timeWindow === 'week' ? 7 : 1; 
  
  const currentIntake = {
    protein: totalIntake.protein / divisor,
    calcium: totalIntake.calcium / divisor,
    iron: totalIntake.iron / divisor,
    folate: totalIntake.folate / divisor,
    vitaminD: totalIntake.vitaminD / divisor,
    calories: totalIntake.calories / divisor,
  };

  const deviation = {};
  for (const nutrient in target) {
    if (nutrient === 'label') continue;
    const targetValue = target[nutrient];
    const currentValue = currentIntake[nutrient] || 0;
    
    // Calculate percentage deviation: (current - target) / target * 100
    deviation[nutrient] = targetValue > 0 
      ? ((currentValue - targetValue) / targetValue) * 100 
      : 0;
  }

  return deviation;
};

/**
 * Generates an AI insight based on nutrient deviation.
 * @param {Object} deviationData - The deviation object returned by calculateNutrientDeviation.
 * @returns {String} A generated insight string.
 */
export const getAIInsight = (deviationData, t) => {
  const translate = (key, fallback, options = {}) =>
    typeof t === 'function' ? t(key, { defaultValue: fallback, ...options }) : fallback;
  const insights = [];
  
  // Analyze specific nutrients
  if (deviationData.protein < -20) insights.push(translate('history_insight_protein_low', "Protein intake is low. Consider adding lean meats, beans, or tofu."));
  if (deviationData.calcium < -20) insights.push(translate('history_insight_calcium_low', "Calcium is below recommended levels. Yogurt or fortified plant milk could help."));
  if (deviationData.iron < -20) insights.push(translate('history_insight_iron_low', "Iron levels are low. Leafy greens or red meat might be beneficial."));
  if (deviationData.vitaminD < -20) insights.push(translate('history_insight_vitaminD_low', "Vitamin D is insufficient. Consider more sunlight exposure or fortified foods."));
  if (deviationData.calories > 20) insights.push(translate('history_insight_calories_high', "Caloric intake is higher than recommended. Watch portion sizes."));
  
  if (insights.length === 0) {
    return translate('history_insight_balanced', "Great job! Your nutrient intake is well-balanced according to the guidelines.");
  }
  
  return translate('history_insight_based_on', "Based on your recent meals: {{details}}", { details: insights.join(" ") });
};
