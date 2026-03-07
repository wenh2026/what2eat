import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore';
import BottomNav from '../components/BottomNav';
import { useHeaderMotion } from '../lib/useHeaderMotion';
import html2canvas from 'html2canvas';

const Recipe = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { recipe } = location.state || {};
  const { addMeal } = useUserStore();
  const { isHeaderCompact, isHeaderHidden } = useHeaderMotion({ compactAt: 48, hideAt: 180 });
  const stitchCardRef = useRef(null);
  const [sharing, setSharing] = useState(false);

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
    addMeal({
      name: recipe.suggestion,
      ...recipe.nutrients,
      protein: parseInt(recipe.nutrients.protein) || 0,
      calories: parseInt(recipe.nutrients.calories) || 0,
    });
    navigate('/history');
  };

  const handleExportStitchCard = async () => {
    if (!stitchCardRef.current || sharing) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(stitchCardRef.current, { scale: 2, backgroundColor: null });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `stitch-${Date.now()}.png`;
      link.click();
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="surface-page font-display min-h-screen pb-24 transition-colors duration-200">
      <header
        className={`surface-nav sticky top-0 z-30 flex items-center justify-between px-4 border-b transition-[transform,padding,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isHeaderCompact ? 'shadow-sm' : ''}`}
        style={{
          paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isHeaderCompact ? '0.4rem' : '0.8rem'})`,
          paddingBottom: isHeaderCompact ? '0.4rem' : '0.5rem',
          transform: isHeaderHidden ? 'translateY(-100%)' : 'translateY(0)',
          opacity: isHeaderHidden ? 0.98 : 1,
          willChange: 'transform'
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className={`surface-card rounded-full flex items-center justify-center border transition-all duration-300 ${isHeaderCompact ? 'size-9' : 'size-10'}`}
        >
          <span className={`material-symbols-outlined text-deep-charcoal dark:text-off-white transition-all duration-300 ${isHeaderCompact ? 'text-[20px]' : 'text-[22px]'}`}>arrow_back</span>
        </button>
        <div className="mx-3 flex-1 overflow-hidden">
          <p className={`truncate text-center font-bold text-deep-charcoal dark:text-off-white transition-all duration-300 ${isHeaderCompact ? 'opacity-100 text-sm' : 'opacity-0 text-xs'}`}>
            {recipe.suggestion}
          </p>
        </div>
        <div className={`rounded-full transition-all duration-300 ${isHeaderCompact ? 'size-9' : 'size-10'}`}></div>
      </header>

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
      </div>

      <div className="p-6 space-y-6">
        <div className="surface-card p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-colors">
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

        <div>
          <h3 className="font-bold text-lg mb-3 dark:text-off-white">{t('recipe_ingredients')}</h3>
          <ul className="space-y-2">
            {recipe.ingredients?.map((ing, i) => (
              <li key={i} className="surface-card flex items-center gap-3 p-3 rounded-xl border transition-colors">
                <div className="size-2 rounded-full bg-primary/40"></div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{ing}</span>
              </li>
            )) || <p className="text-gray-400 dark:text-gray-500 italic">{t('recipe_no_ingredients')}</p>}
          </ul>
        </div>

        <div className="surface-card p-5 rounded-2xl border shadow-sm transition-colors">
          <h3 className="font-bold text-lg mb-3 dark:text-off-white">{t('recipe_prep_time')}</h3>
          <p className="text-sm font-semibold text-primary">{recipe.prepTime || t('recipe_prep_time_fallback')}</p>
        </div>

        <div className="surface-card p-5 rounded-2xl border shadow-sm transition-colors">
          <h3 className="font-bold text-lg mb-3 dark:text-off-white">{t('recipe_steps')}</h3>
          <ol className="space-y-2">
            {(recipe.steps || []).map((step, index) => (
              <li key={`${step}-${index}`} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="size-6 rounded-full bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div ref={stitchCardRef} className="rounded-3xl overflow-hidden border shadow-lg bg-gradient-to-br from-primary/90 to-orange-400 text-white p-6">
          <p className="text-[10px] uppercase tracking-widest font-bold opacity-80">{t('recipe_stitch_badge')}</p>
          <h3 className="text-2xl font-bold mt-2 leading-tight">{recipe.suggestion}</h3>
          <p className="text-sm mt-2 opacity-90">{recipe.reasoning}</p>
          <div className="mt-4 flex gap-3 text-xs font-semibold">
            <span className="bg-white/20 px-3 py-1 rounded-full">{t('recipe_protein')}: {recipe.nutrients.protein}</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">{t('recipe_calories')}: {recipe.nutrients.calories}</span>
          </div>
        </div>

        <button
          onClick={handleExportStitchCard}
          disabled={sharing}
          className="w-full flex items-center justify-center gap-2 surface-card border py-3 rounded-2xl font-bold text-deep-charcoal dark:text-off-white active:scale-[0.98] transition-all disabled:opacity-70"
        >
          <span className="material-symbols-outlined text-primary">{sharing ? 'hourglass_top' : 'download'}</span>
          <span>{sharing ? t('recipe_exporting') : t('recipe_export_stitch')}</span>
        </button>
      </div>

      <div className="fixed bottom-safe-24 left-0 right-0 px-6 max-w-md mx-auto z-40">
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
