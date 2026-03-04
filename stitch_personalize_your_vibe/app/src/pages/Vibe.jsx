import React, { useState, useEffect } from 'react';
import { useUserStore } from '../store/userStore';
import { RDA_DATA } from '../logic/dietaryGuidelines';
import { generatePrompt, callAI } from '../services/aiService';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Vibe = () => {
  const { t } = useTranslation();
  const { userProfile, updateUserProfile, dailyMeals } = useUserStore();
  const [mood, setMood] = useState(userProfile.currentMood || 50);
  const [selectedLifeStage, setSelectedLifeStage] = useState(userProfile.lifeStage || 'adult');
  const [dietaryIntents, setDietaryIntents] = useState(userProfile.dietaryIntents || []);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Sync store with local state on mount
  useEffect(() => {
    setMood(userProfile.currentMood);
    setSelectedLifeStage(userProfile.lifeStage);
    setDietaryIntents(userProfile.dietaryIntents || []);
  }, [userProfile]);

  const handleIntentToggle = (intent) => {
    if (dietaryIntents.includes(intent)) {
      setDietaryIntents(dietaryIntents.filter((i) => i !== intent));
    } else {
      setDietaryIntents([...dietaryIntents, intent]);
    }
  };

  const handleRefineSelection = async () => {
    setLoading(true);
    // 1. Update store
    updateUserProfile({
      currentMood: mood,
      lifeStage: selectedLifeStage,
      dietaryIntents,
    });

    // 2. Generate prompt
    const prompt = generatePrompt({
      ...userProfile,
      currentMood: mood,
      lifeStage: selectedLifeStage,
      dietaryIntents,
    }, dailyMeals);

    console.log('Generated Prompt:', prompt);

    // 3. Call AI
    try {
      const result = await callAI(prompt);
      console.log('AI Result:', result);
      // Navigate to Recipe page with result
      navigate('/recipe', { state: { recipe: result } });
    } catch (error) {
      console.error('AI Error:', error);
      alert('Failed to generate suggestion. Please try again.');
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
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-6 pb-24 font-display text-deep-charcoal dark:text-off-white transition-colors duration-200">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">{t('vibe_title')}</h1>
        <div className="size-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary transition-colors">
          <span className="material-symbols-outlined">auto_awesome</span>
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
          {Object.entries(RDA_DATA).map(([key, data]) => (
            <button
              key={key}
              onClick={() => setSelectedLifeStage(key)}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                selectedLifeStage === key
                  ? 'bg-primary/10 dark:bg-primary/20 border-primary text-primary shadow-sm'
                  : 'bg-white dark:bg-deep-charcoal border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
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
                  ? 'bg-white dark:bg-deep-charcoal border-primary shadow-sm ring-1 ring-primary/20'
                  : 'bg-white dark:bg-deep-charcoal border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
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

      {/* Refine Button */}
      <div className="fixed bottom-24 left-0 right-0 px-6 max-w-md mx-auto z-40">
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
