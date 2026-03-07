import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore';
import { useHeaderMotion } from '../lib/useHeaderMotion';
import { calculateNutrientDeviation, getAIInsight } from '../logic/dietaryGuidelines';

const Home = () => {
  const { t } = useTranslation();
  const { user, dailyMeals, userProfile, accountProfile } = useUserStore();
  const navigate = useNavigate();
  const { isHeaderCompact, isHeaderHidden } = useHeaderMotion();

  const userName = accountProfile?.display_name || user?.email?.split('@')[0] || t('home_default_name');
  const hour = new Date().getHours();
  const timeGreeting = hour < 11
    ? t('home_time_morning', { defaultValue: 'Good morning' })
    : hour < 17
      ? t('home_time_afternoon', { defaultValue: 'Good afternoon' })
      : t('home_time_evening', { defaultValue: 'Good evening' });
  const todayMealCount = useMemo(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const end = start + 86400000;
    return dailyMeals.filter((meal) => {
      const ts = new Date(meal.timestamp).getTime();
      return ts >= start && ts < end;
    }).length;
  }, [dailyMeals]);

  const todayDeviation = useMemo(() => {
    return calculateNutrientDeviation(dailyMeals, userProfile, 'today');
  }, [dailyMeals, userProfile]);

  const todayScore = useMemo(() => {
    const scores = Object.values(todayDeviation).map((v) => Math.abs(v));
    const avgDeviation = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
    return Math.max(0, 100 - avgDeviation);
  }, [todayDeviation]);

  const topGap = useMemo(() => {
    const entries = Object.entries(todayDeviation);
    const negative = entries.filter(([, v]) => v < -10);
    negative.sort((a, b) => a[1] - b[1]);
    const [nutrient, value] = negative[0] || [];
    return nutrient ? { nutrient, value } : null;
  }, [todayDeviation]);

  const aiMessage = useMemo(() => {
    if (todayMealCount === 0) {
      return t('home_ai_empty', { defaultValue: 'No meals yet. Want a quick suggestion for your next bite?' });
    }
    return getAIInsight(todayDeviation, t);
  }, [t, todayDeviation, todayMealCount]);

  const buildPresetFromGap = () => {
    const dietaryIntents = [];
    const cravings = [];
    if (todayDeviation.protein < -20) dietaryIntents.push('high_protein');
    if (todayDeviation.calories > 20) {
      dietaryIntents.push('sugar_control');
      cravings.push('fresh');
    }
    if (todayDeviation.iron < -20) cravings.push('salty');
    if (todayDeviation.vitaminD < -20) cravings.push('comfort');
    return { dietaryIntents: Array.from(new Set(dietaryIntents)), cravings: Array.from(new Set(cravings)) };
  };

  return (
    <div className="surface-page relative flex min-h-screen w-full flex-col pb-32 transition-colors duration-200">
      <header
        className={`surface-nav sticky top-0 z-30 shrink-0 flex items-center justify-between px-6 border-b transition-[transform,padding,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isHeaderCompact ? 'shadow-sm' : ''}`}
        style={{
          paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isHeaderCompact ? '0.5rem' : '1.5rem'})`,
          paddingBottom: isHeaderCompact ? '0.4rem' : '0.5rem',
          transform: isHeaderHidden ? 'translateY(-100%)' : 'translateY(0)',
          opacity: isHeaderHidden ? 0.98 : 1,
          willChange: 'transform'
        }}
      >
        <div className="flex items-center gap-2">
          <div className={`bg-primary/10 dark:bg-primary/20 rounded-full transition-all duration-300 ${isHeaderCompact ? 'p-1.5' : 'p-2'}`}>
            <span className={`material-symbols-outlined text-primary transition-all duration-300 ${isHeaderCompact ? 'text-xl' : 'text-2xl'}`} style={{ fontVariationSettings: "'FILL' 1" }}>flare</span>
          </div>
          <div>
            <h1 className={`font-bold tracking-tight text-deep-charcoal dark:text-off-white transition-all duration-300 ${isHeaderCompact ? 'text-lg' : 'text-xl'}`}>{t('app_title')}</h1>
            <p className={`text-xs text-muted-ui font-medium transition-all duration-300 ${isHeaderCompact ? 'max-h-0 opacity-0 -translate-y-1 overflow-hidden' : 'max-h-5 opacity-100 translate-y-0'}`}>{timeGreeting} · {t('home_greeting', { name: userName })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className={`surface-muted border border-primary/10 dark:border-primary/20 rounded-full shadow-sm transition-all duration-300 ${isHeaderCompact ? 'p-1.5' : 'p-2'}`}>
            <span className={`material-symbols-outlined text-deep-charcoal dark:text-off-white transition-all duration-300 ${isHeaderCompact ? 'text-[20px]' : 'text-[24px]'}`}>notifications</span>
          </button>
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="ai-bubble-shape surface-muted border border-primary/20 dark:border-primary/40 p-6 shadow-xl shadow-primary/5 dark:shadow-primary/20 max-w-[85%] mx-auto relative transition-colors">
          <div className="flex flex-col gap-2 items-center text-center">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-primary/60">{t('home_empathetic_ai')}</span>
            </div>
            <p className="text-deep-charcoal dark:text-off-white text-lg font-medium leading-snug transition-colors">
              {aiMessage}
            </p>
          </div>
          <div className="surface-muted absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-r border-b border-primary/20 dark:border-primary/40 transition-colors"></div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="surface-card rounded-3xl border shadow-sm p-4 transition-colors">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-ui font-bold">{t('home_quick_start')}</p>
              <p className="text-sm font-semibold text-deep-charcoal dark:text-off-white mt-1">
                {user ? t('home_status_signed_in') : t('home_status_guest')}
              </p>
              <p className="mt-1 text-xs text-muted-ui">
                {t('home_today_brief', {
                  defaultValue: 'Today score {{score}} · {{count}} meals',
                  score: Math.round(todayScore),
                  count: todayMealCount,
                })}
                {topGap
                  ? ` · ${t(`history_nutrient_${topGap.nutrient}`, { defaultValue: topGap.nutrient })} ${topGap.value.toFixed(0)}%`
                  : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-ui">{t('home_today_meals')}</p>
              <p className="text-2xl font-bold text-primary">{todayMealCount}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button
              onClick={() => {
                const preset = buildPresetFromGap();
                navigate('/vibe', { state: { preset } });
              }}
              className="surface-muted rounded-2xl border px-3 py-2.5 text-sm font-semibold text-deep-charcoal dark:text-off-white"
            >
              {t('home_continue_vibe')}
            </button>
            <button
              onClick={() => navigate('/history')}
              className="surface-muted rounded-2xl border px-3 py-2.5 text-sm font-semibold text-deep-charcoal dark:text-off-white"
            >
              {t('home_view_history')}
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 px-6 py-2 flex flex-col justify-center">
        <div className="relative group">
          <div className="surface-card rounded-xl overflow-hidden shadow-2xl shadow-primary/20 transition-colors">
            <div className="aspect-[4/5] w-full relative">
              <img alt={t('home_food_vibe_alt')} className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h2 className="text-3xl font-bold mb-2">{t('home_discover_eat')}</h2>
                <p className="text-white/90 text-lg italic font-light">{t('home_personalized_desc')}</p>
                <div className="flex gap-4 mt-6">
                  <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/30">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    <span className="text-xs font-medium tracking-wide">{t('home_ai_powered')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="px-6 pt-10 pb-4">
        <button 
          onClick={() => {
            const preset = buildPresetFromGap();
            navigate('/vibe', { state: { preset } });
          }}
          className="w-full bg-primary hover:bg-[#ff8552] text-white py-5 rounded-full font-bold text-xl shadow-xl shadow-primary/40 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
        >
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'wght' 700" }}>search</span>
          <span>{t('home_find_what_to_eat')}</span>
        </button>
      </div>
      <div className="h-20"></div>
    </div>
  );
};

export default Home;
