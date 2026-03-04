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
 * Calculates the percentage deviation of current intake from recommended values.
 * @param {Object} history - The user's meal history (aggregated for the period).
 * @param {Object} userProfile - The user's profile containing lifeStage.
 * @returns {Object} Deviation percentages for each nutrient.
 */
export const calculateNutrientDeviation = (history, userProfile) => {
  const { lifeStage } = userProfile;
  const target = RDA_DATA[lifeStage] || RDA_DATA.adult;

  // Aggregate current intake from history (assuming history is an array of meals with nutrient data)
  // For simplicity, we'll assume 'history' object contains the total intake values directly or we sum them up here.
  // If history is an array of meals:
  const currentIntake = Array.isArray(history) 
    ? history.reduce((acc, meal) => ({
        protein: acc.protein + (meal.protein || 0),
        calcium: acc.calcium + (meal.calcium || 0),
        iron: acc.iron + (meal.iron || 0),
        folate: acc.folate + (meal.folate || 0),
        vitaminD: acc.vitaminD + (meal.vitaminD || 0),
        calories: acc.calories + (meal.calories || 0),
      }), { protein: 0, calcium: 0, iron: 0, folate: 0, vitaminD: 0, calories: 0 })
    : history; // If history is already aggregated

  const deviation = {};
  for (const nutrient in target) {
    if (nutrient === 'label') continue;
    const targetValue = target[nutrient];
    const currentValue = currentIntake[nutrient] || 0;
    
    // Calculate percentage deviation: (current - target) / target * 100
    // A value of 0 means exact match. -50 means 50% under. +50 means 50% over.
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
export const getAIInsight = (deviationData) => {
  const insights = [];
  
  // Analyze specific nutrients
  if (deviationData.protein < -20) insights.push("Protein intake is low. Consider adding lean meats, beans, or tofu.");
  if (deviationData.calcium < -20) insights.push("Calcium is below recommended levels. Yogurt or fortified plant milk could help.");
  if (deviationData.iron < -20) insights.push("Iron levels are low. Leafy greens or red meat might be beneficial.");
  if (deviationData.vitaminD < -20) insights.push("Vitamin D is insufficient. Consider more sunlight exposure or fortified foods.");
  if (deviationData.calories > 20) insights.push("Caloric intake is higher than recommended. Watch portion sizes.");
  
  if (insights.length === 0) {
    return "Great job! Your nutrient intake is well-balanced according to the guidelines.";
  }
  
  return `Based on your recent meals: ${insights.join(" ")}`;
};
