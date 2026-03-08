import React, { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { RDA_DATA } from '../logic/dietaryGuidelines';
import { generatePrompt, callAI } from '../services/aiService';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHeaderMotion } from '../lib/useHeaderMotion';

const Vibe = () => {
  const { t, i18n } = useTranslation();
  const { userProfile, updateUserProfile, dailyMeals } = useUserStore();
  const [mood, setMood] = useState(userProfile.currentMood || 50);
  const [selectedLifeStage, setSelectedLifeStage] = useState(userProfile.lifeStage || 'adult');
  const [dietaryIntents, setDietaryIntents] = useState(userProfile.dietaryIntents || []);
  const [cravings, setCravings] = useState(userProfile.cravings || []);
  const [weather, setWeather] = useState('mild');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [presetApplied, setPresetApplied] = useState(false);
  const { isHeaderCompact, isHeaderHidden } = useHeaderMotion({ hideAt: 100 });

  // Sync store with local state on mount
  useEffect(() => {
    setMood(userProfile.currentMood);
    setSelectedLifeStage(userProfile.lifeStage);
    setDietaryIntents(userProfile.dietaryIntents || []);
    setCravings(userProfile.cravings || []);
  }, [userProfile]);

  useEffect(() => {
    const preset = location.state?.preset;
    if (!preset || presetApplied) return;

    if (Array.isArray(preset.dietaryIntents) && preset.dietaryIntents.length > 0) {
      setDietaryIntents((current) => Array.from(new Set([...(current || []), ...preset.dietaryIntents])));
    }
    if (Array.isArray(preset.cravings) && preset.cravings.length > 0) {
      setCravings((current) => Array.from(new Set([...(current || []), ...preset.cravings])));
    }
    setPresetApplied(true);
  }, [location.state, presetApplied]);

  const handleIntentToggle = (intent) => {
    if (dietaryIntents.includes(intent)) {
      setDietaryIntents(dietaryIntents.filter((i) => i !== intent));
    } else {
      setDietaryIntents([...dietaryIntents, intent]);
    }
  };

  const handleCravingToggle = (craving) => {
    if (cravings.includes(craving)) {
      setCravings(cravings.filter((c) => c !== craving));
    } else {
      setCravings([...cravings, craving]);
    }
  };

  const handleRefineSelection = async () => {
    setLoading(true);
    setErrorMessage('');
    const outputLanguage = i18n.language?.startsWith('zh') ? 'zh' : 'en';
    const currentHour = new Date().getHours();
    const mealMoment = currentHour < 11 ? 'breakfast' : currentHour < 16 ? 'lunch' : 'dinner';
    const profilePayload = {
      currentMood: mood,
      lifeStage: selectedLifeStage,
      dietaryIntents,
      cravings,
    };

    const profileUpdatePromise = updateUserProfile(profilePayload);
    const profileTimeoutResult = await Promise.race([
      profileUpdatePromise,
      new Promise((resolve) => setTimeout(() => resolve({ ok: true, localOnly: true, timeout: true }), 1800)),
    ]);
    if (!profileTimeoutResult?.ok) {
      setErrorMessage(t('vibe_profile_save_failed'));
    } else if (profileTimeoutResult?.localOnly || profileTimeoutResult?.timeout) {
      profileUpdatePromise.catch(() => null);
    }

    const prompt = generatePrompt({
      ...userProfile,
      currentMood: mood,
      lifeStage: selectedLifeStage,
      dietaryIntents,
      cravings,
    }, dailyMeals, outputLanguage, { mealMoment, weather });

    try {
      const result = await callAI(prompt, outputLanguage);
      navigate('/recipe', {
        state: {
          recipe: result,
          generationParams: {
            currentMood: mood,
            lifeStage: selectedLifeStage,
            dietaryIntents,
            cravings,
            weather,
            mealMoment
          }
        }
      });
    } catch (error) {
      const code = error?.code;
      const keyByCode = {
        AI_KEY_MISSING: 'vibe_generate_missing_key',
        AI_NETWORK_FAILED: 'vibe_generate_network_failed',
        AI_REQUEST_FAILED: 'vibe_generate_request_failed',
        AI_EMPTY_RESPONSE: 'vibe_generate_empty_response',
        AI_INVALID_JSON: 'vibe_generate_invalid_json',
      };
      const message = t(keyByCode[code] || 'vibe_generate_failed');
      const statusSuffix = typeof error?.status === 'number' ? ` (${error.status})` : '';
      setErrorMessage(`${message}${statusSuffix}`);
    } finally {
      setLoading(false);
    }
  };

  const getMoodEmoji = (value) => {
    if (value < 20) return '😫'; // Stressed
    if (value < 40) return '😟'; // Anxious
    if (value < 60) return '😐'; // Neutral
    if (value < 80) return '🙂'; // Good
    return '🤩'; // Ecstatic
  };

  return (
    <div className="surface-page min-h-screen p-6 pb-24 font-display text-deep-charcoal dark:text-off-white transition-colors duration-200">
      <header
        className={`surface-nav sticky top-0 z-30 flex items-center justify-between -mx-6 px-6 mb-8 border-b transition-[transform,padding,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isHeaderCompact ? 'shadow-sm' : ''}`}
        style={{
          paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isHeaderCompact ? '0.5rem' : '1.5rem'})`,
          paddingBottom: isHeaderCompact ? '0.65rem' : '1rem',
          transform: isHeaderHidden ? 'translateY(-100%)' : 'translateY(0)',
          opacity: isHeaderHidden ? 0.98 : 1,
          willChange: 'transform'
        }}
      >
        <h1 className={`font-bold transition-all duration-300 ${isHeaderCompact ? 'text-xl' : 'text-2xl'}`}>{t('vibe_title')}</h1>
        <div className={`rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary transition-all duration-300 ${isHeaderCompact ? 'size-9' : 'size-10'}`}>
          <span className={`material-symbols-outlined transition-all duration-300 ${isHeaderCompact ? 'text-[20px]' : 'text-[24px]'}`}>auto_awesome</span>
        </div>
      </header>

      {/* Mood Slider */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{t('vibe_mood_question')}</h2>
          <span className="text-3xl">{getMoodEmoji(mood)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={mood}
          onChange={(e) => setMood(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary transition-colors"
        />
        <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider transition-colors">
          <span>{t('vibe_mood_stressed')}</span>
          <span>{t('vibe_mood_ecstatic')}</span>
        </div>
      </section>

      {/* Life Stage Selection */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">{t('vibe_life_stage')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(RDA_DATA).map(([key]) => (
            <button
              key={key}
              onClick={() => setSelectedLifeStage(key)}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                selectedLifeStage === key
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
      </section>

      {/* Cravings Selection */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-4">{t('vibe_cravings_title')}</h2>
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
                cravings.includes(item.id)
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'surface-card border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Dietary Intents */}
      <section className="mb-24">
        <h2 className="text-lg font-bold mb-4">{t('vibe_dietary_goals')}</h2>
        <div className="space-y-3">
          {[
            { id: 'plant_based', label: t('vibe_goal_plant_based'), icon: 'potted_plant', color: 'text-green-600' },
            { id: 'sugar_control', label: t('vibe_goal_sugar_control'), icon: 'water_drop', color: 'text-blue-500' },
            { id: 'high_protein', label: t('vibe_goal_high_protein'), icon: 'fitness_center', color: 'text-orange-500' },
          ].map((intent) => (
            <div
              key={intent.id}
              onClick={() => handleIntentToggle(intent.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                dietaryIntents.includes(intent.id)
                  ? 'surface-card border-primary shadow-sm ring-1 ring-primary/20'
                  : 'surface-card border hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${intent.color}`}>{intent.icon}</span>
                <span className="font-semibold text-sm dark:text-off-white">{intent.label}</span>
              </div>
              <div className={`size-5 rounded-full border flex items-center justify-center ${
                dietaryIntents.includes(intent.id) ? 'bg-primary border-primary' : 'border-gray-200 dark:border-gray-600'
              }`}>
                {dietaryIntents.includes(intent.id) && (
                  <span className="material-symbols-outlined text-white text-xs">check</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-28">
        <h2 className="text-lg font-bold mb-4">{t('vibe_weather_title')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'hot', label: t('vibe_weather_hot'), icon: 'light_mode' },
            { id: 'mild', label: t('vibe_weather_mild'), icon: 'partly_cloudy_day' },
            { id: 'cold', label: t('vibe_weather_cold'), icon: 'ac_unit' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setWeather(item.id)}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                weather === item.id
                  ? 'bg-primary/10 dark:bg-primary/20 border-primary text-primary shadow-sm'
                  : 'surface-card border text-muted-ui hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              <span className="text-xs font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {errorMessage ? (
        <div className="mb-24 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <div className="fixed bottom-safe-24 left-0 right-0 px-6 max-w-md mx-auto z-40">
        <button
          onClick={handleRefineSelection}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl shadow-lg shadow-primary/30 font-bold active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {loading ? (
            <span className="animate-spin material-symbols-outlined">refresh</span>
          ) : (
            <>
              <span>{t('vibe_refine_selection')}</span>
              <span className="material-symbols-outlined">auto_awesome</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Vibe;
