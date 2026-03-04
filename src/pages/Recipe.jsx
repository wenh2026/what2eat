import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore';
import BottomNav from '../components/BottomNav';

const Recipe = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { recipe } = location.state || {};
  const { addMeal } = useUserStore();

  // If no recipe data (e.g. direct access), redirect or show empty state
  if (!recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="mb-4">{t('recipe_no_data')}</p>
        <button onClick={() => navigate('/vibe')} className="text-primary font-bold">
          {t('recipe_go_to_vibe_generate')}
        </button>
        <BottomNav />
      </div>
    );
  }

  const handleCheckIn = () => {
    // Add meal to history
    addMeal({
      name: recipe.suggestion,
      ...recipe.nutrients, // Assuming nutrients has protein, calories, etc.
      // Parse strings to numbers if needed, but for now we keep it simple
      protein: parseInt(recipe.nutrients.protein) || 0,
      calories: parseInt(recipe.nutrients.calories) || 0,
    });
    
    // Navigate to History
    navigate('/history');
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen pb-24 transition-colors duration-200">
      {/* Header */}
      <div className="relative h-64 bg-gray-200 dark:bg-gray-800 transition-colors">
        <img 
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
          alt={t('recipe_food_alt')}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 text-white">
          <span className="bg-primary px-3 py-1 rounded-full text-xs font-bold w-fit mb-2">{t('recipe_ai_suggestion')}</span>
          <h1 className="text-3xl font-bold leading-tight">{recipe.suggestion}</h1>
        </div>
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 left-4 size-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Reasoning Card */}
        <div className="bg-white dark:bg-deep-charcoal p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden transition-colors">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <span className="material-symbols-outlined text-6xl text-primary">psychology</span>
          </div>
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2 dark:text-off-white">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            {t('recipe_why_this_meal')}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed relative z-10 transition-colors">
            {recipe.reasoning}
          </p>
        </div>

        {/* Nutrients */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30 transition-colors">
            <span className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider transition-colors">{t('recipe_protein')}</span>
            <p className="text-2xl font-bold text-deep-charcoal dark:text-off-white">{recipe.nutrients.protein}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30 transition-colors">
            <span className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wider transition-colors">{t('recipe_calories')}</span>
            <p className="text-2xl font-bold text-deep-charcoal dark:text-off-white">{recipe.nutrients.calories}</p>
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <h3 className="font-bold text-lg mb-3 dark:text-off-white">{t('recipe_ingredients')}</h3>
          <ul className="space-y-2">
            {recipe.ingredients?.map((ing, i) => (
              <li key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-deep-charcoal rounded-xl border border-gray-100 dark:border-gray-700 transition-colors">
                <div className="size-2 rounded-full bg-primary/40"></div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{ing}</span>
              </li>
            )) || <p className="text-gray-400 dark:text-gray-500 italic">{t('recipe_no_ingredients')}</p>}
          </ul>
        </div>
      </div>

      {/* Action Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 max-w-md mx-auto z-40">
        <button
          onClick={handleCheckIn}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl shadow-lg shadow-primary/30 font-bold active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined">check_circle</span>
          <span>{t('recipe_add_to_history')}</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default Recipe;
