import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore';
import Auth from '../components/Auth';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useHeaderMotion } from '../lib/useHeaderMotion';
import { RDA_DATA, calculateNutrientDeviation } from '../logic/dietaryGuidelines';

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut, isDarkMode, toggleDarkMode, userProfile, updateUserProfile, dailyMeals, favorites, toggleFavorite } = useUserStore();
  const { isHeaderCompact, isHeaderHidden } = useHeaderMotion({ hideAt: 90 });
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [signingOut, setSigningOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileDraft, setProfileDraft] = useState(userProfile);
  const [showAllFavorites, setShowAllFavorites] = useState(false);

  useEffect(() => {
    setProfileDraft(userProfile);
  }, [userProfile]);

  const last7DaysMeals = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).getTime();
    return dailyMeals.filter((meal) => new Date(meal.timestamp).getTime() >= startOfWeek);
  }, [dailyMeals]);

  const consistencyPercent = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d.toISOString().slice(0, 10);
    });
    const loggedDays = new Set(last7DaysMeals.map((m) => new Date(m.timestamp).toISOString().slice(0, 10)));
    const count = days.filter((d) => loggedDays.has(d)).length;
    return Math.round((count / 7) * 100);
  }, [last7DaysMeals]);

  const deviationWeek = useMemo(() => {
    return calculateNutrientDeviation(dailyMeals, userProfile, 'week');
  }, [dailyMeals, userProfile]);

  const avgAbsDeviation = useMemo(() => {
    const scores = Object.values(deviationWeek).map((v) => Math.abs(v));
    return scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  }, [deviationWeek]);

  const nutrientsLevel = useMemo(() => {
    if (avgAbsDeviation < 15) return t('profile_level_high', { defaultValue: 'High' });
    if (avgAbsDeviation < 30) return t('profile_level_medium', { defaultValue: 'Medium' });
    return t('profile_level_low', { defaultValue: 'Low' });
  }, [avgAbsDeviation, t]);

  const satisfactionScore = useMemo(() => {
    const meals = last7DaysMeals.length;
    const fav = favorites.length;
    if (meals === 0) return 0;
    return Math.min(5, Math.max(3, (fav / meals) * 5)).toFixed(1);
  }, [favorites.length, last7DaysMeals.length]);

  const syncPercent = useMemo(() => {
    const completeness = [
      Boolean(profileDraft?.lifeStage),
      Array.isArray(profileDraft?.dietaryIntents),
      Array.isArray(profileDraft?.cravings),
      Array.isArray(profileDraft?.allergies),
      profileDraft?.heightCm !== '',
      profileDraft?.weightKg !== '',
    ].filter(Boolean).length;
    return Math.round((completeness / 6) * 100);
  }, [profileDraft]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setFeedback({ type: '', message: '' });
    setSigningOut(true);
    const result = await signOut();
    setSigningOut(false);
    if (result?.ok) {
      setFeedback({ type: 'success', message: t('profile_logout_success') });
      return;
    }
    setFeedback({ type: 'error', message: t('profile_logout_failed') });
  };

  const handleSaveProfile = async () => {
    if (saving) return;
    setFeedback({ type: '', message: '' });
    setSaving(true);
    const result = await updateUserProfile(profileDraft);
    setSaving(false);
    if (result?.ok) {
      setFeedback({ type: 'success', message: t('profile_saved', { defaultValue: 'Saved.' }) });
      return;
    }
    setFeedback({ type: 'error', message: t('profile_save_failed', { defaultValue: 'Save failed.' }) });
  };

  const handleDietaryToggle = (id) => {
    setProfileDraft((current) => {
      const list = Array.isArray(current.dietaryIntents) ? current.dietaryIntents : [];
      return list.includes(id)
        ? { ...current, dietaryIntents: list.filter((x) => x !== id) }
        : { ...current, dietaryIntents: [...list, id] };
    });
  };

  const handleCravingToggle = (id) => {
    setProfileDraft((current) => {
      const list = Array.isArray(current.cravings) ? current.cravings : [];
      return list.includes(id)
        ? { ...current, cravings: list.filter((x) => x !== id) }
        : { ...current, cravings: [...list, id] };
    });
  };

  if (!user) {
    return (
      <div className="surface-page min-h-screen pb-20 text-deep-charcoal transition-colors duration-200 dark:text-off-white">
         <header
          className={`surface-nav sticky top-0 z-30 flex items-center justify-between px-6 border-b transition-[transform,padding,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isHeaderCompact ? 'shadow-sm' : ''}`}
          style={{
            paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isHeaderCompact ? '0.5rem' : '1.5rem'})`,
            paddingBottom: isHeaderCompact ? '0.5rem' : '0.75rem',
            transform: isHeaderHidden ? 'translateY(-100%)' : 'translateY(0)',
            opacity: isHeaderHidden ? 0.98 : 1,
            willChange: 'transform'
          }}
        >
          <div className={`flex items-center justify-start transition-all duration-300 ${isHeaderCompact ? 'w-9 h-9' : 'w-10 h-10'}`}>
            <button onClick={() => navigate(-1)} className="text-dark-grey transition-colors hover:text-deep-charcoal dark:text-gray-400 dark:hover:text-off-white">
              <span className={`material-symbols-outlined transition-all duration-300 ${isHeaderCompact ? 'text-[24px]' : 'text-[28px]'}`}>chevron_left</span>
            </button>
          </div>
          <h1 className={`font-bold tracking-tight text-deep-charcoal dark:text-off-white transition-all duration-300 ${isHeaderCompact ? 'text-base' : 'text-lg'}`}>{t('profile_account')}</h1>
          <div className={`flex items-center justify-end transition-all duration-300 ${isHeaderCompact ? 'gap-2' : 'gap-3'}`}>
            <button onClick={toggleDarkMode} className="text-primary hover:text-primary-alt transition-colors" title={isDarkMode ? t('profile_switch_to_light_mode') : t('profile_switch_to_dark_mode')}>
              <span className={`material-symbols-outlined transition-all duration-300 ${isHeaderCompact ? 'text-[20px]' : 'text-[24px]'}`}>
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <LanguageSwitcher />
          </div>
        </header>
        {feedback.message ? (
          <div className={`mx-6 mt-4 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'
          }`}>
            {feedback.message}
          </div>
        ) : null}
        <div className="mx-6 mt-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-deep-charcoal dark:border-primary/30 dark:bg-primary/10 dark:text-off-white">
          {t('profile_login_hint')}
        </div>
        <Auth />
      </div>
    );
  }

  return (
    <div className="surface-page relative min-h-screen w-full pb-32 text-deep-charcoal transition-colors duration-200 dark:text-off-white">
        <header
          className={`surface-nav sticky top-0 z-30 flex items-center justify-between px-6 border-b transition-[transform,padding,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isHeaderCompact ? 'shadow-sm' : ''}`}
          style={{
            paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isHeaderCompact ? '0.5rem' : '1.5rem'})`,
            paddingBottom: isHeaderCompact ? '0.5rem' : '0.75rem',
            transform: isHeaderHidden ? 'translateY(-100%)' : 'translateY(0)',
            opacity: isHeaderHidden ? 0.98 : 1,
            willChange: 'transform'
          }}
        >
          <div className={`flex items-center justify-start transition-all duration-300 ${isHeaderCompact ? 'w-9 h-9' : 'w-10 h-10'}`}>
            <button onClick={() => navigate(-1)} className="text-dark-grey transition-colors hover:text-deep-charcoal dark:text-gray-400 dark:hover:text-off-white">
              <span className={`material-symbols-outlined transition-all duration-300 ${isHeaderCompact ? 'text-[24px]' : 'text-[28px]'}`}>chevron_left</span>
            </button>
          </div>
          <h1 className={`font-bold tracking-tight text-deep-charcoal dark:text-off-white transition-all duration-300 ${isHeaderCompact ? 'text-base' : 'text-lg'}`}>{t('profile_my_profile')}</h1>
          <div className={`flex items-center justify-end transition-all duration-300 ${isHeaderCompact ? 'gap-2' : 'gap-3'}`}>
            <button onClick={toggleDarkMode} className="text-primary hover:text-primary-alt transition-colors" title={isDarkMode ? t('profile_switch_to_light_mode') : t('profile_switch_to_dark_mode')}>
              <span className={`material-symbols-outlined transition-all duration-300 ${isHeaderCompact ? 'text-[20px]' : 'text-[24px]'}`}>
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <LanguageSwitcher />
            <button onClick={handleSignOut} disabled={signingOut} className="text-primary hover:text-primary-alt transition-colors disabled:opacity-70" title={t('profile_sign_out')}>
              <span className={`material-symbols-outlined transition-all duration-300 ${isHeaderCompact ? 'text-[20px]' : 'text-[24px]'}`}>{signingOut ? 'refresh' : 'logout'}</span>
            </button>
          </div>
        </header>

        {feedback.message ? (
          <div className={`mx-6 mt-4 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'
          }`}>
            {feedback.message}
          </div>
        ) : null}

        <main className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
          <section className="flex flex-col items-center px-6 mt-2">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-primary/5 p-1 bg-white dark:bg-deep-charcoal transition-colors">
                <div className="w-full h-full rounded-full bg-cover bg-center overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-4xl text-gray-300 transition-colors">
                   {/* Placeholder avatar based on email first letter */}
                   {user.email?.[0].toUpperCase()}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full border-2 border-white dark:border-deep-charcoal shadow-md flex items-center gap-1 transition-colors">
                <span className="material-symbols-outlined text-[12px] fill-1">workspace_premium</span>
                {t('profile_member')}
              </div>
            </div>
            <div className="text-center mt-4">
              <h2 className="text-2xl font-bold text-deep-charcoal dark:text-off-white">{user.email?.split('@')[0]}</h2>
              <p className="text-primary text-sm font-medium mt-1">{user.email}</p>
            </div>
          </section>

          <section className="px-6 mt-8">
            <div className="persona-card rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                <span className="text-xs font-bold text-primary tracking-widest uppercase">{t('profile_ai_persona')}</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-deep-charcoal dark:text-off-white">{t('profile_persona_title')}</h3>
              <p className="text-dark-grey text-sm leading-relaxed italic dark:text-gray-400">
                {t('profile_persona_desc')}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${syncPercent}%` }}></div>
                </div>
                <span className="text-[10px] font-bold text-dark-grey/50 dark:text-gray-500">{syncPercent}% {t('profile_sync')}</span>
              </div>
            </div>
          </section>

          <section className="px-6 mt-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-primary mb-2 text-[24px]">calendar_today</span>
                <span className="text-[10px] text-dark-grey font-semibold uppercase tracking-tighter dark:text-gray-400">{t('profile_consistency')}</span>
                <span className="text-lg font-bold text-deep-charcoal dark:text-off-white">{consistencyPercent}%</span>
              </div>
              <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-primary mb-2 text-[24px]">nutrition</span>
                <span className="text-[10px] text-dark-grey font-semibold uppercase tracking-tighter dark:text-gray-400">{t('profile_nutrients')}</span>
                <span className="text-lg font-bold text-deep-charcoal dark:text-off-white">{nutrientsLevel}</span>
              </div>
              <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-primary mb-2 text-[24px]">favorite</span>
                <span className="text-[10px] text-dark-grey font-semibold uppercase tracking-tighter dark:text-gray-400">{t('profile_satisfaction')}</span>
                <span className="text-lg font-bold text-deep-charcoal dark:text-off-white">{satisfactionScore}</span>
              </div>
            </div>
          </section>

          <section className="px-6 mt-8">
            <div className="surface-card rounded-3xl border shadow-sm p-5 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-deep-charcoal dark:text-off-white">{t('profile_settings', { defaultValue: 'My Settings' })}</h3>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-4 py-2 rounded-full bg-primary text-white text-sm font-bold disabled:opacity-70"
                >
                  {saving ? t('history_saving', { defaultValue: 'Saving...' }) : t('common_save', { defaultValue: 'Save' })}
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-ui font-bold mb-3">{t('vibe_life_stage')}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(RDA_DATA).map(([key]) => (
                      <button
                        key={key}
                        onClick={() => setProfileDraft((current) => ({ ...current, lifeStage: key }))}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                          profileDraft.lifeStage === key
                            ? 'bg-primary/10 dark:bg-primary/20 border-primary text-primary shadow-sm'
                            : 'surface-card border text-muted-ui hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl">
                          {key === 'infant' ? 'child_care' :
                           key === 'toddler' ? 'baby_changing_station' :
                           key === 'child' ? 'skateboarding' :
                           key === 'teen' ? 'school' :
                           key === 'adult' ? 'person' :
                           key === 'senior' ? 'elderly' :
                           key === 'pregnant' ? 'pregnant_woman' :
                           key === 'chronic' ? 'monitor_heart' :
                           'spa'}
                        </span>
                        <span className="text-[10px] font-medium text-center leading-tight">
                          {t(`lifestage_${key}`)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-ui font-bold mb-3">{t('vibe_dietary_goals')}</p>
                  <div className="space-y-3">
                    {[
                      { id: 'plant_based', label: t('vibe_goal_plant_based'), icon: 'potted_plant', color: 'text-green-600' },
                      { id: 'sugar_control', label: t('vibe_goal_sugar_control'), icon: 'water_drop', color: 'text-blue-500' },
                      { id: 'high_protein', label: t('vibe_goal_high_protein'), icon: 'fitness_center', color: 'text-orange-500' },
                    ].map((intent) => (
                      <div
                        key={intent.id}
                        onClick={() => handleDietaryToggle(intent.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                          (profileDraft.dietaryIntents || []).includes(intent.id)
                            ? 'surface-card border-primary shadow-sm ring-1 ring-primary/20'
                            : 'surface-card border hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined ${intent.color}`}>{intent.icon}</span>
                          <span className="font-semibold text-sm dark:text-off-white">{intent.label}</span>
                        </div>
                        <div className={`size-5 rounded-full border flex items-center justify-center ${
                          (profileDraft.dietaryIntents || []).includes(intent.id) ? 'bg-primary border-primary' : 'border-gray-200 dark:border-gray-600'
                        }`}>
                          {(profileDraft.dietaryIntents || []).includes(intent.id) && (
                            <span className="material-symbols-outlined text-white text-xs">check</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-ui font-bold mb-3">{t('vibe_cravings_title')}</p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { id: 'spicy', label: t('vibe_cravings_spicy'), icon: 'whatshot' },
                      { id: 'sweet', label: t('vibe_cravings_sweet'), icon: 'cake' },
                      { id: 'salty', label: t('vibe_cravings_salty'), icon: 'soup_kitchen' },
                      { id: 'comfort', label: t('vibe_cravings_comfort'), icon: 'favorite' },
                      { id: 'crunchy', label: t('vibe_cravings_crunchy'), icon: 'cookie' },
                      { id: 'fresh', label: t('vibe_cravings_fresh'), icon: 'local_florist' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleCravingToggle(item.id)}
                        className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${
                          (profileDraft.cravings || []).includes(item.id)
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'surface-card border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-ui font-bold mb-2">{t('profile_height', { defaultValue: 'Height (cm)' })}</p>
                    <input
                      value={profileDraft.heightCm}
                      onChange={(e) => setProfileDraft((current) => ({ ...current, heightCm: e.target.value }))}
                      inputMode="numeric"
                      className="w-full rounded-2xl border px-4 py-3 bg-white dark:bg-gray-900 text-sm"
                      placeholder="170"
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-ui font-bold mb-2">{t('profile_weight', { defaultValue: 'Weight (kg)' })}</p>
                    <input
                      value={profileDraft.weightKg}
                      onChange={(e) => setProfileDraft((current) => ({ ...current, weightKg: e.target.value }))}
                      inputMode="numeric"
                      className="w-full rounded-2xl border px-4 py-3 bg-white dark:bg-gray-900 text-sm"
                      placeholder="65"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-ui font-bold mb-2">{t('profile_allergies', { defaultValue: 'Allergies (comma separated)' })}</p>
                  <input
                    value={(profileDraft.allergies || []).join(', ')}
                    onChange={(e) => {
                      const next = e.target.value
                        .split(',')
                        .map((x) => x.trim())
                        .filter(Boolean);
                      setProfileDraft((current) => ({ ...current, allergies: next }));
                    }}
                    className="w-full rounded-2xl border px-4 py-3 bg-white dark:bg-gray-900 text-sm"
                    placeholder={t('profile_allergies_placeholder', { defaultValue: 'e.g. peanuts, milk' })}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 px-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-deep-charcoal dark:text-off-white">{t('profile_my_favorites')}</h3>
              <button
                onClick={() => setShowAllFavorites((v) => !v)}
                className="text-primary text-xs font-bold"
              >
                {showAllFavorites ? t('common_collapse', { defaultValue: 'Collapse' }) : t('profile_view_all')}
              </button>
            </div>
            <div className="space-y-4">
              {favorites.length === 0 ? (
                <div className="surface-card text-center py-8 text-muted-ui text-sm rounded-2xl border border-dashed transition-colors">
                  {t('profile_no_favorites', { defaultValue: 'No favorites yet. Save one from a recipe.' })}
                </div>
              ) : (
                favorites.slice(0, showAllFavorites ? favorites.length : 5).map((fav) => (
                  <div key={fav.id} className="flex items-center gap-4 recipe-card rounded-2xl p-3 shadow-sm">
                    <div
                      className="w-16 h-16 rounded-xl bg-cover bg-center flex-shrink-0 bg-gray-100 dark:bg-gray-800"
                      style={fav.imageUrl ? { backgroundImage: `url('${fav.imageUrl}')` } : undefined}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm mb-1 truncate text-deep-charcoal dark:text-off-white">{fav.title}</p>
                      <div className="flex items-center gap-2 text-[10px] text-dark-grey/70 dark:text-gray-400">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">schedule</span> {fav.recipe?.prepTime || t('recipe_prep_time_fallback')}</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">local_fire_department</span> {fav.recipe?.nutrients?.protein || '--'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(fav.recipe || { suggestion: fav.title })}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>

    </div>
  );
};

export default Profile;
