import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore';
import { calculateNutrientDeviation, getAIInsight } from '../logic/dietaryGuidelines';

const NutritionBall = ({ deviation }) => {
  const { t } = useTranslation();
  // Calculate score based on deviation (lower deviation is better)
  const scores = Object.values(deviation).map(v => Math.abs(v));
  const avgDeviation = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  
  // Score 0-100 (0 deviation = 100 score)
  const healthScore = Math.max(0, 100 - avgDeviation);
  
  // Visual parameters
  const radius = 40 + (healthScore / 100) * 40; // 40 to 80
  const particleCount = Math.floor(healthScore / 2); // 0 to 50
  
  // Color based on score
  const color = healthScore > 80 ? '#22c55e' : healthScore > 50 ? '#f97316' : '#ef4444';

  // Generate particles deterministically
  const particles = useMemo(() => {
    return Array.from({ length: particleCount }).map((_, i) => {
      // Deterministic pseudo-random based on index and healthScore
      const seed = (i + 1) * (Math.floor(healthScore) + 1);
      const rand1 = Math.abs(Math.sin(seed));
      const rand2 = Math.abs(Math.cos(seed));
      const rand3 = Math.abs(Math.sin(seed * 2));
      const rand4 = Math.abs(Math.cos(seed * 2));

      return {
        cx: 50 + (rand1 - 0.5) * radius * 1.5,
        cy: 50 + (rand2 - 0.5) * radius * 1.5,
        r: rand3 * 3 + 1,
        opacity: rand4 * 0.5 + 0.1,
        delay: i * 0.1,
        duration: 2 + rand1
      };
    });
  }, [particleCount, radius, healthScore]);

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative size-64 flex items-center justify-center">
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-all duration-1000"
          style={{ backgroundColor: color, transform: `scale(${healthScore/100})` }}
        ></div>
        
        <svg viewBox="0 0 100 100" className="size-full drop-shadow-lg">
          {/* Main Ball */}
          <circle 
            cx="50" 
            cy="50" 
            r={radius / 2} 
            fill={color} 
            className="transition-all duration-1000 ease-out opacity-90"
          />
          
          {/* Particles */}
          {particles.map((p, i) => (
            <circle
              key={i}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill="white"
              fillOpacity={p.opacity}
              className="animate-pulse"
              style={{ animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
            />
          ))}
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white drop-shadow-md">
          <span className="text-3xl font-bold">{Math.round(healthScore)}</span>
          <span className="text-xs uppercase tracking-wider font-medium">{t('history_health_score')}</span>
        </div>
      </div>
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
        {t('history_based_on_balance')}
      </p>
    </div>
  );
};

const History = () => {
  const { t, i18n } = useTranslation();
  const { dailyMeals, userProfile, removeMeal } = useUserStore();
  
  const deviation = useMemo(() => calculateNutrientDeviation(dailyMeals, userProfile), [dailyMeals, userProfile]);
  const insight = useMemo(() => getAIInsight(deviation, t), [deviation, t]);

  // Sort meals by timestamp desc
  const sortedMeals = useMemo(() => {
    return [...dailyMeals].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [dailyMeals]);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const locale = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen pb-24 p-6 transition-colors duration-200">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-deep-charcoal dark:text-off-white">{t('history_title')}</h1>
        <div className="size-10 rounded-full bg-white dark:bg-deep-charcoal border border-gray-100 dark:border-gray-700 flex items-center justify-center transition-colors">
          <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">calendar_today</span>
        </div>
      </header>

      {/* Visualization */}
      <section className="bg-white dark:bg-deep-charcoal rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors">
        <h2 className="text-lg font-bold mb-2 dark:text-off-white">{t('history_nutrient_balance')}</h2>
        <NutritionBall deviation={deviation} />
      </section>

      {/* AI Insight */}
      <section className="bg-primary/5 dark:bg-primary/20 rounded-2xl p-5 border border-primary/10 dark:border-primary/30 mb-8 flex gap-4 transition-colors">
        <div className="size-10 rounded-full bg-primary flex items-center justify-center shrink-0 text-white shadow-sm">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        <div>
          <h3 className="font-bold text-primary text-sm mb-1">{t('history_ai_insight')}</h3>
          <p className="text-sm text-deep-charcoal/80 dark:text-off-white/80 leading-relaxed">
            {insight}
          </p>
        </div>
      </section>

      {/* Meal History List */}
      <section className="space-y-4 mb-8">
        <h2 className="text-lg font-bold dark:text-off-white">{t('history_recent_meals')}</h2>
        {sortedMeals.length === 0 ? (
           <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm bg-white dark:bg-deep-charcoal rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 transition-colors">
            {t('history_no_meals')}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMeals.map((meal) => (
              <div key={meal.id} className="bg-white dark:bg-deep-charcoal p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0 transition-colors">
                    <span className="material-symbols-outlined">restaurant</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-deep-charcoal dark:text-off-white">{meal.name}</h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(meal.timestamp)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-bold bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full transition-colors">
                    {meal.calories} {t('history_kcal_unit')}
                  </span>
                  <button 
                    onClick={() => removeMeal(meal.id)}
                    className="text-[10px] text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {t('history_remove')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats Breakdown */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold dark:text-off-white">{t('history_nutrient_breakdown')}</h2>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(deviation).map(([nutrient, val]) => (
            <div key={nutrient} className="bg-white dark:bg-deep-charcoal p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-3">
                <div className={`size-2 rounded-full ${val > 20 ? 'bg-red-500' : val < -20 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                <span className="capitalize font-medium text-sm dark:text-off-white">{t(`history_nutrient_${nutrient}`, { defaultValue: nutrient.replace(/([A-Z])/g, ' $1').trim() })}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${val > 0 ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {val > 0 ? '+' : ''}{val.toFixed(0)}%
                </span>
                <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden transition-colors">
                  <div 
                    className={`h-full rounded-full ${val > 20 ? 'bg-red-500' : val < -20 ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, Math.abs(val) + 50)}%` }} // Visual representation
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default History;
