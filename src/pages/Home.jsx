import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/userStore';

const Home = () => {
  const { t } = useTranslation();
  const { user } = useUserStore();
  const navigate = useNavigate();

  const userName = user?.email?.split('@')[0] || t('home_default_name');

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-white dark:bg-background-dark overflow-x-hidden pb-32 transition-colors duration-200">
      <header className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full transition-colors">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>flare</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#181310] dark:text-off-white transition-colors">{t('app_title')}</h1>
            <p className="text-xs text-gray-400 font-medium">{t('home_greeting', { name: userName })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="bg-gray-50 dark:bg-gray-800 border border-primary/10 dark:border-primary/20 p-2 rounded-full shadow-sm transition-colors">
            <span className="material-symbols-outlined text-[#181310] dark:text-off-white">notifications</span>
          </button>
        </div>
      </header>

      <div className="px-6 py-4">
        <div className="ai-bubble-shape bg-gray-50 dark:bg-gray-800 border border-primary/20 dark:border-primary/40 p-6 shadow-xl shadow-primary/5 dark:shadow-primary/20 max-w-[85%] mx-auto relative transition-colors">
          <div className="flex flex-col gap-2 items-center text-center">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-primary/60">{t('home_empathetic_ai')}</span>
            </div>
            <p className="text-[#181310] dark:text-off-white text-lg font-medium leading-snug transition-colors">
              {t('home_find_vibe')}
            </p>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-50 dark:bg-gray-800 rotate-45 border-r border-b border-primary/20 dark:border-primary/40 transition-colors"></div>
        </div>
      </div>

      <main className="flex-1 px-6 py-2 flex flex-col justify-center">
        <div className="relative group">
          <div className="rounded-xl overflow-hidden shadow-2xl shadow-primary/20 bg-white dark:bg-deep-charcoal transition-colors">
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
          onClick={() => navigate('/vibe')}
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
